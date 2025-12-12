import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConnectionNode from './ConnectionNode';
import type { AmpChannel, CrossoverMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AmpChannelRowProps {
  channel: AmpChannel;
  index: number;
  canBridge: boolean;
  bridgePartnerDisabled: boolean;
  supportsBridging: boolean;
  minImpedance?: number;
  channelPmax?: number;
  onUpdate: (updates: Partial<AmpChannel>) => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: 'basic' | 'advanced' | 'engineering';
  isCollapsed?: boolean;
}

const CROSSOVER_PRESETS: Record<CrossoverMode, { hpf: number; lpf: number; label: string }> = {
  sub: { hpf: 30, lpf: 100, label: 'Sub' },
  main: { hpf: 100, lpf: 20000, label: 'Main' },
  full: { hpf: 30, lpf: 20000, label: 'Full' },
  custom: { hpf: 30, lpf: 20000, label: 'Custom' },
};

export default function AmpChannelRow({
  channel,
  index,
  canBridge,
  bridgePartnerDisabled,
  supportsBridging,
  minImpedance = 4,
  channelPmax = 0,
  onUpdate,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
  isCollapsed = false,
}: AmpChannelRowProps) {
  const isDisabled = bridgePartnerDisabled;
  const channelNum = index + 1;
  const isBasic = appMode === 'basic';
  const isEngineering = appMode === 'engineering';
  const impedanceWarning = channel.effectiveZ < minImpedance;
  const effectivePmax = channel.bridged ? channelPmax * 2 : channelPmax;
  const utilizationPercent = (channel.energyWatts / Math.max(effectivePmax, 1)) * 100;

  const crossoverMode = channel.crossoverMode || 'main';
  const showCustomControls = crossoverMode === 'custom' || isEngineering;

  const handleCrossoverModeChange = (mode: CrossoverMode) => {
    const preset = CROSSOVER_PRESETS[mode];
    if (mode === 'custom') {
      onUpdate({ crossoverMode: mode });
    } else {
      onUpdate({ 
        crossoverMode: mode, 
        hpf: preset.hpf, 
        lpf: preset.lpf 
      });
    }
  };

  const handleManualFrequencyEdit = (field: 'hpf' | 'lpf' | 'qFactor', value: number) => {
    if (isEngineering && crossoverMode !== 'custom') {
      onUpdate({ crossoverMode: 'custom', [field]: value });
    } else {
      onUpdate({ [field]: value });
    }
  };

  const getCrossoverOptions = () => {
    if (isBasic) {
      return [
        { value: 'sub', label: 'Sub' },
        { value: 'main', label: 'Main' },
      ];
    }
    return [
      { value: 'sub', label: 'Sub' },
      { value: 'main', label: 'Main' },
      { value: 'full', label: 'Full' },
      { value: 'custom', label: 'Custom' },
    ];
  };

  const crossoverOptions = getCrossoverOptions();

  return (
    <div 
      className={cn(
        'relative bg-muted/50 rounded-md p-2 pr-10 transition-all',
        isDisabled && 'opacity-50',
        isCollapsed && 'p-0 bg-transparent'
      )}
    >
      {isCollapsed ? null : !channel.enabled ? (
        <div className="flex items-center gap-1.5">
          <Switch
            checked={channel.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            disabled={isDisabled}
            data-testid={`switch-channel-enabled-${index}`}
          />
          <span className="text-xs font-medium text-muted-foreground">Ch{channelNum}</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Row 1: Enable, Bridge, Crossover Mode, Gain */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
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

            <Select
              value={crossoverMode}
              onValueChange={(v) => handleCrossoverModeChange(v as CrossoverMode)}
              disabled={isDisabled}
            >
              <SelectTrigger className="h-6 w-20 text-xs" data-testid={`select-crossover-mode-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {crossoverOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 ml-auto">
              <Label className="text-xs text-muted-foreground">Gain</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={channel.gain}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (!isNaN(num)) onUpdate({ gain: Math.min(0, Math.max(-60, num)) });
                }}
                className="h-6 w-14 font-mono text-right text-xs"
                disabled={isDisabled}
                data-testid={`input-gain-${index}`}
              />
              <span className="text-xs text-muted-foreground">dB</span>
            </div>
          </div>

          {/* Row 2: HPF/LPF/Q (hidden by default, shown when Custom mode or engineering mode) */}
          {showCustomControls && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">HPF</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={channel.hpf}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) handleManualFrequencyEdit('hpf', num);
                  }}
                  className="h-6 w-14 font-mono text-right text-xs"
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
                    if (!isNaN(num)) handleManualFrequencyEdit('lpf', num);
                  }}
                  className="h-6 w-16 font-mono text-right text-xs"
                  disabled={isDisabled}
                  data-testid={`input-lpf-${index}`}
                />
                <span className="text-xs text-muted-foreground">Hz</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Q</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={channel.qFactor?.toFixed(3) ?? '0.707'}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) handleManualFrequencyEdit('qFactor', num);
                  }}
                  className="h-6 w-14 font-mono text-right text-xs"
                  disabled={isDisabled}
                  data-testid={`input-q-${index}`}
                />
              </div>
            </div>
          )}

          {/* Row 3: Status, Utilization, Power info */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-load-ohms-${index}`}>
              {channel.loadOhms.toFixed(1)}Ω
            </Badge>
            
            <Badge 
              variant={impedanceWarning ? "destructive" : "secondary"} 
              className="font-mono text-xs" 
              data-testid={`badge-effective-z-${index}`}
              title={impedanceWarning ? `Effective Z (${channel.effectiveZ.toFixed(2)}Ω) below minimum (${minImpedance}Ω)` : undefined}
            >
              {channel.effectiveZ.toFixed(2)}Ω eff
            </Badge>

            {effectivePmax > 0 && (
              <Badge variant="outline" className="font-mono text-xs">
                {effectivePmax.toFixed(0)}W
              </Badge>
            )}

            {appMode === 'engineering' && channel.averageCrest !== undefined && (
              <Badge variant="outline" className="font-mono text-xs" data-testid={`badge-avg-crest-${index}`}>
                {channel.averageCrest.toFixed(1)}dB CF
              </Badge>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <div className="text-xs font-mono text-muted-foreground">
                {channel.musicPowerWatts.toFixed(0)}W / {channel.energyWatts.toFixed(0)}W
              </div>
              <Progress value={utilizationPercent} className="h-1.5 w-12" />
              <span className="text-xs font-mono text-muted-foreground min-w-[28px] text-right">
                {utilizationPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {!isDisabled && channel.enabled && (
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
