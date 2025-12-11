import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, FolderOpen, AlertTriangle, Play } from 'lucide-react';
import type { GlobalSettings, MusicGenre, Units, SPLDistance, AppMode } from '@/lib/types';

interface GlobalSettingsPanelProps {
  settings: GlobalSettings;
  onUpdate: (settings: Partial<GlobalSettings>) => void;
  onSave: () => void;
  onLoad: () => void;
  onFindProblems: () => void;
  onStartSimulation?: () => void;
  savedConfigs: string[];
}

export default function GlobalSettingsPanel({
  settings,
  onUpdate,
  onSave,
  onLoad,
  onFindProblems,
  onStartSimulation,
}: GlobalSettingsPanelProps) {
  const tempUnit = settings.units === 'metric' ? '°C' : '°F';
  const altUnit = settings.units === 'metric' ? 'm' : 'ft';
  const isBasic = settings.appMode === 'basic';

  return (
    <Card className="mb-4">
      <CardContent className="pt-3 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={settings.appMode}
            onValueChange={(v: AppMode) => onUpdate({ appMode: v })}
          >
            <SelectTrigger className="w-28 h-8" data-testid="select-app-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Genre</Label>
            <Select
              value={settings.musicGenre}
              onValueChange={(v: MusicGenre) => onUpdate({ musicGenre: v })}
            >
              <SelectTrigger className="w-28 h-8" data-testid="select-music-genre">
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

          {!isBasic && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Temp</Label>
                <Input
                  type="number"
                  value={settings.ambientTemperature}
                  onChange={(e) => onUpdate({ ambientTemperature: Number(e.target.value) })}
                  className="w-16 h-8 font-mono text-right text-sm"
                  data-testid="input-temperature"
                />
                <span className="text-xs text-muted-foreground">{tempUnit}</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Alt</Label>
                <Input
                  type="number"
                  value={settings.altitude}
                  onChange={(e) => onUpdate({ altitude: Number(e.target.value) })}
                  className="w-20 h-8 font-mono text-right text-sm"
                  data-testid="input-altitude"
                />
                <span className="text-xs text-muted-foreground">{altUnit}</span>
              </div>
            </>
          )}

          <div className="flex items-center gap-1">
            <span className={`text-xs ${settings.units === 'metric' ? 'font-medium' : 'text-muted-foreground'}`}>M</span>
            <Switch
              checked={settings.units === 'imperial'}
              onCheckedChange={(checked) => onUpdate({ units: checked ? 'imperial' : 'metric' })}
              data-testid="switch-units"
            />
            <span className={`text-xs ${settings.units === 'imperial' ? 'font-medium' : 'text-muted-foreground'}`}>I</span>
          </div>

          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">SPL</Label>
            <Select
              value={settings.splDistance}
              onValueChange={(v: SPLDistance) => onUpdate({ splDistance: v })}
            >
              <SelectTrigger className="w-16 h-8" data-testid="select-spl-distance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="10m">10m</SelectItem>
                <SelectItem value="50m">50m</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isBasic && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Array</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings.arraySummationFactor}
                onChange={(e) => onUpdate({ arraySummationFactor: Number(e.target.value) })}
                className="w-16 h-8 font-mono text-right text-sm"
                data-testid="input-array-factor"
              />
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onSave} data-testid="button-save">
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={onLoad} data-testid="button-load">
              <FolderOpen className="w-3 h-3 mr-1" />
              Load
            </Button>
            <Button variant="secondary" size="sm" onClick={onFindProblems} data-testid="button-find-problems">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Find Problems
            </Button>
            <Button size="sm" onClick={onStartSimulation} data-testid="button-start-simulation">
              <Play className="w-3 h-3 mr-1" />
              Simulate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
