import type { GlobalSettings, Generator, Amplifier, Speaker, Connection, AmpChannel } from './types';

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

export function calculateChannelEnergy(
  channel: AmpChannel,
  connectedSpeakers: Speaker[],
  ampEfficiency: number
): number {
  if (!channel.enabled || connectedSpeakers.length === 0) {
    return 0;
  }
  
  const totalSpeakerPmax = connectedSpeakers.reduce((sum, speaker) => {
    return sum + (speaker.pmaxAES * speaker.quantity);
  }, 0);
  
  const gainFactor = Math.pow(10, channel.gain / 10);
  const channelEnergy = (totalSpeakerPmax * ampEfficiency) * gainFactor;
  
  return Math.max(0, channelEnergy);
}

export function calculateAmplifierEnergy(
  amplifier: Amplifier,
  speakers: Speaker[],
  connections: Connection[]
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
    
    const channelEnergy = calculateChannelEnergy(
      channel,
      connectedSpeakers,
      amplifier.efficiency
    );
    
    totalChannelEnergy += channelEnergy;
  }
  
  return totalChannelEnergy + amplifier.parasiticDraw;
}

export function recalculateAmplifiers(
  amplifiers: Amplifier[],
  speakers: Speaker[],
  connections: Connection[]
): Amplifier[] {
  return amplifiers.map(amp => {
    const energyWatts = calculateAmplifierEnergy(amp, speakers, connections);
    const utilizationPercent = amp.pmax > 0 
      ? Math.min(100, (energyWatts / amp.pmax) * 100) 
      : 0;
    
    const updatedChannels = (amp.channels || []).map(channel => {
      const connectedSpeakers = speakers.filter(speaker => {
        return connections.some(conn => 
          conn.sourceType === 'ampChannel' &&
          conn.sourceId === channel.id &&
          conn.targetType === 'speaker' &&
          conn.targetId === speaker.id
        );
      });
      
      const channelEnergy = calculateChannelEnergy(channel, connectedSpeakers, amp.efficiency);
      
      return {
        ...channel,
        energyWatts: channelEnergy,
      };
    });
    
    return {
      ...amp,
      channels: updatedChannels,
      rmsWattsDrawn: energyWatts,
      utilizationPercent,
    };
  });
}

export function recalculateSpeakers(
  speakers: Speaker[],
  amplifiers: Amplifier[],
  connections: Connection[]
): Speaker[] {
  return speakers.map(speaker => {
    let incomingPower = 0;
    
    for (const connection of connections) {
      if (connection.targetId === speaker.id && connection.sourceType === 'ampChannel') {
        const amplifier = amplifiers.find(amp =>
          amp.channels.some(ch => ch.id === connection.sourceId)
        );
        
        if (amplifier) {
          const channel = amplifier.channels.find(ch => ch.id === connection.sourceId);
          if (channel) {
            incomingPower = channel.energyWatts;
            break;
          }
        }
      }
    }
    
    const totalPmax = speaker.pmaxAES * speaker.quantity;
    const utilizationPercent = totalPmax > 0
      ? Math.min(100, (incomingPower / totalPmax) * 100)
      : 0;
    
    return {
      ...speaker,
      utilizationPercent,
    };
  });
}
