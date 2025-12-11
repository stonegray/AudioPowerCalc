import GlobalSettingsPanel from '../GlobalSettingsPanel';
import type { GlobalSettings } from '@/lib/types';
import { useState } from 'react';

export default function GlobalSettingsPanelExample() {
  const [settings, setSettings] = useState<GlobalSettings>({
    musicGenre: 'rock',
    ambientTemperature: 25,
    altitude: 0,
    units: 'metric',
    splDistance: '1m',
    arraySummationFactor: 0.91,
  });

  return (
    <GlobalSettingsPanel
      settings={settings}
      onUpdate={(updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
        console.log('Settings updated:', updates);
      }}
      onSave={() => console.log('Save clicked')}
      onLoad={() => console.log('Load clicked')}
      onFindProblems={() => console.log('Find problems clicked')}
      savedConfigs={['Large Show', 'Small Show']}
    />
  );
}
