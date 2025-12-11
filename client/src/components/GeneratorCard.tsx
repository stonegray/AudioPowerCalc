import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Plus, Trash2, Zap } from 'lucide-react';
import DistroChannelRow from './DistroChannelRow';
import SearchableModelSelect from './SearchableModelSelect';
import type { Generator, GeneratorType, PhaseType, CableInputMode, DistroChannel, GENERATOR_PRESETS, AppMode, GlobalSettings } from '@/lib/types';
import { generateDerateDescriptions } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface GeneratorCardProps {
  generator: Generator;
  presets: typeof GENERATOR_PRESETS;
  onUpdate: (updates: Partial<Generator>) => void;
  onRemove: () => void;
  onAddDistro: () => void;
  onUpdateDistro: (channelId: string, updates: Partial<DistroChannel>) => void;
  onRemoveDistro: (channelId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  getConnectionColor?: (nodeId: string) => string | undefined;
  derates?: { temp: number; altitude: number; user: number };
  effectiveWatts?: number;
  appMode?: AppMode;
  globalSettings?: GlobalSettings;
}

export default function GeneratorCard({
  generator,
  presets,
  onUpdate,
  onRemove,
  onAddDistro,
  onUpdateDistro,
  onRemoveDistro,
  onNodeClick,
  getConnectionColor,
  derates = { temp: 1, altitude: 1, user: 1 },
  effectiveWatts = generator.continuousWatts,
  appMode = 'advanced',
  globalSettings,
}: GeneratorCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isCustom = generator.model === 'custom';
  const isBasic = appMode === 'basic';
  const utilizationColor = generator.utilizationPercent > 90 ? 'text-destructive' : 
    generator.utilizationPercent > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground';
  
  const derateDescriptions = globalSettings ? generateDerateDescriptions(generator, globalSettings) : null;

  const handleModelChange = (model: string) => {
    const preset = presets[model];
    if (preset) {
      onUpdate({
        model,
        name: preset.name || 'Custom Generator',
        type: preset.type || 'standard',
        continuousWatts: preset.continuousWatts || 5000,
        peakWatts: preset.peakWatts || 6000,
        phaseCount: preset.phaseCount || 1,
        phaseType: preset.phaseType || 'single',
        voltage: preset.voltage || 120,
      });
    } else {
      onUpdate({ model });
    }
  };

  return (
    <Card className="relative overflow-visible" style={{ zIndex: 10 }}>
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <Input
              value={generator.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-7 w-32 font-medium text-sm"
              data-testid={`input-generator-name-${generator.id}`}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} data-testid={`button-remove-generator-${generator.id}`}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-3 mt-1.5">
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className={cn('text-xl font-mono font-semibold', utilizationColor)}>
                {generator.utilizationPercent.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">util</span>
            </div>
            <Progress value={generator.utilizationPercent} className="h-1.5" />
          </div>
          <div className="text-right">
            <div className="text-base font-mono">{effectiveWatts.toFixed(0)}W</div>
            <div className="text-xs text-muted-foreground">effective</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <SearchableModelSelect
            value={generator.model}
            onValueChange={handleModelChange}
            options={presets}
            formatData={(preset) => `${preset.continuousWatts}W`}
            testId={`select-generator-model-${generator.id}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {!isBasic && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select 
                value={generator.type} 
                onValueChange={(v: GeneratorType) => onUpdate({ type: v })}
                disabled={!isCustom}
              >
                <SelectTrigger className="h-7 w-24 text-xs" data-testid={`select-generator-type-${generator.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inverter">Inverter</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="shore">Shore</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Ph</Label>
            <Select
              value={String(generator.phaseCount)}
              onValueChange={(v) => onUpdate({ phaseCount: Number(v) as 1 | 2 | 3 })}
              disabled={!isCustom}
            >
              <SelectTrigger className="h-7 w-12 text-xs" data-testid={`select-phases-${generator.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isBasic && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">V</Label>
                <Input
                  type="number"
                  value={generator.voltage}
                  onChange={(e) => onUpdate({ voltage: Number(e.target.value) })}
                  className="h-7 w-14 font-mono text-right text-xs"
                  disabled={!isCustom}
                  data-testid={`input-voltage-${generator.id}`}
                />
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Derate</Label>
                <Input
                  type="number"
                  value={generator.userDerate}
                  onChange={(e) => onUpdate({ userDerate: Number(e.target.value) })}
                  className="h-7 w-12 font-mono text-right text-xs"
                  data-testid={`input-user-derate-${generator.id}`}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </>
          )}
        </div>

        {isCustom && !isBasic && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Cont</Label>
              <Input
                type="number"
                value={generator.continuousWatts}
                onChange={(e) => onUpdate({ continuousWatts: Number(e.target.value) })}
                className="h-7 w-20 font-mono text-right text-xs"
                data-testid={`input-continuous-watts-${generator.id}`}
              />
              <span className="text-xs text-muted-foreground">W</span>
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Peak</Label>
              <Input
                type="number"
                value={generator.peakWatts}
                onChange={(e) => onUpdate({ peakWatts: Number(e.target.value) })}
                className="h-7 w-20 font-mono text-right text-xs"
                data-testid={`input-peak-watts-${generator.id}`}
              />
              <span className="text-xs text-muted-foreground">W</span>
            </div>
          </div>
        )}

        {!isBasic && (
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-muted-foreground">Feeder</Label>
            <Select
              value={generator.feederCable.mode}
              onValueChange={(v: CableInputMode) => onUpdate({ feederCable: { ...generator.feederCable, mode: v } })}
            >
              <SelectTrigger className="h-7 w-14 text-xs" data-testid={`select-feeder-mode-${generator.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="awg">AWG</SelectItem>
                <SelectItem value="manual">mΩ</SelectItem>
              </SelectContent>
            </Select>
            {generator.feederCable.mode === 'awg' ? (
              <>
                <Input
                  type="number"
                  value={generator.feederCable.awg || 10}
                  onChange={(e) => onUpdate({ feederCable: { ...generator.feederCable, awg: Number(e.target.value) } })}
                  className="h-7 w-12 font-mono text-right text-xs"
                  data-testid={`input-feeder-awg-${generator.id}`}
                />
                <Input
                  type="number"
                  value={generator.feederCable.length || 25}
                  onChange={(e) => onUpdate({ feederCable: { ...generator.feederCable, length: Number(e.target.value) } })}
                  className="h-7 w-14 font-mono text-right text-xs"
                  placeholder="ft"
                  data-testid={`input-feeder-length-${generator.id}`}
                />
              </>
            ) : (
              <Input
                type="number"
                value={generator.feederCable.manualResistance || 0}
                onChange={(e) => onUpdate({ feederCable: { ...generator.feederCable, manualResistance: Number(e.target.value) } })}
                className="h-7 w-16 font-mono text-right text-xs"
                placeholder="mΩ"
                data-testid={`input-feeder-resistance-${generator.id}`}
              />
            )}
          </div>
        )}

        {appMode === 'engineering' && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-7" data-testid={`button-toggle-derates-${generator.id}`}>
                <span className="text-xs text-muted-foreground">Derate Breakdown</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform', detailsOpen && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/50 rounded-md p-2 text-xs font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rated:</span>
                  <span>{generator.continuousWatts}W</span>
                </div>
                {derateDescriptions && (
                  <>
                    <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {derateDescriptions.temp}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {derateDescriptions.altitude}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {derateDescriptions.user}
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-0.5 mt-0.5 font-medium">
                  <span>Eff:</span>
                  <span>{effectiveWatts.toFixed(0)}W</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Distribution</span>
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={onAddDistro} data-testid={`button-add-distro-${generator.id}`}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="space-y-1.5">
            {generator.distroChannels.map((channel, index) => (
              <DistroChannelRow
                key={channel.id}
                channel={channel}
                index={index}
                maxPhases={generator.phaseCount}
                generatorPhaseType={generator.phaseType}
                onUpdate={(updates) => onUpdateDistro(channel.id, updates)}
                onRemove={() => onRemoveDistro(channel.id)}
                onNodeClick={onNodeClick}
                connectionColor={getConnectionColor?.(channel.id)}
                appMode={appMode}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
