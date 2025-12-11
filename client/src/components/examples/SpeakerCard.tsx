import SpeakerCard from '../SpeakerCard';
import { SPEAKER_PRESETS } from '@/lib/types';
import type { Speaker } from '@/lib/types';
import { useState } from 'react';

export default function SpeakerCardExample() {
  const [speaker, setSpeaker] = useState<Speaker>({
    id: 'spk_1',
    name: 'Subs L',
    model: 'la_ks28',
    pmax: 2800,
    impedance: 4,
    sensitivity: 103,
    quantity: 2,
    splOutput: 139.5,
  });

  return (
    <div className="max-w-sm p-4">
      <SpeakerCard
        speaker={speaker}
        presets={SPEAKER_PRESETS}
        splDistance="1m"
        onUpdate={(updates) => {
          setSpeaker(prev => ({ ...prev, ...updates }));
          console.log('Speaker updated:', updates);
        }}
        onRemove={() => console.log('Remove clicked')}
        onNodeClick={(id) => console.log('Node clicked:', id)}
        connectionColor="#10b981"
      />
    </div>
  );
}
