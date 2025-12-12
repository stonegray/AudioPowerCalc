import type { GlobalSettings, Generator, Amplifier, Speaker, Connection, AmpChannel, CrestCurvePoint, DistroLoadInfo, PowerFactorDebug } from './types';
import { AWG_RESISTANCE } from './types';

// Power factor conversions
export function kvaToWatts(kva: number, powerFactor: number): number {
  return kva * Math.max(0.01, Math.min(1, powerFactor));
}

export function wattsToKva(watts: number, powerFactor: number): number {
  const pf = Math.max(0.01, Math.min(1, powerFactor));
  return pf > 0 ? watts / pf : 0;
}

export function calculateCableResistance(
  awg: number,
  lengthFeet: number,
  awgResistance: Record<number, number>
): number {
  const resistancePerKft = awgResistance[awg] || 5;
  return (resistancePerKft * lengthFeet) / 1000;
}

export function calculateTemperatureDerate(ambientTempC: number): number {
  if (ambientTempC <= 40) return 1.0;
  const deratePercent = (ambientTempC - 40) * 2;
  return Math.max(0, 1 - (deratePercent / 100));
}

export function calculateAltitudeDerate(altitudeMeters: number): number {
  if (altitudeMeters <= 0) return 1.0;
  const altitudeFeet = altitudeMeters * 3.28084;
  const deratePercent = (altitudeFeet / 1000) * 4;
  return Math.max(0, 1 - (deratePercent / 100));
}

export function getFeederCableResistance(cable: { mode: string; awg?: number; length?: number; manualResistance?: number }): number {
  if (cable.mode === 'manual') {
    return (cable.manualResistance || 0) / 1000;
  }
  if (cable.mode === 'awg' && cable.awg && cable.length) {
    return calculateCableResistance(cable.awg, cable.length, AWG_RESISTANCE);
  }
  return 0;
}

export function calculateFeederLosses(
  generator: Generator,
  totalLoadWatts: number
): { resistanceOhms: number; currentAmps: number; powerLossWatts: number; voltageDrop: number; voltageAtDistro: number } {
  const resistanceOhms = getFeederCableResistance(generator.feederCable);
  
  const phases = generator.phaseCount === 3 ? 3 : 1;
  const voltage = generator.voltage;
  
  const currentAmps = phases === 3
    ? totalLoadWatts / (voltage * Math.sqrt(3))
    : totalLoadWatts / voltage;
  
  const powerLossWatts = Math.pow(currentAmps, 2) * resistanceOhms;
  const voltageDrop = currentAmps * resistanceOhms;
  const voltageAtDistro = Math.max(0, voltage - voltageDrop);
  
  return {
    resistanceOhms,
    currentAmps,
    powerLossWatts,
    voltageDrop,
    voltageAtDistro,
  };
}

export function generateDerateDescriptions(
  generator: Generator,
  settings: GlobalSettings,
  totalLoadWatts: number = 0
): { temp: string; altitude: string; user: string; feeder: string; voltageAtDistro: string } {
  const tempDerate = calculateTemperatureDerate(settings.ambientTemperature);
  const tempLoss = (1 - tempDerate) * 100;
  const tempOverBase = Math.max(0, settings.ambientTemperature - 40);
  
  const altitudeDerate = calculateAltitudeDerate(settings.altitude);
  const altLoss = (1 - altitudeDerate) * 100;
  const altitudeFeet = settings.altitude * 3.28084;
  
  const userDerate = 1 - (generator.userDerate / 100);
  
  const tempDesc = tempOverBase > 0
    ? `Temp: ${tempLoss.toFixed(2)}% (+${tempOverBase.toFixed(0)}°C over 40°C @ 2%/°C)`
    : 'Temp: 0% (≤40°C)';
  
  const altDesc = altitudeFeet > 0
    ? `Alt: ${altLoss.toFixed(2)}% (+${(altitudeFeet / 1000).toFixed(1)}k ft @ 4%/1k ft)`
    : 'Alt: 0% (sea level)';
  
  const userDesc = `User: ${((1 - userDerate) * 100).toFixed(1)}%`;
  
  const feederLosses = calculateFeederLosses(generator, totalLoadWatts);
  const feederDesc = feederLosses.powerLossWatts > 0
    ? `Feeder: ${feederLosses.powerLossWatts.toFixed(0)}W loss (${feederLosses.currentAmps.toFixed(1)}A, ${feederLosses.voltageDrop.toFixed(2)}V drop)`
    : 'Feeder: 0W loss (no load)';
  
  const voltageDesc = `Distro: ${feederLosses.voltageAtDistro.toFixed(2)}V`;
  
  return { temp: tempDesc, altitude: altDesc, user: userDesc, feeder: feederDesc, voltageAtDistro: voltageDesc };
}

export function calculateGeneratorEffectiveWatts(
  generator: Generator,
  settings: GlobalSettings
): { effectiveWatts: number; derates: { temp: number; altitude: number; user: number } } {
  const tempDerate = calculateTemperatureDerate(settings.ambientTemperature);
  const altitudeDerate = calculateAltitudeDerate(settings.altitude);
  const userDerate = 1 - (generator.userDerate / 100);
  
  // Convert KVA to watts if needed
  const continuousWatts = generator.ratingType === 'kva' 
    ? kvaToWatts(generator.continuousWatts, generator.powerFactor)
    : generator.continuousWatts;
  
  const effectiveWatts = continuousWatts * tempDerate * altitudeDerate * userDerate;
  
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
    case 'white_noise': return 0;
    default: return 12;
  }
}

export function calculateChannelEffectiveZ(
  connectedSpeakers: Speaker[]
): number {
  if (connectedSpeakers.length === 0) return 8;
  
  let totalConductance = 0;
  for (const speaker of connectedSpeakers) {
    // Use actual impedance if set, otherwise use nominal, fallback to impedance
    const nominalZ = speaker.nominalImpedance ?? speaker.impedance ?? 8;
    const speakerImpedance = speaker.actualImpedance !== undefined && speaker.actualImpedance > 0 
      ? speaker.actualImpedance 
      : nominalZ;
    
    // Add cable impedance (convert from milliohms to ohms)
    const cableImpedanceOhms = (speaker.cableImpedanceMilliohms ?? 0) / 1000;
    const totalImpedance = speakerImpedance + cableImpedanceOhms;
    
    totalConductance += speaker.quantity / totalImpedance;
  }
  
  return totalConductance > 0 ? 1 / totalConductance : 8;
}

// Interpolate crest factor at a specific frequency from the crest curve
function interpolateCrest(crestCurve: CrestCurvePoint[], frequency: number): number {
  if (crestCurve.length === 0) return 8; // Default crest factor
  
  // Sort by frequency
  const sorted = [...crestCurve].sort((a, b) => a.frequency - b.frequency);
  
  // If frequency is below the lowest point, return the lowest crest
  if (frequency <= sorted[0].frequency) {
    return sorted[0].crestFactor;
  }
  
  // If frequency is above the highest point, return the highest crest
  if (frequency >= sorted[sorted.length - 1].frequency) {
    return sorted[sorted.length - 1].crestFactor;
  }
  
  // Find the two points to interpolate between
  for (let i = 0; i < sorted.length - 1; i++) {
    if (frequency >= sorted[i].frequency && frequency <= sorted[i + 1].frequency) {
      const f1 = sorted[i].frequency;
      const f2 = sorted[i + 1].frequency;
      const c1 = sorted[i].crestFactor;
      const c2 = sorted[i + 1].crestFactor;
      
      // Logarithmic interpolation for frequency
      const logF = Math.log10(frequency);
      const logF1 = Math.log10(f1);
      const logF2 = Math.log10(f2);
      const t = (logF - logF1) / (logF2 - logF1);
      
      return c1 + t * (c2 - c1);
    }
  }
  
  return 8;
}

// Sample crest factors between HPF and LPF with logarithmic spacing
function sampleCrestFactors(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[],
  numSamples: number = 20
): number[] {
  const samples: number[] = [];
  const logHpf = Math.log10(Math.max(1, hpf));
  const logLpf = Math.log10(Math.max(1, lpf));
  
  for (let i = 0; i <= numSamples; i++) {
    const logFreq = logHpf + (i / numSamples) * (logLpf - logHpf);
    const freq = Math.pow(10, logFreq);
    samples.push(interpolateCrest(crestCurve, freq));
  }
  
  return samples;
}

// Average crest factor - arithmetic mean across HPF/LPF window
function calculateAverageCrestInternal(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[]
): number {
  const samples = sampleCrestFactors(hpf, lpf, crestCurve);
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

// Minimum crest factor - most conservative, assumes worst-case energy draw
function calculateMinimumCrest(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[]
): number {
  const samples = sampleCrestFactors(hpf, lpf, crestCurve);
  return Math.min(...samples);
}

// Maximum crest factor - most optimistic, assumes best-case energy draw
function calculateMaximumCrest(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[]
): number {
  const samples = sampleCrestFactors(hpf, lpf, crestCurve);
  return Math.max(...samples);
}

// RMS-weighted crest factor - weights lower frequencies more heavily
// (typical audio content has more energy at lower frequencies)
function calculateRmsWeightedCrest(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[]
): number {
  const numSamples = 20;
  const logHpf = Math.log10(Math.max(1, hpf));
  const logLpf = Math.log10(Math.max(1, lpf));
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i <= numSamples; i++) {
    const logFreq = logHpf + (i / numSamples) * (logLpf - logHpf);
    const freq = Math.pow(10, logFreq);
    const crest = interpolateCrest(crestCurve, freq);
    
    // Weight inversely proportional to frequency (lower freqs have more energy)
    const weight = 1 / Math.sqrt(freq);
    weightedSum += crest * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 8;
}

export type CrestAlgorithmType = "average" | "peak" | "maximum" | "rms_weighted";

// Calculate crest factor between HPF and LPF frequencies using selected algorithm
export function calculateCrestWithAlgorithm(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[],
  algorithm: CrestAlgorithmType = "average"
): number {
  if (crestCurve.length === 0) return 8;
  if (hpf >= lpf) return interpolateCrest(crestCurve, hpf);
  
  switch (algorithm) {
    case "peak":
      return calculateMinimumCrest(hpf, lpf, crestCurve);
    case "maximum":
      return calculateMaximumCrest(hpf, lpf, crestCurve);
    case "rms_weighted":
      return calculateRmsWeightedCrest(hpf, lpf, crestCurve);
    case "average":
    default:
      return calculateAverageCrestInternal(hpf, lpf, crestCurve);
  }
}

// Calculate peak crest factor (minimum crest = highest energy)
export function calculatePeakCrest(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[]
): number {
  if (crestCurve.length === 0) return 8;
  if (hpf >= lpf) return interpolateCrest(crestCurve, hpf);
  return calculateMinimumCrest(hpf, lpf, crestCurve);
}

// Legacy function for backward compatibility
export function calculateAverageCrest(
  hpf: number,
  lpf: number,
  crestCurve: CrestCurvePoint[]
): number {
  return calculateCrestWithAlgorithm(hpf, lpf, crestCurve, "average");
}

export function calculateChannelAudioPower(
  channel: AmpChannel,
  connectedSpeakers: Speaker[]
): number {
  if (!channel.enabled || connectedSpeakers.length === 0) {
    return 0;
  }
  
  const totalSpeakerPmax = connectedSpeakers.reduce((sum, speaker) => {
    return sum + (speaker.pmax * speaker.quantity);
  }, 0);
  
  const gainFactor = Math.pow(10, channel.gain / 10);
  return totalSpeakerPmax * gainFactor;
}

export function calculateChannelEnergy(
  channel: AmpChannel,
  connectedSpeakers: Speaker[],
  ampEfficiency: number,
  averageCrest: number = 8
): number {
  if (!channel.enabled || connectedSpeakers.length === 0) {
    return 0;
  }
  
  const audioPower = calculateChannelAudioPower(channel, connectedSpeakers);
  
  // Apply crest factor: lower crest = more energy used
  // Crest factor represents peak-to-average ratio in dB
  // Convert to linear: crestLinear = 10^(crest/10)
  // Energy = Audio Power / crestLinear * efficiency (since average power = peak / crest)
  const crestLinear = Math.pow(10, averageCrest / 10);
  const channelEnergy = (audioPower / crestLinear) * ampEfficiency;
  
  return Math.max(0, channelEnergy);
}

export function calculateAmplifierEnergy(
  amplifier: Amplifier,
  speakers: Speaker[],
  connections: Connection[],
  crestCurve: CrestCurvePoint[] = []
): number {
  let totalChannelEnergy = 0;
  
  for (const channel of amplifier.channels || []) {
    const connectedSpeakers = speakers.filter(speaker => {
      return connections.some(conn => 
        conn.sourceType === 'ampChannel' &&
        conn.sourceId === channel.id &&
        conn.targetType === 'speaker' &&
        conn.targetId === speaker.id
      );
    });
    
    const averageCrest = calculateAverageCrest(channel.hpf, channel.lpf, crestCurve);
    const channelEnergy = calculateChannelEnergy(
      channel,
      connectedSpeakers,
      amplifier.efficiency,
      averageCrest
    );
    
    totalChannelEnergy += channelEnergy;
  }
  
  return totalChannelEnergy + amplifier.parasiticDraw;
}

export function recalculateAmplifiers(
  amplifiers: Amplifier[],
  speakers: Speaker[],
  connections: Connection[],
  crestCurve: CrestCurvePoint[] = [],
  crestAlgorithm: CrestAlgorithmType = "average"
): Amplifier[] {
  return amplifiers.map(amp => {
    const updatedChannels = (amp.channels || []).map(channel => {
      const connectedSpeakers = speakers.filter(speaker => {
        return connections.some(conn => 
          conn.sourceType === 'ampChannel' &&
          conn.sourceId === channel.id &&
          conn.targetType === 'speaker' &&
          conn.targetId === speaker.id
        );
      });
      
      const averageCrest = calculateCrestWithAlgorithm(channel.hpf, channel.lpf, crestCurve, crestAlgorithm);
      const peakCrest = calculatePeakCrest(channel.hpf, channel.lpf, crestCurve);
      const audioPower = calculateChannelAudioPower(channel, connectedSpeakers);
      const channelEnergy = calculateChannelEnergy(channel, connectedSpeakers, amp.efficiency, averageCrest);
      const peakChannelEnergy = calculateChannelEnergy(channel, connectedSpeakers, amp.efficiency, peakCrest);
      const effectiveZ = calculateChannelEffectiveZ(connectedSpeakers);
      
      return {
        ...channel,
        musicPowerWatts: audioPower,
        energyWatts: channelEnergy,
        peakEnergyWatts: peakChannelEnergy,
        effectiveZ,
        averageCrest,
        peakCrest,
      };
    });
    
    const energyWatts = updatedChannels.reduce((sum, ch) => sum + ch.energyWatts, 0) + amp.parasiticDraw;
    const peakEnergyWatts = updatedChannels.reduce((sum, ch) => sum + ch.peakEnergyWatts, 0) + amp.parasiticDraw;
    const utilizationPercent = amp.pmax > 0 
      ? (energyWatts / amp.pmax) * 100
      : 0;
    const peakUtilizationPercent = amp.pmax > 0 
      ? (peakEnergyWatts / amp.pmax) * 100
      : 0;
    
    return {
      ...amp,
      channels: updatedChannels,
      rmsWattsDrawn: energyWatts,
      peakRmsWattsDrawn: peakEnergyWatts,
      utilizationPercent,
      peakUtilizationPercent,
    };
  });
}

export function recalculateSpeakers(
  speakers: Speaker[],
  amplifiers: Amplifier[],
  connections: Connection[]
): Speaker[] {
  return speakers.map(speaker => {
    let incomingAudioPower = 0;
    
    for (const connection of connections) {
      if (connection.targetId === speaker.id && connection.sourceType === 'ampChannel') {
        const amplifier = amplifiers.find(amp =>
          amp.channels.some(ch => ch.id === connection.sourceId)
        );
        
        if (amplifier) {
          const channel = amplifier.channels.find(ch => ch.id === connection.sourceId);
          if (channel) {
            incomingAudioPower = channel.musicPowerWatts;
            break;
          }
        }
      }
    }
    
    const utilizationPercent = speaker.pmax > 0
      ? (incomingAudioPower / (speaker.pmax * speaker.quantity)) * 100
      : 0;
    
    return {
      ...speaker,
      utilizationPercent,
    };
  });
}

export function calculateDistroChannelLoad(
  distroChannelId: string,
  amplifiers: Amplifier[],
  connections: Connection[]
): { loadWatts: number; peakLoadWatts: number } {
  let totalLoadWatts = 0;
  let totalPeakLoadWatts = 0;
  
  for (const connection of connections) {
    if (connection.sourceId === distroChannelId && connection.sourceType === 'distro' && connection.targetType === 'amp') {
      const amplifier = amplifiers.find(amp => amp.id === connection.targetId);
      if (amplifier) {
        totalLoadWatts += amplifier.rmsWattsDrawn;
        totalPeakLoadWatts += amplifier.peakRmsWattsDrawn || amplifier.rmsWattsDrawn;
      }
    }
  }
  
  return { loadWatts: totalLoadWatts, peakLoadWatts: totalPeakLoadWatts };
}

export function recalculateDistroChannels(
  generators: Generator[],
  amplifiers: Amplifier[],
  connections: Connection[]
): Generator[] {
  return generators.map(gen => {
    const updatedChannels = (gen.distroChannels || []).map(channel => {
      const { loadWatts, peakLoadWatts } = calculateDistroChannelLoad(channel.id, amplifiers, connections);
      return {
        ...channel,
        loadWatts,
        peakLoadWatts,
      };
    });
    
    const totalLoadWatts = updatedChannels.reduce((sum, ch) => sum + (ch.enabled ? ch.loadWatts : 0), 0);
    const totalPeakLoadWatts = updatedChannels.reduce((sum, ch) => sum + (ch.enabled ? ch.peakLoadWatts : 0), 0);
    
    const utilizationPercent = gen.continuousWatts > 0
      ? (totalLoadWatts / gen.continuousWatts) * 100
      : 0;
    const peakUtilizationPercent = gen.continuousWatts > 0
      ? (totalPeakLoadWatts / gen.continuousWatts) * 100
      : 0;
    
    return {
      ...gen,
      distroChannels: updatedChannels,
      utilizationPercent,
      peakUtilizationPercent,
    };
  });
}
