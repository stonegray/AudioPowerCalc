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
}

export interface Connection {
  id: string;
  sourceId: string;
  sourceType: "distro" | "ampChannel";
  targetId: string;
  targetType: "amp" | "poweredSpeaker" | "speaker";
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

const createDistroChannelPreset = (
  id: string,
  phaseSource: number = 1,
  ampacity: number = 20,
  plugType: string = "NEMA-5-20",
  outputType: PhaseType = "single"
): DistroChannel => ({
  id,
  enabled: true,
  phaseSource,
  ampacity,
  plugType,
  outputType,
  cable: { mode: "awg", awg: 12, length: 50 },
  loadAmps: 0,
  loadWatts: 0,
  peakLoadWatts: 0,
});

export const GENERATOR_PRESETS: Record<string, Partial<Generator>> = {
  honda_3000i: {
    name: "Honda EU3000i",
    type: "inverter",
    continuousWatts: 2800,
    peakWatts: 3000,
    phaseCount: 1,
    phaseType: "single",
    voltage: 120,
    powerFactor: 1.0,
    ratingType: "watts",
    distroChannels: [createDistroChannelPreset("distro_default", 1, 20, "NEMA-5-20")],
  },
  honda_3000is: {
    name: "Honda EU3000iS",
    type: "inverter",
    continuousWatts: 2800,
    peakWatts: 3000,
    phaseCount: 1,
    phaseType: "single",
    voltage: 125,
    powerFactor: 1.0,
    ratingType: "watts",
    distroChannels: [
      createDistroChannelPreset("distro_20a", 1, 20, "NEMA-5-20"),
      createDistroChannelPreset("distro_30a", 1, 30, "30A Twist Lock"),
    ],
  },
  honda_7000i: {
    name: "Honda EU7000i",
    type: "inverter",
    continuousWatts: 5500,
    peakWatts: 7000,
    phaseCount: 1,
    phaseType: "single",
    voltage: 120,
    powerFactor: 1.0,
    ratingType: "watts",
    distroChannels: [createDistroChannelPreset("distro_default", 1, 20, "NEMA-5-20")],
  },
  shore_power: {
    name: "Shore Power",
    type: "shore",
    continuousWatts: 12000,
    peakWatts: 15000,
    phaseCount: 1,
    phaseType: "single",
    voltage: 120,
    powerFactor: 0.95,
    ratingType: "watts",
    distroChannels: [createDistroChannelPreset("distro_default", 1, 20, "NEMA-5-20")],
  },
  trailer_50k_3ph: {
    name: "Trailer 50kW 3-Phase",
    type: "standard",
    continuousWatts: 50000,
    peakWatts: 55000,
    phaseCount: 3,
    phaseType: "3_wye",
    voltage: 208,
    powerFactor: 0.9,
    ratingType: "watts",
    distroChannels: [
      createDistroChannelPreset("distro_phase1", 1, 20, "CamLok"),
      createDistroChannelPreset("distro_phase2", 2, 20, "CamLok"),
      createDistroChannelPreset("distro_phase3", 3, 20, "CamLok"),
    ],
  },
  custom: {
    name: "Custom Generator",
    type: "standard",
    continuousWatts: 5000,
    peakWatts: 6000,
    phaseCount: 1,
    phaseType: "single",
    voltage: 120,
    powerFactor: 0.95,
    ratingType: "watts",
    distroChannels: [createDistroChannelPreset("distro_default", 1, 20, "NEMA-5-20")],
  },
};

export const AMPLIFIER_PRESETS: Record<string, Partial<Amplifier>> = {
  powersoft_x4: {
    name: "Powersoft X4",
    // pmax = max per channel @ 4Ω (manufacturer spec)
    pmax: 3000,
    // Efficiency and PF are typical for modern Class-D/PFC touring amps (estimated)
    efficiency: 0.92, // estimate (Powersoft advertises very high Class-D efficiency)
    parasiticDraw: 100, // idle <100 W (manufacturer lists "Idle <100 W")
    powerFactor: 0.95, // has active PFC (estimated)
    supportsBridging: true,
    channelCount: 4,
    minImpedance: 2,
  },

  labgruppen_fp10000q: {
    name: "Lab.Gruppen FP 10000Q",
    // pmax = typical published per-channel @ 4Ω
    pmax: 2100,
    // Class-TD (Lab.Gruppen) gives good efficiency; exact % not published — estimated.
    efficiency: 0.88, // estimate for Class-TD (Class-D like efficiency)
    parasiticDraw: 70, // measured/technical-doc tables show relatively low idle thermal loss (~table values -> ~68 W)
    powerFactor: 0.95, // R.SMPS with good power handling (estimated)
    supportsBridging: true,
    channelCount: 4,
    minImpedance: 2,
  },

  qsc_cxd4_3: {
    name: "QSC CXD4.3",
    // pmax = published per-channel @ 4Ω (model CXD4.3)
    pmax: 1400,
    // QSC CXD is Class-D with PFC and multi-stage sleep modes; efficiency high.
    efficiency: 0.9, // estimate (QSC advertises "very high efficiency")
    // QSC manual provides idle thermal-loss = 225 BTU/hr -> ≈ 66 W idle parasitic heat
    parasiticDraw: 66,
    powerFactor: 0.95, // CXD4.3 includes PFC (manufacturer)
    supportsBridging: true,
    channelCount: 4,
    minImpedance: 2,
  },

  crown_xli2500: {
    name: "Crown XLi 2500",
    // pmax = published per-channel @ 4Ω
    pmax: 750,
    // older Class-AB topology, lower efficiency than Class-D
    efficiency: 0.6, // estimate for Class-AB touring amp
    // Crown publishes AC power-draw/thermal tables — idle figures cluster ~35–60 W depending on mains; use 40W as a conservative typical idle.
    parasiticDraw: 40,
    powerFactor: 0.8, // typical non-PFC older design (estimate)
    supportsBridging: true,
    channelCount: 2,
    minImpedance: 4,
  },
  custom: {
    name: "Custom Amplifier",
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
  la_ks28: {
    name: "L-Acoustics KS28",
    pmax: 2800,
    impedance: 4,
    nominalImpedance: 4,
    sensitivity: 103,
    cableImpedanceMilliohms: 0,
  },
  la_k2: {
    name: "L-Acoustics K2",
    pmax: 1400,
    impedance: 8,
    nominalImpedance: 8,
    sensitivity: 141,
    cableImpedanceMilliohms: 0,
  },
  jbl_vtx_s28: {
    name: "JBL VTX S28",
    pmax: 2000,
    impedance: 4,
    nominalImpedance: 4,
    sensitivity: 101,
    cableImpedanceMilliohms: 0,
  },
  custom: {
    name: "Custom Speaker",
    pmax: 1000,
    impedance: 8,
    nominalImpedance: 8,
    sensitivity: 100,
    cableImpedanceMilliohms: 0,
  },
};

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
