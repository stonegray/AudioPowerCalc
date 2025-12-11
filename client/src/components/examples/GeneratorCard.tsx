import GeneratorCard from '../GeneratorCard';
import { GENERATOR_PRESETS } from '@/lib/types';
import type { Generator } from '@/lib/types';
import { useState } from 'react';

export default function GeneratorCardExample() {
  const [generator, setGenerator] = useState<Generator>({
    id: 'gen_1',
    name: 'Main Generator',
    model: 'honda_3000i',
    type: 'inverter',
    continuousWatts: 2800,
    peakWatts: 3000,
    userDerate: 10,
    phaseCount: 1,
    phaseType: 'single',
    voltage: 120,
    feederCable: { mode: 'awg', awg: 10, length: 25 },
    distroChannels: [
      {
        id: 'distro_1',
        enabled: true,
        phaseSource: 1,
        ampacity: 20,
        outputType: 'single',
        cable: { mode: 'awg', awg: 12, length: 50 },
        loadAmps: 8.5,
        loadWatts: 1020,
      },
      {
        id: 'distro_2',
        enabled: true,
        phaseSource: 1,
        ampacity: 15,
        outputType: 'single',
        cable: { mode: 'awg', awg: 14, length: 75 },
        loadAmps: 4.2,
        loadWatts: 504,
      },
    ],
    utilizationPercent: 54,
  });

  return (
    <div className="max-w-md p-4">
      <GeneratorCard
        generator={generator}
        presets={GENERATOR_PRESETS}
        onUpdate={(updates) => {
          setGenerator(prev => ({ ...prev, ...updates }));
          console.log('Generator updated:', updates);
        }}
        onRemove={() => console.log('Remove clicked')}
        onAddDistro={() => console.log('Add distro clicked')}
        onUpdateDistro={(id, updates) => {
          setGenerator(prev => ({
            ...prev,
            distroChannels: prev.distroChannels.map(ch => 
              ch.id === id ? { ...ch, ...updates } : ch
            ),
          }));
        }}
        onRemoveDistro={(id) => console.log('Remove distro:', id)}
        onNodeClick={(id) => console.log('Node clicked:', id)}
        getConnectionColor={(id) => id === 'distro_1' ? '#3b82f6' : undefined}
        derates={{ temp: 0.95, altitude: 1.0, user: 0.9 }}
        effectiveWatts={2394}
      />
    </div>
  );
}
