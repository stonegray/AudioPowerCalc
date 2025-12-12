export type MusicGenre = "bass_dubstep" | "rock" | "acoustic" | "white_noise" | "custom";
export type GeneratorType = "inverter" | "standard" | "shore";
export type PhaseType = "single" | "split" | "3_delta" | "3_wye";
export type Units = "metric" | "imperial";
export type SPLDistance = "1m" | "10m" | "50m";
export type CableInputMode = "awg" | "manual";
export type AppMode = "basic" | "advanced" | "engineering";
export type CrestAlgorithm = "average" | "peak" | "maximum" | "rms_weighted";

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
  crestAlgorithm: CrestAlgorithm;
  numSamples: number;
}

export interface GenrePreset {
  name: string;
  crestCurveFormula: string;
  timeWindowFormula: string;
  description: string;
}

export const GENRE_PRESETS: Record<MusicGenre, GenrePreset> = {
  bass_dubstep: {
    name: "Bass/Dubstep/Drum & Bass",
    crestCurveFormula: "7.836251 + (1.774292 - 7.836251)/(1 + (f/107.2078)^11.43433)",
    timeWindowFormula: "",
    description: "Heavy bass, high power draw peaks. This preset is frequency-aware, so set your crossover points on the amplifiers for accurate consumption.",
  },
  rock: {
    name: "Rock",
    crestCurveFormula: "8",
    timeWindowFormula: "",
    description: "Moderate dynamics, balanced consumption (Fixed CF=8dB)",
  },
  acoustic: {
    name: "Acoustic/Classical",
    crestCurveFormula: "10",
    timeWindowFormula: "",
    description: "Wide dynamics, lower average power (Fixed CF=10dB)",
  },
  white_noise: {
    name: "White Noise/Test Tones",
    crestCurveFormula: "0",
    timeWindowFormula: "",
    description: "Sustained levels, consistent power",
  },
  custom: {
    name: "Custom",
    crestCurveFormula: "7.836251 + (1.774292 - 7.836251)/(1 + (f/107.2078)^11.43433)",
    timeWindowFormula: "",
    description: "Custom configuration",
  },
};

export interface CableConfig {
  mode: CableInputMode;
  awg?: number;
  length?: number;
  manualResistance?: number;
}

export interface DistroLoadInfo {
  ampId: string;
  ampName: string;
  watts: number;
  peakWatts: number;
  powerFactor: number;
  va: number;
  peakVa: number;
}

export interface DistroChannel {
  id: string;
  enabled: boolean;
  phaseSource: number;
  ampacity: number;
  plugType: string;
  outputType: PhaseType;
  cable: CableConfig;
  loadAmps: number;
  loadWatts: number;
  peakLoadWatts: number;
  connectedLoads?: DistroLoadInfo[];
  aggregatePowerFactor?: number;
  totalVa?: number;
  peakTotalVa?: number;
}

export interface PowerFactorDebug {
  totalWatts: number;
  totalVa: number;
  aggregatePowerFactor: number;
  kvaCapacity: number;
  wattsCapacity: number;
  utilizationByVa: number;
  utilizationByWatts: number;
  powerFactorPenalty: number;
  explanation: string;
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
  peakUtilizationPercent: number;
  powerFactor: number;
  ratingType: 'watts' | 'kva';
  powerFactorDebug?: PowerFactorDebug;
  hideFeeder?: boolean;
  readOnly?: boolean;
  verified?: boolean;
}

export interface AmpChannel {
  id: string;
  enabled: boolean;
  bridged: boolean;
  hpf: number;
  lpf: number;
  loadOhms: number;
  energyWatts: number;
  peakEnergyWatts: number;
  musicPowerWatts: number;
  gain: number;
  effectiveZ: number;
  averageCrest?: number;
  peakCrest?: number;
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
  peakRmsWattsDrawn: number;
  utilizationPercent: number;
  peakUtilizationPercent: number;
  minImpedance: number;
  connectedDistroId?: string;
}

export interface Speaker {
  id: string;
  name: string;
  model: string;
  pmax: number;
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
  pmax: number;
  impedance: number;
  sensitivity: number;
  quantity: number;
  gain: number;
  powerAmplifierPmax: number;
  efficiency: number;
  parasiticDraw: number;
  powerFactor: number;
  hpf: number;
  lpf: number;
  splOutput: number;
  rmsWattsDrawn: number;
  connectedDistroId?: string;
  verified?: boolean;
}

export interface Load {
  id: string;
  name: string;
  model: string;
  watts: number;
  powerFactor: number;
  connectedDistroId?: string;
}

export interface Connection {
  id: string;
  sourceId: string;
  sourceType: "distro" | "ampChannel";
  targetId: string;
  targetType: "amp" | "poweredSpeaker" | "speaker" | "load";
  color: string;
}

export interface SystemState {
  globalSettings: GlobalSettings;
  generators: Generator[];
  amplifiers: Amplifier[];
  speakers: Speaker[];
  poweredSpeakers: PoweredSpeaker[];
  loads: Load[];
  connections: Connection[];
}

import { getGenerators } from '@/lib/databases/generatorPresets';
import { getAmplifiers } from '@/lib/databases/amplifierPresets';
import { getSpeakers } from '@/lib/databases/speakerPresets';
import { getPoweredSpeakers } from '@/lib/databases/poweredSpeakerPresets';
import { getLoads } from '@/lib/databases/loadPresets';

export const GENERATOR_PRESETS = getGenerators();
export const AMPLIFIER_PRESETS = getAmplifiers();
export const SPEAKER_PRESETS = getSpeakers();
export const POWERED_SPEAKER_PRESETS = getPoweredSpeakers();
export const LOAD_PRESETS = getLoads();

export const CONNECTION_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
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
