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
import type { Generator, GeneratorType, PhaseType, CableInputMode, DistroChannel, GENERATOR_PRESETS } from '@/lib/types';
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
}: GeneratorCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isCustom = generator.model === 'custom';
  const utilizationColor = generator.utilizationPercent > 90 ? 'text-destructive' : 
    generator.utilizationPercent > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground';

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
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <Input
              value={generator.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-8 w-40 font-medium"
              data-testid={`input-generator-name-${generator.id}`}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} data-testid={`button-remove-generator-${generator.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn('text-2xl font-mono font-semibold', utilizationColor)}>
                {generator.utilizationPercent.toFixed(0)}%
              </span>
              <span className="text-sm text-muted-foreground">utilization</span>
            </div>
            <Progress value={generator.utilizationPercent} className="h-2" />
          </div>
          <div className="text-right">
            <div className="text-lg font-mono">{effectiveWatts.toFixed(0)}W</div>
            <div className="text-xs text-muted-foreground">effective</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={generator.model} onValueChange={handleModelChange}>
              <SelectTrigger data-testid={`select-generator-model-${generator.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(presets).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select 
              value={generator.type} 
              onValueChange={(v: GeneratorType) => onUpdate({ type: v })}
              disabled={!isCustom}
            >
              <SelectTrigger data-testid={`select-generator-type-${generator.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inverter">Inverter</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="shore">Shore Power</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isCustom && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Continuous (W)</Label>
              <Input
                type="number"
                value={generator.continuousWatts}
                onChange={(e) => onUpdate({ continuousWatts: Number(e.target.value) })}
                className="font-mono text-right"
                data-testid={`input-continuous-watts-${generator.id}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Peak (W)</Label>
              <Input
                type="number"
                value={generator.peakWatts}
                onChange={(e) => onUpdate({ peakWatts: Number(e.target.value) })}
                className="font-mono text-right"
                data-testid={`input-peak-watts-${generator.id}`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Phases</Label>
            <Select
              value={String(generator.phaseCount)}
              onValueChange={(v) => onUpdate({ phaseCount: Number(v) as 1 | 2 | 3 })}
              disabled={!isCustom}
            >
              <SelectTrigger data-testid={`select-phases-${generator.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Voltage</Label>
            <Input
              type="number"
              value={generator.voltage}
              onChange={(e) => onUpdate({ voltage: Number(e.target.value) })}
              className="font-mono text-right"
              disabled={!isCustom}
              data-testid={`input-voltage-${generator.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Derate %</Label>
            <Input
              type="number"
              value={generator.userDerate}
              onChange={(e) => onUpdate({ userDerate: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-user-derate-${generator.id}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Feeder Cable</Label>
          <div className="flex gap-2">
            <Select
              value={generator.feederCable.mode}
              onValueChange={(v: CableInputMode) => onUpdate({ feederCable: { ...generator.feederCable, mode: v } })}
            >
              <SelectTrigger className="w-20" data-testid={`select-feeder-mode-${generator.id}`}>
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
                  className="w-16 font-mono text-right"
                  placeholder="AWG"
                  data-testid={`input-feeder-awg-${generator.id}`}
                />
                <Input
                  type="number"
                  value={generator.feederCable.length || 25}
                  onChange={(e) => onUpdate({ feederCable: { ...generator.feederCable, length: Number(e.target.value) } })}
                  className="flex-1 font-mono text-right"
                  placeholder="ft"
                  data-testid={`input-feeder-length-${generator.id}`}
                />
              </>
            ) : (
              <Input
                type="number"
                value={generator.feederCable.manualResistance || 0}
                onChange={(e) => onUpdate({ feederCable: { ...generator.feederCable, manualResistance: Number(e.target.value) } })}
                className="flex-1 font-mono text-right"
                placeholder="mΩ"
                data-testid={`input-feeder-resistance-${generator.id}`}
              />
            )}
          </div>
        </div>

        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid={`button-toggle-derates-${generator.id}`}>
              <span className="text-xs text-muted-foreground">Derate Breakdown</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', detailsOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-muted/50 rounded-md p-3 text-sm font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rated Power:</span>
                <span>{generator.continuousWatts}W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature:</span>
                <span>{(derates.temp * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Altitude:</span>
                <span>{(derates.altitude * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Derate:</span>
                <span>{(derates.user * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1 font-medium">
                <span>Effective:</span>
                <span>{effectiveWatts.toFixed(0)}W</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Distribution Channels</span>
            <Button variant="outline" size="sm" onClick={onAddDistro} data-testid={`button-add-distro-${generator.id}`}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="space-y-2">
            {generator.distroChannels.map((channel, index) => (
              <DistroChannelRow
                key={channel.id}
                channel={channel}
                index={index}
                maxPhases={generator.phaseCount}
                onUpdate={(updates) => onUpdateDistro(channel.id, updates)}
                onRemove={() => onRemoveDistro(channel.id)}
                onNodeClick={onNodeClick}
                connectionColor={getConnectionColor?.(channel.id)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
