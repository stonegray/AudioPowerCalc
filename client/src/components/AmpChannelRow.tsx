import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ConnectionNode from './ConnectionNode';
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
}: AmpChannelRowProps) {
  const isDisabled = bridgePartnerDisabled;
  const channelNum = index + 1;

  return (
    <div 
      className={cn(
        'relative bg-muted/50 rounded-md p-2 pr-6 transition-opacity',
        isDisabled && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-[80px]">
          <Switch
            checked={channel.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            disabled={isDisabled}
            data-testid={`switch-channel-enabled-${index}`}
          />
          <span className="text-sm font-medium">Ch {channelNum}</span>
        </div>

        {canBridge && supportsBridging && (
          <div className="flex items-center gap-1">
            <Switch
              checked={channel.bridged}
              onCheckedChange={(checked) => onUpdate({ bridged: checked })}
              disabled={isDisabled}
              data-testid={`switch-channel-bridge-${index}`}
            />
            <Label className="text-xs text-muted-foreground">Bridge</Label>
          </div>
        )}

        <div className="flex items-center gap-1 flex-1">
          <Label className="text-xs text-muted-foreground w-8">HPF</Label>
          <Input
            type="number"
            value={channel.hpf}
            onChange={(e) => onUpdate({ hpf: Number(e.target.value) })}
            className="h-7 w-16 font-mono text-right text-xs"
            disabled={isDisabled}
            data-testid={`input-hpf-${index}`}
          />
          <span className="text-xs text-muted-foreground">Hz</span>
        </div>

        <div className="flex items-center gap-1 flex-1">
          <Label className="text-xs text-muted-foreground w-8">LPF</Label>
          <Input
            type="number"
            value={channel.lpf}
            onChange={(e) => onUpdate({ lpf: Number(e.target.value) })}
            className="h-7 w-16 font-mono text-right text-xs"
            disabled={isDisabled}
            data-testid={`input-lpf-${index}`}
          />
          <span className="text-xs text-muted-foreground">Hz</span>
        </div>

        <Badge variant="secondary" className="font-mono text-xs">
          {channel.loadOhms.toFixed(1)}Ω
        </Badge>
      </div>

      {!isDisabled && (
        <div className="flex justify-end gap-4 mt-1 text-xs font-mono text-muted-foreground">
          <span>{channel.energyWatts.toFixed(0)}W energy</span>
          <span>{channel.musicPowerWatts.toFixed(0)}W music</span>
        </div>
      )}

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
