import DistroChannelRow from '../DistroChannelRow';
import type { DistroChannel } from '@/lib/types';
import { useState } from 'react';

export default function DistroChannelRowExample() {
  const [channel, setChannel] = useState<DistroChannel>({
    id: 'distro_1',
    enabled: true,
    phaseSource: 1,
    ampacity: 20,
    outputType: 'single',
    cable: { mode: 'awg', awg: 12, length: 50 },
    loadAmps: 8.5,
    loadWatts: 1020,
  });

  return (
    <div className="max-w-xl p-4">
      <DistroChannelRow
        channel={channel}
        index={0}
        maxPhases={3}
        onUpdate={(updates) => {
          setChannel(prev => ({ ...prev, ...updates }));
          console.log('Channel updated:', updates);
        }}
        onRemove={() => console.log('Remove clicked')}
        onNodeClick={(id) => console.log('Node clicked:', id)}
        connectionColor="#3b82f6"
      />
    </div>
  );
}
