import type { Amplifier } from '@/lib/types';

const AMPLIFIER_PRESETS: Record<string, Partial<Amplifier>> = {
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

export function getAmplifiers(): Record<string, Partial<Amplifier>> {
  return AMPLIFIER_PRESETS;
}
