import SaveLoadDialog from '../SaveLoadDialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SaveLoadDialogExample() {
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [configs, setConfigs] = useState(['Large Show', 'Small Show', 'Festival Main']);

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setSaveOpen(true)}>Open Save Dialog</Button>
        <Button variant="outline" onClick={() => setLoadOpen(true)}>Open Load Dialog</Button>
      </div>
      
      <SaveLoadDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        mode="save"
        savedConfigs={configs}
        onSave={(name) => {
          console.log('Save:', name);
          if (!configs.includes(name)) {
            setConfigs([...configs, name]);
          }
        }}
        onLoad={(name) => console.log('Load:', name)}
        onDelete={(name) => {
          console.log('Delete:', name);
          setConfigs(configs.filter(c => c !== name));
        }}
      />
      
      <SaveLoadDialog
        open={loadOpen}
        onOpenChange={setLoadOpen}
        mode="load"
        savedConfigs={configs}
        onSave={(name) => console.log('Save:', name)}
        onLoad={(name) => console.log('Load:', name)}
        onDelete={(name) => {
          console.log('Delete:', name);
          setConfigs(configs.filter(c => c !== name));
        }}
      />
    </div>
  );
}
