export type MusicGenre = 'bass_dubstep' | 'rock' | 'acoustic' | 'custom';
export type GeneratorType = 'inverter' | 'standard' | 'shore';
export type PhaseType = 'single' | 'split' | '3_delta' | '3_wye';
export type Units = 'metric' | 'imperial';
export type SPLDistance = '1m' | '10m' | '50m';
export type CableInputMode = 'awg' | 'manual';
export type AppMode = 'basic' | 'advanced' | 'engineering';

export interface CrestCurvePoint {
  frequency: number;
  crestFactor: number;
}

export interface GlobalSettings {
  musicGenre: MusicGenre;
  ambientTemperature: number;
  altitude: number;
  units: Units;
  splDistance: SPLDistance;
  arraySummationFactor: number;
  appMode: AppMode;
  crestCurve: CrestCurvePoint[];
}

export const GENRE_CREST_PRESETS: Record<MusicGenre, CrestCurvePoint[]> = {
  bass_dubstep: [
    { frequency: 10, crestFactor: 3 },
    { frequency: 60, crestFactor: 4 },
    { frequency: 120, crestFactor: 6 },
    { frequency: 500, crestFactor: 8 },
    { frequency: 2000, crestFactor: 10 },
    { frequency: 8000, crestFactor: 12 },
    { frequency: 20000, crestFactor: 14 },
  ],
  rock: [
    { frequency: 10, crestFactor: 6 },
    { frequency: 100, crestFactor: 8 },
    { frequency: 500, crestFactor: 10 },
    { frequency: 2000, crestFactor: 12 },
    { frequency: 8000, crestFactor: 12 },
    { frequency: 20000, crestFactor: 10 },
  ],
  acoustic: [
    { frequency: 10, crestFactor: 10 },
    { frequency: 100, crestFactor: 12 },
    { frequency: 500, crestFactor: 14 },
    { frequency: 2000, crestFactor: 16 },
    { frequency: 8000, crestFactor: 18 },
    { frequency: 20000, crestFactor: 18 },
  ],
  custom: [
    { frequency: 10, crestFactor: 6 },
    { frequency: 100, crestFactor: 8 },
    { frequency: 1000, crestFactor: 10 },
    { frequency: 10000, crestFactor: 12 },
    { frequency: 20000, crestFactor: 12 },
  ],
};

export interface CableConfig {
  mode: CableInputMode;
  awg?: number;
  length?: number;
  manualResistance?: number;
}

export interface DistroChannel {
  id: string;
  enabled: boolean;
  phaseSource: number;
  ampacity: number;
  outputType: PhaseType;
  cable: CableConfig;
  loadAmps: number;
  loadWatts: number;
}

export interface Generator {
  id: string;
  name: string;
  model: string;
  type: GeneratorType;
  continuousWatts: number;
  peakWatts: number;
  userDerate: number;
  phaseCount: 1 | 2 | 3;
  phaseType: PhaseType;
  voltage: number;
  feederCable: CableConfig;
  distroChannels: DistroChannel[];
  utilizationPercent: number;
}

export interface AmpChannel {
  id: string;
  enabled: boolean;
  bridged: boolean;
  hpf: number;
  lpf: number;
  loadOhms: number;
  energyWatts: number;
  musicPowerWatts: number;
  gain: number;
  effectiveZ: number;
}

export interface Amplifier {
  id: string;
  name: string;
  model: string;
  pmax: number;
  efficiency: number;
  parasiticDraw: number;
  powerFactor: number;
  supportsBridging: boolean;
  channelCount: 1 | 2 | 4 | 8;
  channels: AmpChannel[];
  rmsWattsDrawn: number;
  utilizationPercent: number;
  minImpedance: number;
  connectedDistroId?: string;
}

export interface Speaker {
  id: string;
  name: string;
  model: string;
  pmaxAES: number;
  impedance: number;
  nominalImpedance: number;
  actualImpedance?: number;
  cableImpedanceMilliohms: number;
  sensitivity: number;
  quantity: number;
  gain: number;
  splOutput: number;
  utilizationPercent: number;
  connectedAmpChannelId?: string;
}

export interface PoweredSpeaker {
  id: string;
  name: string;
  model: string;
  pmaxAES: number;
  impedance: number;
  sensitivity: number;
  quantity: number;
  gain: number;
  pmax: number;
  efficiency: number;
  parasiticDraw: number;
  powerFactor: number;
  hpf: number;
  lpf: number;
  splOutput: number;
  rmsWattsDrawn: number;
  connectedDistroId?: string;
}

export interface Connection {
  id: string;
  sourceId: string;
  sourceType: 'distro' | 'ampChannel';
  targetId: string;
  targetType: 'amp' | 'poweredSpeaker' | 'speaker';
  color: string;
}

export interface SystemState {
  globalSettings: GlobalSettings;
  generators: Generator[];
  amplifiers: Amplifier[];
  speakers: Speaker[];
  poweredSpeakers: PoweredSpeaker[];
  connections: Connection[];
}

export const GENERATOR_PRESETS: Record<string, Partial<Generator>> = {
  'honda_3000i': {
    name: 'Honda EU3000i',
    type: 'inverter',
    continuousWatts: 2800,
    peakWatts: 3000,
    phaseCount: 1,
    phaseType: 'single',
    voltage: 120,
  },
  'honda_7000i': {
    name: 'Honda EU7000i',
    type: 'inverter',
    continuousWatts: 5500,
    peakWatts: 7000,
    phaseCount: 1,
    phaseType: 'single',
    voltage: 120,
  },
  'shore_power': {
    name: 'Shore Power',
    type: 'shore',
    continuousWatts: 12000,
    peakWatts: 15000,
    phaseCount: 1,
    phaseType: 'single',
    voltage: 120,
  },
  'trailer_50k_3ph': {
    name: 'Trailer 50kW 3-Phase',
    type: 'standard',
    continuousWatts: 50000,
    peakWatts: 55000,
    phaseCount: 3,
    phaseType: '3_wye',
    voltage: 208,
  },
  'custom': {
    name: 'Custom Generator',
    type: 'standard',
    continuousWatts: 5000,
    peakWatts: 6000,
    phaseCount: 1,
    phaseType: 'single',
    voltage: 120,
  },
};

export const AMPLIFIER_PRESETS: Record<string, Partial<Amplifier>> = {
  'la_la12x': {
    name: 'L-Acoustics LA12X',
    pmax: 3300,
    efficiency: 0.85,
    parasiticDraw: 50,
    powerFactor: 0.95,
    supportsBridging: true,
    channelCount: 4,
    minImpedance: 2,
  },
  'powersoft_x4': {
    name: 'Powersoft X4',
    pmax: 2000,
    efficiency: 0.90,
    parasiticDraw: 40,
    powerFactor: 0.92,
    supportsBridging: true,
    channelCount: 4,
    minImpedance: 2,
  },
  'crown_dci': {
    name: 'Crown DCi 4|1250N',
    pmax: 1250,
    efficiency: 0.80,
    parasiticDraw: 60,
    powerFactor: 0.90,
    supportsBridging: true,
    channelCount: 4,
    minImpedance: 4,
  },
  'crown_dva2': {
    name: 'Crown CDi 2|600',
    pmax: 600,
    efficiency: 0.82,
    parasiticDraw: 35,
    powerFactor: 0.92,
    supportsBridging: true,
    channelCount: 2,
    minImpedance: 4,
  },
  'behringer_2ch': {
    name: 'Behringer NX2000 2-Channel',
    pmax: 500,
    efficiency: 0.78,
    parasiticDraw: 30,
    powerFactor: 0.90,
    supportsBridging: false,
    channelCount: 2,
    minImpedance: 4,
  },
  'custom': {
    name: 'Custom Amplifier',
    pmax: 1000,
    efficiency: 0.85,
    parasiticDraw: 50,
    powerFactor: 0.95,
    supportsBridging: false,
    channelCount: 2,
    minImpedance: 4,
  },
};

export const SPEAKER_PRESETS: Record<string, Partial<Speaker>> = {
  'la_ks28': {
    name: 'L-Acoustics KS28',
    pmaxAES: 2800,
    impedance: 4,
    nominalImpedance: 4,
    sensitivity: 103,
    cableImpedanceMilliohms: 0,
  },
  'la_k2': {
    name: 'L-Acoustics K2',
    pmaxAES: 1400,
    impedance: 8,
    nominalImpedance: 8,
    sensitivity: 141,
    cableImpedanceMilliohms: 0,
  },
  'jbl_vtx_s28': {
    name: 'JBL VTX S28',
    pmaxAES: 2000,
    impedance: 4,
    nominalImpedance: 4,
    sensitivity: 101,
    cableImpedanceMilliohms: 0,
  },
  'custom': {
    name: 'Custom Speaker',
    pmaxAES: 1000,
    impedance: 8,
    nominalImpedance: 8,
    sensitivity: 100,
    cableImpedanceMilliohms: 0,
  },
};

export const CONNECTION_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export const AWG_RESISTANCE: Record<number, number> = {
  18: 20.95,
  16: 13.17,
  14: 8.282,
  12: 5.211,
  10: 3.277,
  8: 2.061,
  6: 1.296,
  4: 0.815,
  2: 0.512,
};
