import type { SystemState, Connection, Generator, Amplifier } from './types';

export interface PowerPath {
  generatorName: string;
  distroLabel: string;
  amplifierName?: string;
  channelLabel?: string;
  fullPath: string;
}

export function getAmpPowerPath(
  ampId: string,
  connections: Connection[],
  generators: Generator[]
): PowerPath | null {
  const connection = connections.find(c => c.targetId === ampId && c.targetType === 'amp');
  if (!connection) return null;
  
  for (const gen of generators) {
    const distroIndex = gen.distroChannels.findIndex(d => d.id === connection.sourceId);
    if (distroIndex !== -1) {
      const distroLabel = `D${distroIndex + 1}`;
      return {
        generatorName: gen.name,
        distroLabel,
        fullPath: `${gen.name} > ${distroLabel}`,
      };
    }
  }
  
  return null;
}

export function getSpeakerPowerPath(
  speakerId: string,
  connections: Connection[],
  generators: Generator[],
  amplifiers: Amplifier[]
): PowerPath | null {
  const speakerConnection = connections.find(c => c.targetId === speakerId && c.targetType === 'speaker');
  if (!speakerConnection) return null;
  
  for (const amp of amplifiers) {
    const channelIndex = amp.channels.findIndex(ch => ch.id === speakerConnection.sourceId);
    if (channelIndex !== -1) {
      const channelLabel = `Ch${channelIndex + 1}`;
      
      const ampConnection = connections.find(c => c.targetId === amp.id && c.targetType === 'amp');
      if (!ampConnection) {
        return {
          generatorName: '?',
          distroLabel: '?',
          amplifierName: amp.name,
          channelLabel,
          fullPath: `? > ${amp.name} > ${channelLabel}`,
        };
      }
      
      for (const gen of generators) {
        const distroIndex = gen.distroChannels.findIndex(d => d.id === ampConnection.sourceId);
        if (distroIndex !== -1) {
          const distroLabel = `D${distroIndex + 1}`;
          return {
            generatorName: gen.name,
            distroLabel,
            amplifierName: amp.name,
            channelLabel,
            fullPath: `${gen.name} > ${distroLabel} > ${amp.name} > ${channelLabel}`,
          };
        }
      }
    }
  }
  
  return null;
}

export function getPoweredSpeakerPowerPath(
  speakerId: string,
  connections: Connection[],
  generators: Generator[]
): PowerPath | null {
  const connection = connections.find(c => c.targetId === speakerId && c.targetType === 'poweredSpeaker');
  if (!connection) return null;
  
  for (const gen of generators) {
    const distroIndex = gen.distroChannels.findIndex(d => d.id === connection.sourceId);
    if (distroIndex !== -1) {
      const distroLabel = `D${distroIndex + 1}`;
      return {
        generatorName: gen.name,
        distroLabel,
        fullPath: `${gen.name} > ${distroLabel}`,
      };
    }
  }
  
  return null;
}
