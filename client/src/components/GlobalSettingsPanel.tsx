import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, FolderOpen, AlertTriangle, Play, Info, Settings, FilePlus } from 'lucide-react';
import type { GlobalSettings, MusicGenre, Units, SPLDistance, AppMode, CrestAlgorithm } from '@/lib/types';
import { GENRE_PRESETS } from '@/lib/types';
import { generateCrestCurveFromFormula } from '@/lib/calculations';

interface GlobalSettingsPanelProps {
  settings: GlobalSettings;
  onUpdate: (settings: Partial<GlobalSettings>) => void;
  onSave: () => void;
  onLoad: () => void;
  onNewProject: (skipPrompt?: boolean) => void;
  onFindProblems: () => void;
  onOpenSettings: () => void;
  onStartSimulation?: () => void;
  savedConfigs: string[];
  hasUnsavedWork?: boolean;
}

export default function GlobalSettingsPanel({
  settings,
  onUpdate,
  onSave,
  onLoad,
  onNewProject,
  onFindProblems,
  onOpenSettings,
  onStartSimulation,
  hasUnsavedWork = false,
}: GlobalSettingsPanelProps) {
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  
  const handleNewProject = () => {
    if (hasUnsavedWork) {
      setNewProjectDialogOpen(true);
    } else {
      onNewProject(true);
    }
  };
  const isBasic = settings.appMode === 'basic';

  return (
    <Card className="mb-4">
      <CardContent className="pt-3 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">App Mode</Label>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-left">
              This selects the visibility of advanced options. In Engineering mode, it allows bypassing some limits, modifying many fixed values, and extremely niche settings.
              <br />
              <br />
              Note that on switching back to Basic, any advanced parameters are still saved just not visible
            </TooltipContent>
          </Tooltip>
          <Select
            value={settings.appMode}
            onValueChange={(v: AppMode) => onUpdate({ appMode: v })}
          >
            <SelectTrigger className="w-36 h-8" data-testid="select-app-mode">
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
              onValueChange={(v: MusicGenre) => {
                const formula = GENRE_PRESETS[v]?.crestCurveFormula || GENRE_PRESETS.rock.crestCurveFormula;
                const crestCurve = generateCrestCurveFromFormula(formula);
                onUpdate({ musicGenre: v, crestCurve });
              }}
            >
              <SelectTrigger className="w-40 h-8" data-testid="select-music-genre">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GENRE_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div>{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Label className="text-xs text-muted-foreground">Crest Algo</Label>
                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs font-medium mb-1">Crest Factor Algorithm:</p>
                <ul className="text-xs space-y-1">
                  <li><strong>Average:</strong> Arithmetic mean across HPF/LPF window</li>
                  <li><strong>Peak:</strong> Lowest crest (conservative, highest energy)</li>
                  <li><strong>Maximum:</strong> Highest crest (optimistic, lowest energy)</li>
                  <li><strong>RMS-Weighted:</strong> Weights lower frequencies more heavily</li>
                </ul>
              </TooltipContent>
            </Tooltip>
            <Select
              value={settings.crestAlgorithm || 'average'}
              onValueChange={(v: CrestAlgorithm) => onUpdate({ crestAlgorithm: v })}
            >
              <SelectTrigger className="w-36 h-8" data-testid="select-crest-algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="peak">Peak</SelectItem>
                <SelectItem value="maximum">Maximum</SelectItem>
                <SelectItem value="rms_weighted">RMS-Weighted</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenSettings}
            data-testid="button-project-settings"
          >
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
              <Button 
                variant={hasUnsavedWork ? "outline" : "default"} 
                size="sm" 
                onClick={handleNewProject} 
                data-testid="button-new-project"
                className={!hasUnsavedWork ? "bg-green-600 hover:bg-green-700 border border-green-700 animate-pulse" : ""}
              >
                <FilePlus className="w-3 h-3 mr-1" />
                New
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Project?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">You have unsaved changes. Would you like to save your current project before starting a new one?</p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setNewProjectDialogOpen(false);
                    onNewProject(true);
                  }}>
                    Discard
                  </Button>
                  <Button onClick={() => {
                    setNewProjectDialogOpen(false);
                    onSave();
                    setTimeout(() => onNewProject(true), 500);
                  }}>
                    Save & New
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
