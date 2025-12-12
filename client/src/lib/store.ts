import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  SystemState, 
  GlobalSettings, 
  Generator, 
  Amplifier, 
  Speaker, 
  PoweredSpeaker,
  Connection,
  DistroChannel,
  AmpChannel 
} from './types';
import { recalculateAmplifiers, recalculateSpeakers, recalculateDistroChannels, generateCrestCurveFromGenre } from './calculations';

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  musicGenre: 'rock',
  ambientTemperature: 25,
  altitude: 0,
  units: 'metric',
  splDistance: '1m',
  arraySummationFactor: 0.91,
  appMode: 'advanced',
  crestCurve: [],
  crestAlgorithm: 'average',
  numSamples: 20,
};

const createDefaultDistroChannel = (id: string): DistroChannel => ({
  id,
  enabled: true,
  phaseSource: 1,
  ampacity: 20,
  plugType: 'NEMA-5-20',
  outputType: 'single',
  cable: { mode: 'awg', awg: 12, length: 50 },
  loadAmps: 0,
  loadWatts: 0,
  peakLoadWatts: 0,
});

const createDefaultAmpChannel = (id: string, index: number): AmpChannel => ({
  id,
  enabled: true,
  bridged: false,
  crossoverMode: index < 2 ? 'sub' : 'main',
  hpf: index < 2 ? 30 : 100,
  lpf: index < 2 ? 100 : 20000,
  qFactor: 0.707,
  loadOhms: 8,
  energyWatts: 0,
  peakEnergyWatts: 0,
  musicPowerWatts: 0,
  gain: 0,
  effectiveZ: 8,
});

const getInitialState = (): SystemState => {
  const saved = localStorage.getItem('audioSystemState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...parsed.globalSettings };
      
      if (!globalSettings.crestCurve || globalSettings.crestCurve.length === 0) {
        globalSettings.crestCurve = generateCrestCurveFromGenre(globalSettings.musicGenre);
      }
      
      return {
        globalSettings,
        generators: parsed.generators || [],
        amplifiers: parsed.amplifiers || [],
        speakers: parsed.speakers || [],
        poweredSpeakers: parsed.poweredSpeakers || [],
        loads: parsed.loads || [],
        connections: parsed.connections || [],
      };
    } catch {
      // Fall through to default
    }
  }
  
  const defaultSettings = {
    ...DEFAULT_GLOBAL_SETTINGS,
    crestCurve: generateCrestCurveFromGenre(DEFAULT_GLOBAL_SETTINGS.musicGenre),
  };
  
  return {
    globalSettings: defaultSettings,
    generators: [],
    amplifiers: [],
    speakers: [],
    poweredSpeakers: [],
    loads: [],
    connections: [],
  };
};

const computeSafeState = (newState: SystemState): SystemState => {
  const speakers = Array.isArray(newState.speakers) ? newState.speakers : [];
  const connections = Array.isArray(newState.connections) ? newState.connections : [];
  const amplifiers = Array.isArray(newState.amplifiers) ? newState.amplifiers : [];
  const generators = Array.isArray(newState.generators) ? newState.generators : [];
  
  const crestCurve = newState.globalSettings?.crestCurve || [];
  const crestAlgorithm = newState.globalSettings?.crestAlgorithm || 'average';
  const recalculatedAmplifiers = recalculateAmplifiers(amplifiers, speakers, connections, crestCurve, crestAlgorithm);
  const recalculatedSpeakers = recalculateSpeakers(speakers, recalculatedAmplifiers, connections);
  const recalculatedGenerators = recalculateDistroChannels(generators, recalculatedAmplifiers, connections);
  
  return {
    globalSettings: { ...DEFAULT_GLOBAL_SETTINGS, ...newState.globalSettings },
    generators: recalculatedGenerators,
    amplifiers: recalculatedAmplifiers,
    speakers: recalculatedSpeakers,
    poweredSpeakers: Array.isArray(newState.poweredSpeakers) ? newState.poweredSpeakers : [],
    loads: Array.isArray(newState.loads) ? newState.loads : [],
    connections,
  };
};

export function useSystemStore() {
  const [state, setState] = useState<SystemState>(getInitialState);

  const updateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        globalSettings: { ...prevState.globalSettings, ...settings },
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const addGenerator = useCallback((preset?: Partial<Generator>) => {
    setState(prevState => {
      const id = `gen_${Date.now()}`;
      const newGenerator: Generator = {
        id,
        name: preset?.name || 'Generator',
        model: preset?.model || 'custom',
        type: preset?.type || 'standard',
        continuousWatts: preset?.continuousWatts || 5000,
        peakWatts: preset?.peakWatts || 6000,
        userDerate: preset?.userDerate || 0,
        phaseCount: preset?.phaseCount || 1,
        phaseType: preset?.phaseType || 'single',
        voltage: preset?.voltage || 120,
        feederCable: preset?.feederCable || { mode: 'awg', awg: 10, length: 25 },
        distroChannels: preset?.distroChannels || [createDefaultDistroChannel(`distro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)],
        utilizationPercent: 0,
        peakUtilizationPercent: 0,
        powerFactor: preset?.powerFactor || 0.95,
        ratingType: preset?.ratingType || 'watts',
      };
      const newState = { ...prevState, generators: [...prevState.generators, newGenerator] };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const updateGenerator = useCallback((id: string, updates: Partial<Generator>) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        generators: prevState.generators.map(g => g.id === id ? { ...g, ...updates } : g),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const removeGenerator = useCallback((id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        generators: prevState.generators.filter(g => g.id !== id),
        connections: prevState.connections.filter(c => 
          !prevState.generators.find(g => g.id === id)?.distroChannels.some(d => d.id === c.sourceId)
        ),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const addDistroChannel = useCallback((generatorId: string) => {
    setState(prevState => {
      const generator = prevState.generators.find(g => g.id === generatorId);
      if (!generator) return prevState;
      
      const newChannel = createDefaultDistroChannel(`distro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      const newState = {
        ...prevState,
        generators: prevState.generators.map(g => 
          g.id === generatorId 
            ? { ...g, distroChannels: [...g.distroChannels, newChannel] }
            : g
        ),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const addAmplifier = useCallback((preset?: Partial<Amplifier>) => {
    setState(prevState => {
      const id = `amp_${Date.now()}`;
      const channelCount = preset?.channelCount || 4;
      const channels: AmpChannel[] = preset?.channels || Array.from({ length: channelCount }, (_, i) => 
        createDefaultAmpChannel(`ch_${Date.now()}_${i}`, i)
      );
      const newAmplifier: Amplifier = {
        id,
        name: preset?.name || 'Amplifier',
        model: preset?.model || 'custom',
        pmax: preset?.pmax || 1000,
        efficiency: preset?.efficiency || 0.85,
        parasiticDraw: preset?.parasiticDraw || 50,
        powerFactor: preset?.powerFactor || 0.95,
        supportsBridging: preset?.supportsBridging ?? true,
        channelCount,
        channels,
        rmsWattsDrawn: 0,
        peakRmsWattsDrawn: 0,
        utilizationPercent: 0,
        peakUtilizationPercent: 0,
        minImpedance: preset?.minImpedance || 4,
      };
      const newState = { ...prevState, amplifiers: [...prevState.amplifiers, newAmplifier] };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const updateAmplifier = useCallback((id: string, updates: Partial<Amplifier>) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        amplifiers: prevState.amplifiers.map(a => a.id === id ? { ...a, ...updates } : a),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const removeAmplifier = useCallback((id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        amplifiers: prevState.amplifiers.filter(a => a.id !== id),
        connections: prevState.connections.filter(c => 
          c.targetId !== id && !prevState.amplifiers.find(a => a.id === id)?.channels.some(ch => ch.id === c.sourceId)
        ),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const addSpeaker = useCallback((preset?: Partial<Speaker>) => {
    setState(prevState => {
      const id = `spk_${Date.now()}`;
      const newSpeaker: Speaker = {
        id,
        name: preset?.name || 'Speaker',
        model: preset?.model || 'custom',
        pmax: preset?.pmax || 1000,
        impedance: preset?.impedance || 8,
        nominalImpedance: preset?.nominalImpedance || 8,
        cableImpedanceMilliohms: preset?.cableImpedanceMilliohms || 0,
        sensitivity: preset?.sensitivity || 100,
        quantity: preset?.quantity || 1,
        gain: preset?.gain || 0,
        splOutput: 0,
        utilizationPercent: 0,
      };
      const newState = { ...prevState, speakers: [...prevState.speakers, newSpeaker] };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const updateSpeaker = useCallback((id: string, updates: Partial<Speaker>) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        speakers: prevState.speakers.map(s => s.id === id ? { ...s, ...updates } : s),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const removeSpeaker = useCallback((id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        speakers: prevState.speakers.filter(s => s.id !== id),
        connections: prevState.connections.filter(c => c.targetId !== id),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const addPoweredSpeaker = useCallback((preset?: Partial<PoweredSpeaker>) => {
    setState(prevState => {
      const id = `pwspk_${Date.now()}`;
      const newPoweredSpeaker: PoweredSpeaker = {
        id,
        name: preset?.name || 'Powered Speaker',
        model: preset?.model || 'custom',
        pmax: preset?.pmax || 1000,
        impedance: preset?.impedance || 8,
        sensitivity: preset?.sensitivity || 100,
        quantity: preset?.quantity || 1,
        gain: preset?.gain || 0,
        powerAmplifierPmax: preset?.powerAmplifierPmax || 500,
        efficiency: preset?.efficiency || 0.85,
        parasiticDraw: preset?.parasiticDraw || 30,
        powerFactor: preset?.powerFactor || 0.9,
        hpf: preset?.hpf || 40,
        lpf: preset?.lpf || 16000,
        splOutput: 0,
        rmsWattsDrawn: 0,
      };
      const newState = { ...prevState, poweredSpeakers: [...prevState.poweredSpeakers, newPoweredSpeaker] };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const updatePoweredSpeaker = useCallback((id: string, updates: Partial<PoweredSpeaker>) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        poweredSpeakers: prevState.poweredSpeakers.map(p => p.id === id ? { ...p, ...updates } : p),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const removePoweredSpeaker = useCallback((id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        poweredSpeakers: prevState.poweredSpeakers.filter(p => p.id !== id),
        connections: prevState.connections.filter(c => c.targetId !== id),
      };
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const addConnection = useCallback((connection: Omit<Connection, 'id'>) => {
    setState(prevState => {
      const id = `conn_${Date.now()}`;
      let newState = {
        ...prevState,
        connections: [...prevState.connections, { ...connection, id }],
      };
      
      if (connection.sourceType === 'distro' && connection.targetType === 'amp') {
        newState.amplifiers = newState.amplifiers.map(amp => 
          amp.id === connection.targetId 
            ? { ...amp, connectedDistroId: connection.sourceId }
            : amp
        );
      }
      
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const removeConnection = useCallback((id: string) => {
    setState(prevState => {
      const connToRemove = prevState.connections.find(c => c.id === id);
      let newState = {
        ...prevState,
        connections: prevState.connections.filter(c => c.id !== id),
      };
      
      if (connToRemove?.sourceType === 'distro' && connToRemove?.targetType === 'amp') {
        newState.amplifiers = newState.amplifiers.map(amp => 
          amp.id === connToRemove.targetId 
            ? { ...amp, connectedDistroId: undefined }
            : amp
        );
      }
      
      const safeState = computeSafeState(newState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
      return safeState;
    });
  }, []);

  const saveConfiguration = useCallback((name: string) => {
    setState(prevState => {
      const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
      configs[name] = prevState;
      localStorage.setItem('savedConfigs', JSON.stringify(configs));
      return prevState;
    });
  }, []);

  const loadConfiguration = useCallback((name: string) => {
    const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
    if (configs[name]) {
      const loaded = configs[name];
      const merged: SystemState = {
        globalSettings: { ...DEFAULT_GLOBAL_SETTINGS, ...loaded.globalSettings },
        generators: loaded.generators || [],
        amplifiers: loaded.amplifiers || [],
        speakers: loaded.speakers || [],
        poweredSpeakers: loaded.poweredSpeakers || [],
        loads: loaded.loads || [],
        connections: loaded.connections || [],
      };
      const safeState = computeSafeState(merged);
      setState(safeState);
      localStorage.setItem('audioSystemState', JSON.stringify(safeState));
    }
  }, []);

  const getSavedConfigurations = useCallback((): string[] => {
    const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
    return Object.keys(configs);
  }, []);

  const clearState = useCallback(() => {
    const defaultState: SystemState = {
      globalSettings: {
        ...DEFAULT_GLOBAL_SETTINGS,
        crestCurve: generateCrestCurveFromGenre(DEFAULT_GLOBAL_SETTINGS.musicGenre),
      },
      generators: [],
      amplifiers: [],
      speakers: [],
      poweredSpeakers: [],
      loads: [],
      connections: [],
    };
    const safeState = computeSafeState(defaultState);
    setState(safeState);
    localStorage.setItem('audioSystemState', JSON.stringify(safeState));
  }, []);

  return {
    state,
    updateGlobalSettings,
    addGenerator,
    updateGenerator,
    removeGenerator,
    addDistroChannel,
    addAmplifier,
    updateAmplifier,
    removeAmplifier,
    addSpeaker,
    updateSpeaker,
    removeSpeaker,
    addPoweredSpeaker,
    updatePoweredSpeaker,
    removePoweredSpeaker,
    addConnection,
    removeConnection,
    saveConfiguration,
    loadConfiguration,
    getSavedConfigurations,
    clearState,
  };
}
