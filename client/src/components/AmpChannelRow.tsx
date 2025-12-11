import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ConnectionNode from './ConnectionNode';
import GainKnob from './GainKnob';
import type { AmpChannel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AmpChannelRowProps {
  channel: AmpChannel;
  index: number;
  canBridge: boolean;
  bridgePartnerDisabled: boolean;
  supportsBridging: boolean;
  onUpdate: (updates: Partial<AmpChannel>) => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: 'basic' | 'advanced' | 'engineering';
}

export default function AmpChannelRow({
  channel,
  index,
  canBridge,
  bridgePartnerDisabled,
  supportsBridging,
  onUpdate,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
}: AmpChannelRowProps) {
  const isDisabled = bridgePartnerDisabled;
  const channelNum = index + 1;
  const isBasic = appMode === 'basic';

  return (
    <div 
      className={cn(
        'relative bg-muted/50 rounded-md p-2 pr-8 transition-opacity',
        isDisabled && 'opacity-50'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-[60px]">
          <Switch
            checked={channel.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            disabled={isDisabled}
            data-testid={`switch-channel-enabled-${index}`}
          />
          <span className="text-xs font-medium">Ch{channelNum}</span>
        </div>

        {canBridge && supportsBridging && !isBasic && (
          <div className="flex items-center gap-1">
            <Switch
              checked={channel.bridged}
              onCheckedChange={(checked) => onUpdate({ bridged: checked })}
              disabled={isDisabled}
              data-testid={`switch-channel-bridge-${index}`}
            />
            <Label className="text-xs text-muted-foreground">Br</Label>
          </div>
        )}

        <GainKnob
          value={channel.gain}
          onChange={(gain) => onUpdate({ gain })}
          size="sm"
          testId={`knob-channel-gain-${index}`}
        />

        {!isBasic && (
          <>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">HPF</Label>
              <Input
                type="number"
                value={channel.hpf}
                onChange={(e) => onUpdate({ hpf: Number(e.target.value) })}
                className="h-6 w-14 font-mono text-right text-xs"
                disabled={isDisabled}
                data-testid={`input-hpf-${index}`}
              />
            </div>

            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">LPF</Label>
              <Input
                type="number"
                value={channel.lpf}
                onChange={(e) => onUpdate({ lpf: Number(e.target.value) })}
                className="h-6 w-14 font-mono text-right text-xs"
                disabled={isDisabled}
                data-testid={`input-lpf-${index}`}
              />
            </div>
          </>
        )}

        <Badge variant="secondary" className="font-mono text-xs">
          {channel.loadOhms.toFixed(1)}Ω
        </Badge>

        <div className="flex gap-2 text-xs font-mono text-muted-foreground ml-auto">
          <span>{channel.energyWatts.toFixed(0)}W</span>
          <span>{channel.musicPowerWatts.toFixed(0)}W pk</span>
        </div>
      </div>

      {!isDisabled && (
        <ConnectionNode
          id={channel.id}
          type="output"
          position="right"
          connected={!!connectionColor}
          color={connectionColor}
          onClick={onNodeClick}
        />
      )}
    </div>
  );
}
