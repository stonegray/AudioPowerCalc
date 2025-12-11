import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import type { DistroChannel, PhaseType, CableInputMode } from '@/lib/types';

interface DistroChannelRowProps {
  channel: DistroChannel;
  index: number;
  maxPhases: number;
  onUpdate: (updates: Partial<DistroChannel>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
}

export default function DistroChannelRow({
  channel,
  index,
  maxPhases,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
}: DistroChannelRowProps) {
  const phaseOptions = Array.from({ length: maxPhases }, (_, i) => i + 1);

  return (
    <div className="relative bg-muted/50 rounded-md p-3 pr-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={channel.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            data-testid={`switch-distro-enabled-${index}`}
          />
          <span className="text-sm font-medium">Distro {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {channel.loadAmps.toFixed(1)}A / {channel.loadWatts.toFixed(0)}W
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRemove}
            data-testid={`button-remove-distro-${index}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Phase</Label>
          <Select
            value={String(channel.phaseSource)}
            onValueChange={(v) => onUpdate({ phaseSource: Number(v) })}
          >
            <SelectTrigger className="h-8" data-testid={`select-phase-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {phaseOptions.map((p) => (
                <SelectItem key={p} value={String(p)}>L{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ampacity</Label>
          <Select
            value={String(channel.ampacity)}
            onValueChange={(v) => onUpdate({ ampacity: Number(v) })}
          >
            <SelectTrigger className="h-8" data-testid={`select-ampacity-${index}`}>
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

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={channel.outputType}
            onValueChange={(v: PhaseType) => onUpdate({ outputType: v })}
          >
            <SelectTrigger className="h-8" data-testid={`select-output-type-${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="split">Split</SelectItem>
              <SelectItem value="3_delta">3Ph Delta</SelectItem>
              <SelectItem value="3_wye">3Ph Wye</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cable</Label>
          <div className="flex gap-1">
            <Select
              value={channel.cable.mode}
              onValueChange={(v: CableInputMode) => onUpdate({ cable: { ...channel.cable, mode: v } })}
            >
              <SelectTrigger className="h-8 w-16" data-testid={`select-cable-mode-${index}`}>
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
                  className="h-8 w-12 font-mono text-right"
                  data-testid={`input-cable-awg-${index}`}
                />
                <Input
                  type="number"
                  value={channel.cable.length || 50}
                  onChange={(e) => onUpdate({ cable: { ...channel.cable, length: Number(e.target.value) } })}
                  className="h-8 w-14 font-mono text-right"
                  placeholder="ft"
                  data-testid={`input-cable-length-${index}`}
                />
              </>
            ) : (
              <Input
                type="number"
                value={channel.cable.manualResistance || 0}
                onChange={(e) => onUpdate({ cable: { ...channel.cable, manualResistance: Number(e.target.value) } })}
                className="h-8 flex-1 font-mono text-right"
                placeholder="mΩ"
                data-testid={`input-cable-resistance-${index}`}
              />
            )}
          </div>
        </div>
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
