import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import type { DistroChannel, PhaseType, CableInputMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DistroChannelRowProps {
  channel: DistroChannel;
  index: number;
  maxPhases: number;
  generatorPhaseType: PhaseType;
  onUpdate: (updates: Partial<DistroChannel>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: 'basic' | 'advanced' | 'engineering';
}

export default function DistroChannelRow({
  channel,
  index,
  maxPhases,
  generatorPhaseType,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
}: DistroChannelRowProps) {
  const getPhaseOptions = (): { value: number; label: string }[] => {
    const options: { value: number; label: string }[] = [];
    
    // Add single phase line-to-neutral options (L1, L2, L3)
    for (let i = 1; i <= maxPhases; i++) {
      options.push({ value: i, label: `L${i}` });
    }
    
    // Add 3-phase line-to-line options if Wye generator
    if (generatorPhaseType === '3_wye' && maxPhases >= 3) {
      options.push(
        { value: 12, label: 'L12' },
        { value: 23, label: 'L23' },
        { value: 31, label: 'L31' }
      );
    }
    
    return options;
  };

  const phaseOptions = getPhaseOptions();
  const isLineToLine = channel.phaseSource >= 12;
  const voltageForAmpacity = isLineToLine ? 208 : 120;
  const maxWatts = channel.ampacity * voltageForAmpacity;
  const utilizationPercent = maxWatts > 0 ? (channel.loadWatts / maxWatts) * 100 : 0;
  const utilizationColor = utilizationPercent > 90 ? 'text-destructive' : 
    utilizationPercent > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground';

  const getAvailablePhaseTypes = (): { value: PhaseType; label: string }[] => {
    const types: { value: PhaseType; label: string }[] = [
      { value: 'single', label: 'Single' },
      { value: 'split', label: 'Split' },
    ];
    
    if (maxPhases >= 3) {
      types.push({ value: '3_delta', label: '3ph Delta' });
      if (generatorPhaseType !== '3_delta') {
        types.push({ value: '3_wye', label: '3ph Wye' });
      }
    }
    
    return types;
  };

  const availablePhaseTypes = getAvailablePhaseTypes();
  const isBasic = appMode === 'basic';

  return (
    <div className="relative bg-muted/50 rounded-md p-2 pr-8">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <Switch
            checked={channel.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            data-testid={`switch-distro-enabled-${index}`}
          />
          <span className="text-xs font-medium">D{index + 1}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 min-w-[100px] cursor-help">
                <span className={cn('text-xs font-mono', utilizationColor)}>
                  {channel.loadWatts.toFixed(0)}W/{maxWatts}W
                </span>
                <span className="text-xs text-muted-foreground">breaker</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Breaker capacity can exceed the generator's rated capacity. Verify total system power draw doesn't overload the generator.</p>
            </TooltipContent>
          </Tooltip>
          <Progress value={utilizationPercent} className="h-1.5 w-16" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={onRemove}
            data-testid={`button-remove-distro-${index}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Ph</Label>
          <Select
            value={String(channel.phaseSource)}
            onValueChange={(v) => onUpdate({ phaseSource: Number(v) })}
          >
            <SelectTrigger className="h-7 w-20 text-xs" data-testid={`select-phase-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {phaseOptions.map((p) => (
                <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">A</Label>
          <Select
            value={String(channel.ampacity)}
            onValueChange={(v) => onUpdate({ ampacity: Number(v) })}
          >
            <SelectTrigger className="h-7 w-16 text-xs" data-testid={`select-ampacity-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15A</SelectItem>
              <SelectItem value="20">20A</SelectItem>
              <SelectItem value="30">30A</SelectItem>
              <SelectItem value="50">50A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Badge variant="outline" className="font-mono text-xs h-fit">
          {voltageForAmpacity}V
        </Badge>

        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={channel.outputType}
            onValueChange={(v: PhaseType) => onUpdate({ outputType: v })}
          >
            <SelectTrigger className="h-7 w-24 text-xs" data-testid={`select-output-type-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePhaseTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isBasic && (
          <div className="flex items-center gap-1">
            <Select
              value={channel.cable.mode}
              onValueChange={(v: CableInputMode) => onUpdate({ cable: { ...channel.cable, mode: v } })}
            >
              <SelectTrigger className="h-7 w-14 text-xs" data-testid={`select-cable-mode-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="awg">AWG</SelectItem>
                <SelectItem value="manual">mΩ</SelectItem>
              </SelectContent>
            </Select>
            {channel.cable.mode === 'awg' ? (
              <>
                <Input
                  type="number"
                  value={channel.cable.awg || 12}
                  onChange={(e) => onUpdate({ cable: { ...channel.cable, awg: Number(e.target.value) } })}
                  className="h-7 w-20 font-mono text-right text-xs"
                  data-testid={`input-cable-awg-${index}`}
                />
                <Input
                  type="number"
                  value={channel.cable.length || 50}
                  onChange={(e) => onUpdate({ cable: { ...channel.cable, length: Number(e.target.value) } })}
                  className="h-7 w-20 font-mono text-right text-xs"
                  placeholder="ft"
                  data-testid={`input-cable-length-${index}`}
                />
              </>
            ) : (
              <Input
                type="number"
                value={channel.cable.manualResistance || 0}
                onChange={(e) => onUpdate({ cable: { ...channel.cable, manualResistance: Number(e.target.value) } })}
                className="h-7 w-20 font-mono text-right text-xs"
                placeholder="mΩ"
                data-testid={`input-cable-resistance-${index}`}
              />
            )}
          </div>
        )}
      </div>

      <ConnectionNode
        id={channel.id}
        type="output"
        position="right"
        connected={!!connectionColor}
        color={connectionColor}
        onClick={onNodeClick}
      />
    </div>
  );
}
