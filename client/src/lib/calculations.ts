import type { GlobalSettings, Generator, Amplifier, Speaker, AWG_RESISTANCE } from './types';

export function calculateCableResistance(
  awg: number,
  lengthFeet: number,
  awgResistance: Record<number, number>
): number {
  const resistancePerKft = awgResistance[awg] || 5;
  return (resistancePerKft * lengthFeet) / 1000;
}

export function calculateTemperatureDerate(ambientTemp: number, units: 'metric' | 'imperial'): number {
  const tempC = units === 'imperial' ? (ambientTemp - 32) * 5/9 : ambientTemp;
  if (tempC <= 25) return 1.0;
  if (tempC <= 35) return 0.95;
  if (tempC <= 45) return 0.85;
  return 0.75;
}

export function calculateAltitudeDerate(altitude: number, units: 'metric' | 'imperial'): number {
  const altitudeM = units === 'imperial' ? altitude * 0.3048 : altitude;
  if (altitudeM <= 1000) return 1.0;
  if (altitudeM <= 2000) return 0.93;
  if (altitudeM <= 3000) return 0.86;
  return 0.80;
}

export function calculateGeneratorEffectiveWatts(
  generator: Generator,
  settings: GlobalSettings
): { effectiveWatts: number; derates: { temp: number; altitude: number; user: number } } {
  const tempDerate = calculateTemperatureDerate(settings.ambientTemperature, settings.units);
  const altitudeDerate = calculateAltitudeDerate(settings.altitude, settings.units);
  const userDerate = 1 - (generator.userDerate / 100);
  
  const effectiveWatts = generator.continuousWatts * tempDerate * altitudeDerate * userDerate;
  
  return {
    effectiveWatts,
    derates: {
      temp: tempDerate,
      altitude: altitudeDerate,
      user: userDerate,
    },
  };
}

export function calculateSPL(
  sensitivity: number,
  powerWatts: number,
  quantity: number,
  arraySummationFactor: number,
  distance: '1m' | '10m' | '50m'
): number {
  const powerGain = 10 * Math.log10(powerWatts);
  const quantityGain = 3 * Math.log2(quantity) * arraySummationFactor;
  
  let distanceLoss = 0;
  if (distance === '10m') distanceLoss = 20;
  if (distance === '50m') distanceLoss = 34;
  
  return sensitivity + powerGain + quantityGain - distanceLoss;
}

export function calculateParallelImpedance(impedance: number, quantity: number): number {
  return impedance / quantity;
}

export function getCrestFactor(genre: string): number {
  switch (genre) {
    case 'bass_dubstep': return 6;
    case 'rock': return 10;
    case 'acoustic': return 15;
    default: return 12;
  }
}
