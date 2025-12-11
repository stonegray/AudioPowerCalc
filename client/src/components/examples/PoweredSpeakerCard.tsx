import PoweredSpeakerCard from '../PoweredSpeakerCard';
import type { PoweredSpeaker } from '@/lib/types';
import { useState } from 'react';

export default function PoweredSpeakerCardExample() {
  const [speaker, setSpeaker] = useState<PoweredSpeaker>({
    id: 'pwspk_1',
    name: 'QSC KW181',
    model: 'custom',
    pmaxAES: 1000,
    impedance: 8,
    sensitivity: 100,
    quantity: 2,
    pmax: 1000,
    efficiency: 0.85,
    parasiticDraw: 30,
    powerFactor: 0.9,
    hpf: 35,
    lpf: 120,
    splOutput: 132.5,
    rmsWattsDrawn: 650,
  });

  return (
    <div className="max-w-sm p-4">
      <PoweredSpeakerCard
        speaker={speaker}
        splDistance="1m"
        onUpdate={(updates) => {
          setSpeaker(prev => ({ ...prev, ...updates }));
          console.log('Powered speaker updated:', updates);
        }}
        onRemove={() => console.log('Remove clicked')}
        onNodeClick={(id) => console.log('Node clicked:', id)}
        connectionColor="#8b5cf6"
      />
    </div>
  );
}
