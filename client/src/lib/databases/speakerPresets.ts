import type { Speaker } from '@/lib/types';

const SPEAKER_PRESETS: Record<string, Partial<Speaker>> = {
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

export function getSpeakers(): Record<string, Partial<Speaker>> {
  return SPEAKER_PRESETS;
}
