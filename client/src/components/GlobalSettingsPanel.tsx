import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, FolderOpen, AlertTriangle, Settings2 } from 'lucide-react';
import type { GlobalSettings, MusicGenre, Units, SPLDistance } from '@/lib/types';

interface GlobalSettingsPanelProps {
  settings: GlobalSettings;
  onUpdate: (settings: Partial<GlobalSettings>) => void;
  onSave: () => void;
  onLoad: () => void;
  onFindProblems: () => void;
  savedConfigs: string[];
}

export default function GlobalSettingsPanel({
  settings,
  onUpdate,
  onSave,
  onLoad,
  onFindProblems,
}: GlobalSettingsPanelProps) {
  const tempUnit = settings.units === 'metric' ? '°C' : '°F';
  const altUnit = settings.units === 'metric' ? 'm' : 'ft';

  return (
    <Card className="mb-6">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Global Settings</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Music Genre
            </Label>
            <Select
              value={settings.musicGenre}
              onValueChange={(v: MusicGenre) => onUpdate({ musicGenre: v })}
            >
              <SelectTrigger data-testid="select-music-genre">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bass_dubstep">Bass/Dubstep</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="acoustic">Acoustic</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Temperature ({tempUnit})
            </Label>
            <Input
              type="number"
              value={settings.ambientTemperature}
              onChange={(e) => onUpdate({ ambientTemperature: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid="input-temperature"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Altitude ({altUnit})
            </Label>
            <Input
              type="number"
              value={settings.altitude}
              onChange={(e) => onUpdate({ altitude: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid="input-altitude"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Units
            </Label>
            <div className="flex items-center gap-2 h-9">
              <span className={`text-sm ${settings.units === 'metric' ? 'font-medium' : 'text-muted-foreground'}`}>
                Metric
              </span>
              <Switch
                checked={settings.units === 'imperial'}
                onCheckedChange={(checked) => onUpdate({ units: checked ? 'imperial' : 'metric' })}
                data-testid="switch-units"
              />
              <span className={`text-sm ${settings.units === 'imperial' ? 'font-medium' : 'text-muted-foreground'}`}>
                Imperial
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              SPL Distance
            </Label>
            <Select
              value={settings.splDistance}
              onValueChange={(v: SPLDistance) => onUpdate({ splDistance: v })}
            >
              <SelectTrigger data-testid="select-spl-distance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="10m">10m</SelectItem>
                <SelectItem value="50m">50m</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Array Factor
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={settings.arraySummationFactor}
              onChange={(e) => onUpdate({ arraySummationFactor: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid="input-array-factor"
            />
          </div>

          <div className="flex items-end gap-2 col-span-2">
            <Button variant="outline" size="default" onClick={onSave} data-testid="button-save">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="default" onClick={onLoad} data-testid="button-load">
              <FolderOpen className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button variant="secondary" size="default" onClick={onFindProblems} data-testid="button-find-problems">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Find Problems
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
