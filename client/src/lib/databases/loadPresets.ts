import type { Load } from '@/lib/types';

const LOAD_PRESETS: Record<string, Partial<Load>> = {
  fog_machine: {
    name: "Fog Machine",
    watts: 1700,
    powerFactor: 0.99,
  },
  coffee_maker: {
    name: "Coffee Maker",
    watts: 550,
    powerFactor: 1.0,
  },
  custom: {
    name: "Custom Load",
    watts: 1000,
    powerFactor: 0.95,
  },
};

export function getLoads(): Record<string, Partial<Load>> {
  return LOAD_PRESETS;
}
