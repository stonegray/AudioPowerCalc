import { useState, useCallback } from 'react';
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
import { recalculateAmplifiers, recalculateSpeakers, recalculateDistroChannels } from './calculations';

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
  hpf: index < 2 ? 30 : 80,
  lpf: index < 2 ? 100 : 16000,
  loadOhms: 8,
  energyWatts: 0,
  peakEnergyWatts: 0,
  musicPowerWatts: 0,
  gain: 0,
  effectiveZ: 8,
});

export function useSystemStore() {
  const [state, setState] = useState<SystemState>(() => {
    const saved = localStorage.getItem('audioSystemState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          globalSettings: { ...DEFAULT_GLOBAL_SETTINGS, ...parsed.globalSettings },
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
    return {
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
      generators: [],
      amplifiers: [],
      speakers: [],
      poweredSpeakers: [],
      loads: [],
      connections: [],
    };
  });

  const saveState = useCallback((newState: SystemState) => {
    const speakers = Array.isArray(newState.speakers) ? newState.speakers : [];
    const connections = Array.isArray(newState.connections) ? newState.connections : [];
    const amplifiers = Array.isArray(newState.amplifiers) ? newState.amplifiers : [];
    const generators = Array.isArray(newState.generators) ? newState.generators : [];
    
    const crestCurve = newState.globalSettings?.crestCurve || [];
    const crestAlgorithm = newState.globalSettings?.crestAlgorithm || 'average';
    const recalculatedAmplifiers = recalculateAmplifiers(amplifiers, speakers, connections, crestCurve, crestAlgorithm);
    const recalculatedSpeakers = recalculateSpeakers(speakers, recalculatedAmplifiers, connections);
    const recalculatedGenerators = recalculateDistroChannels(generators, recalculatedAmplifiers, connections);
    
    const safeState: SystemState = {
      globalSettings: { ...DEFAULT_GLOBAL_SETTINGS, ...newState.globalSettings },
      generators: recalculatedGenerators,
      amplifiers: recalculatedAmplifiers,
      speakers: recalculatedSpeakers,
      poweredSpeakers: Array.isArray(newState.poweredSpeakers) ? newState.poweredSpeakers : [],
      loads: Array.isArray(newState.loads) ? newState.loads : [],
      connections,
    };
    setState(safeState);
    localStorage.setItem('audioSystemState', JSON.stringify(safeState));
  }, []);

  const updateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    saveState({
      ...state,
      globalSettings: { ...state.globalSettings, ...settings },
    });
  }, [state, saveState]);

  const addGenerator = useCallback(() => {
    const id = `gen_${Date.now()}`;
    const newGenerator: Generator = {
      id,
      name: 'Generator',
      model: 'custom',
      type: 'standard',
      continuousWatts: 5000,
      peakWatts: 6000,
      userDerate: 0,
      phaseCount: 1,
      phaseType: 'single',
      voltage: 120,
      feederCable: { mode: 'awg', awg: 10, length: 25 },
      distroChannels: [createDefaultDistroChannel(`distro_${Date.now()}`)],
      utilizationPercent: 0,
      peakUtilizationPercent: 0,
      powerFactor: 0.95,
      ratingType: 'watts',
    };
    saveState({ ...state, generators: [...state.generators, newGenerator] });
  }, [state, saveState]);

  const updateGenerator = useCallback((id: string, updates: Partial<Generator>) => {
    saveState({
      ...state,
      generators: state.generators.map(g => g.id === id ? { ...g, ...updates } : g),
    });
  }, [state, saveState]);

  const removeGenerator = useCallback((id: string) => {
    saveState({
      ...state,
      generators: state.generators.filter(g => g.id !== id),
      connections: state.connections.filter(c => 
        !state.generators.find(g => g.id === id)?.distroChannels.some(d => d.id === c.sourceId)
      ),
    });
  }, [state, saveState]);

  const addDistroChannel = useCallback((generatorId: string) => {
    const generator = state.generators.find(g => g.id === generatorId);
    if (!generator) return;
    
    const newChannel = createDefaultDistroChannel(`distro_${Date.now()}`);
    updateGenerator(generatorId, {
      distroChannels: [...generator.distroChannels, newChannel],
    });
  }, [state.generators, updateGenerator]);

  const addAmplifier = useCallback(() => {
    const id = `amp_${Date.now()}`;
    const channels: AmpChannel[] = Array.from({ length: 4 }, (_, i) => 
      createDefaultAmpChannel(`ch_${Date.now()}_${i}`, i)
    );
    const newAmplifier: Amplifier = {
      id,
      name: 'Amplifier',
      model: 'custom',
      pmax: 1000,
      efficiency: 0.85,
      parasiticDraw: 50,
      powerFactor: 0.95,
      supportsBridging: true,
      channelCount: 4,
      channels,
      rmsWattsDrawn: 0,
      peakRmsWattsDrawn: 0,
      utilizationPercent: 0,
      peakUtilizationPercent: 0,
      minImpedance: 4,
    };
    saveState({ ...state, amplifiers: [...state.amplifiers, newAmplifier] });
  }, [state, saveState]);

  const updateAmplifier = useCallback((id: string, updates: Partial<Amplifier>) => {
    saveState({
      ...state,
      amplifiers: state.amplifiers.map(a => a.id === id ? { ...a, ...updates } : a),
    });
  }, [state, saveState]);

  const removeAmplifier = useCallback((id: string) => {
    saveState({
      ...state,
      amplifiers: state.amplifiers.filter(a => a.id !== id),
      connections: state.connections.filter(c => 
        c.targetId !== id && !state.amplifiers.find(a => a.id === id)?.channels.some(ch => ch.id === c.sourceId)
      ),
    });
  }, [state, saveState]);

  const addSpeaker = useCallback(() => {
    const id = `spk_${Date.now()}`;
    const newSpeaker: Speaker = {
      id,
      name: 'Speaker',
      model: 'custom',
      pmax: 1000,
      impedance: 8,
      nominalImpedance: 8,
      cableImpedanceMilliohms: 0,
      sensitivity: 100,
      quantity: 1,
      gain: 0,
      splOutput: 0,
      utilizationPercent: 0,
    };
    saveState({ ...state, speakers: [...state.speakers, newSpeaker] });
  }, [state, saveState]);

  const updateSpeaker = useCallback((id: string, updates: Partial<Speaker>) => {
    saveState({
      ...state,
      speakers: state.speakers.map(s => s.id === id ? { ...s, ...updates } : s),
    });
  }, [state, saveState]);

  const removeSpeaker = useCallback((id: string) => {
    saveState({
      ...state,
      speakers: state.speakers.filter(s => s.id !== id),
      connections: state.connections.filter(c => c.targetId !== id),
    });
  }, [state, saveState]);

  const addPoweredSpeaker = useCallback(() => {
    const id = `pwspk_${Date.now()}`;
    const newPoweredSpeaker: PoweredSpeaker = {
      id,
      name: 'Powered Speaker',
      model: 'custom',
      pmax: 1000,
      impedance: 8,
      sensitivity: 100,
      quantity: 1,
      gain: 0,
      powerAmplifierPmax: 500,
      efficiency: 0.85,
      parasiticDraw: 30,
      powerFactor: 0.9,
      hpf: 40,
      lpf: 16000,
      splOutput: 0,
      rmsWattsDrawn: 0,
    };
    saveState({ ...state, poweredSpeakers: [...state.poweredSpeakers, newPoweredSpeaker] });
  }, [state, saveState]);

  const updatePoweredSpeaker = useCallback((id: string, updates: Partial<PoweredSpeaker>) => {
    saveState({
      ...state,
      poweredSpeakers: state.poweredSpeakers.map(p => p.id === id ? { ...p, ...updates } : p),
    });
  }, [state, saveState]);

  const removePoweredSpeaker = useCallback((id: string) => {
    saveState({
      ...state,
      poweredSpeakers: state.poweredSpeakers.filter(p => p.id !== id),
      connections: state.connections.filter(c => c.targetId !== id),
    });
  }, [state, saveState]);

  const addConnection = useCallback((connection: Omit<Connection, 'id'>) => {
    const id = `conn_${Date.now()}`;
    let newState = {
      ...state,
      connections: [...state.connections, { ...connection, id }],
    };
    
    // If connecting distro to amp, set the amp's connectedDistroId
    if (connection.sourceType === 'distro' && connection.targetType === 'amp') {
      newState.amplifiers = newState.amplifiers.map(amp => 
        amp.id === connection.targetId 
          ? { ...amp, connectedDistroId: connection.sourceId }
          : amp
      );
    }
    
    saveState(newState);
  }, [state, saveState]);

  const removeConnection = useCallback((id: string) => {
    const connToRemove = state.connections.find(c => c.id === id);
    let newState = {
      ...state,
      connections: state.connections.filter(c => c.id !== id),
    };
    
    // If removing distro to amp connection, clear the amp's connectedDistroId
    if (connToRemove?.sourceType === 'distro' && connToRemove?.targetType === 'amp') {
      newState.amplifiers = newState.amplifiers.map(amp => 
        amp.id === connToRemove.targetId 
          ? { ...amp, connectedDistroId: undefined }
          : amp
      );
    }
    
    saveState(newState);
  }, [state, saveState]);

  const saveConfiguration = useCallback((name: string) => {
    const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
    configs[name] = state;
    localStorage.setItem('savedConfigs', JSON.stringify(configs));
  }, [state]);

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
      saveState(merged);
    }
  }, [saveState]);

  const getSavedConfigurations = useCallback((): string[] => {
    const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
    return Object.keys(configs);
  }, []);

  const clearState = useCallback(() => {
    saveState({
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
      generators: [],
      amplifiers: [],
      speakers: [],
      poweredSpeakers: [],
      loads: [],
      connections: [],
    });
  }, [saveState]);

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
