import AmplifierCard from '../AmplifierCard';
import { AMPLIFIER_PRESETS } from '@/lib/types';
import type { Amplifier } from '@/lib/types';
import { useState } from 'react';

export default function AmplifierCardExample() {
  const [amplifier, setAmplifier] = useState<Amplifier>({
    id: 'amp_1',
    name: 'Sub Amp',
    model: 'la_la12x',
    pmax: 3300,
    efficiency: 0.85,
    parasiticDraw: 50,
    powerFactor: 0.95,
    supportsBridging: true,
    channelCount: 4,
    channels: [
      { id: 'ch_1', enabled: true, bridged: false, hpf: 30, lpf: 100, loadOhms: 4, energyWatts: 850, musicPowerWatts: 1200 },
      { id: 'ch_2', enabled: true, bridged: false, hpf: 30, lpf: 100, loadOhms: 4, energyWatts: 850, musicPowerWatts: 1200 },
      { id: 'ch_3', enabled: true, bridged: false, hpf: 80, lpf: 16000, loadOhms: 8, energyWatts: 420, musicPowerWatts: 600 },
      { id: 'ch_4', enabled: true, bridged: false, hpf: 80, lpf: 16000, loadOhms: 8, energyWatts: 420, musicPowerWatts: 600 },
    ],
    rmsWattsDrawn: 2540,
    utilizationPercent: 77,
  });

  return (
    <div className="max-w-md p-4">
      <AmplifierCard
        amplifier={amplifier}
        presets={AMPLIFIER_PRESETS}
        onUpdate={(updates) => {
          setAmplifier(prev => ({ ...prev, ...updates }));
          console.log('Amplifier updated:', updates);
        }}
        onRemove={() => console.log('Remove clicked')}
        onUpdateChannel={(id, updates) => {
          setAmplifier(prev => ({
            ...prev,
            channels: prev.channels.map(ch => 
              ch.id === id ? { ...ch, ...updates } : ch
            ),
          }));
        }}
        onInputNodeClick={(id) => console.log('Input node clicked:', id)}
        onOutputNodeClick={(id) => console.log('Output node clicked:', id)}
        inputConnectionColor="#3b82f6"
        getOutputConnectionColor={(id) => id === 'ch_1' ? '#10b981' : undefined}
      />
    </div>
  );
}
