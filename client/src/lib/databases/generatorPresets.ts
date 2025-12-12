import type { Generator, DistroChannel, PhaseType } from '@/lib/types';

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

const GENERATOR_PRESETS: Record<string, Partial<Generator>> = {
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

export function getGenerators(): Record<string, Partial<Generator>> {
  return GENERATOR_PRESETS;
}
