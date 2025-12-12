import AmpChannelRow from '../AmpChannelRow';
import type { AmpChannel } from '@/lib/types';
import { useState } from 'react';

export default function AmpChannelRowExample() {
  const [channel, setChannel] = useState<AmpChannel>({
    id: 'ch_1',
    enabled: true,
    bridged: false,
    crossoverMode: 'sub',
    hpf: 30,
    lpf: 100,
    qFactor: 0.707,
    loadOhms: 4,
    energyWatts: 850,
    peakEnergyWatts: 1000,
    musicPowerWatts: 1200,
    gain: 0,
    effectiveZ: 4,
  });

  return (
    <div className="max-w-lg p-4 space-y-2">
      <AmpChannelRow
        channel={channel}
        index={0}
        canBridge={true}
        bridgePartnerDisabled={false}
        supportsBridging={true}
        onUpdate={(updates) => {
          setChannel(prev => ({ ...prev, ...updates }));
          console.log('Channel updated:', updates);
        }}
        onNodeClick={(id) => console.log('Node clicked:', id)}
        connectionColor="#3b82f6"
      />
      
      <AmpChannelRow
        channel={{ ...channel, id: 'ch_2', enabled: true }}
        index={1}
        canBridge={false}
        bridgePartnerDisabled={true}
        supportsBridging={true}
        onUpdate={() => {}}
        onNodeClick={(id) => console.log('Node clicked:', id)}
      />
    </div>
  );
}
