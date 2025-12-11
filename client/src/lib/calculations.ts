import type { GlobalSettings, Generator, Amplifier, Speaker, Connection, AmpChannel } from './types';

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

export function generateDerateDescriptions(
  generator: Generator,
  settings: GlobalSettings
): { temp: string; altitude: string; user: string } {
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
  
  return { temp: tempDesc, altitude: altDesc, user: userDesc };
}

export function calculateGeneratorEffectiveWatts(
  generator: Generator,
  settings: GlobalSettings
): { effectiveWatts: number; derates: { temp: number; altitude: number; user: number } } {
  const tempDerate = calculateTemperatureDerate(settings.ambientTemperature);
  const altitudeDerate = calculateAltitudeDerate(settings.altitude);
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

export function calculateDistroChannelLoad(
  distroChannelId: string,
  amplifiers: Amplifier[],
  connections: Connection[]
): number {
  let totalLoadWatts = 0;
  
  for (const connection of connections) {
    if (connection.sourceId === distroChannelId && connection.sourceType === 'distro' && connection.targetType === 'amp') {
      const amplifier = amplifiers.find(amp => amp.id === connection.targetId);
      if (amplifier) {
        totalLoadWatts += amplifier.rmsWattsDrawn;
      }
    }
  }
  
  return totalLoadWatts;
}

export function recalculateDistroChannels(
  generators: Generator[],
  amplifiers: Amplifier[],
  connections: Connection[]
): Generator[] {
  return generators.map(gen => {
    const updatedChannels = (gen.distroChannels || []).map(channel => {
      const loadWatts = calculateDistroChannelLoad(channel.id, amplifiers, connections);
      return {
        ...channel,
        loadWatts,
      };
    });
    
    return {
      ...gen,
      distroChannels: updatedChannels,
    };
  });
}
