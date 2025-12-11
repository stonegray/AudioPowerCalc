import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  minImpedance?: number;
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
  minImpedance = 4,
  onUpdate,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
}: AmpChannelRowProps) {
  const isDisabled = bridgePartnerDisabled;
  const channelNum = index + 1;
  const isBasic = appMode === 'basic';
  const impedanceWarning = channel.effectiveZ < minImpedance;

  const utilizationPercent = (channel.energyWatts / Math.max(channel.musicPowerWatts, 1)) * 100;

  return (
    <div 
      className={cn(
        'relative bg-muted/50 rounded-md p-2 pr-12 transition-opacity',
        isDisabled && 'opacity-50'
      )}
    >
      <div className="space-y-1.5">
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

          {!isBasic && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">HPF</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={channel.hpf}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) onUpdate({ hpf: num });
                  }}
                  className="h-6 w-16 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={isDisabled}
                  data-testid={`input-hpf-${index}`}
                />
                <span className="text-xs text-muted-foreground">Hz</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">LPF</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={channel.lpf}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) onUpdate({ lpf: num });
                  }}
                  className="h-6 w-20 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={isDisabled}
                  data-testid={`input-lpf-${index}`}
                />
                <span className="text-xs text-muted-foreground">Hz</span>
              </div>
            </>
          )}

          <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-load-ohms-${index}`}>
            {channel.loadOhms.toFixed(1)}Ω
          </Badge>
          
          <Badge 
            variant={impedanceWarning ? "destructive" : "secondary"} 
            className="font-mono text-xs" 
            data-testid={`badge-effective-z-${index}`}
            title={impedanceWarning ? `Effective Z (${channel.effectiveZ.toFixed(1)}Ω) below minimum (${minImpedance}Ω)` : undefined}
          >
            {channel.effectiveZ.toFixed(1)}Ω eff
          </Badge>

          <div className="flex gap-2 text-xs font-mono text-muted-foreground ml-auto">
            <span>{channel.energyWatts.toFixed(0)}W</span>
            <span>{channel.musicPowerWatts.toFixed(0)}W pk</span>
          </div>

          <div className="w-16 flex-shrink-0">
            <GainKnob
              value={channel.gain}
              onChange={(gain) => onUpdate({ gain })}
              min={-60}
              max={0}
              size="sm"
              testId={`knob-channel-gain-${index}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Progress value={Math.min(utilizationPercent, 100)} className="h-1.5" />
          </div>
          <div className="text-xs font-mono text-muted-foreground min-w-[32px] text-right">
            {utilizationPercent.toFixed(0)}%
          </div>
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
