import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Trash2, Volume2 } from 'lucide-react';
import AmpChannelRow from './AmpChannelRow';
import ConnectionNode from './ConnectionNode';
import SearchableModelSelect from './SearchableModelSelect';
import type { Amplifier, AmpChannel, AMPLIFIER_PRESETS, AppMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AmplifierCardProps {
  amplifier: Amplifier;
  presets: typeof AMPLIFIER_PRESETS;
  onUpdate: (updates: Partial<Amplifier>) => void;
  onRemove: () => void;
  onUpdateChannel: (channelId: string, updates: Partial<AmpChannel>) => void;
  onInputNodeClick?: (ampId: string) => void;
  onOutputNodeClick?: (channelId: string) => void;
  inputConnectionColor?: string;
  getOutputConnectionColor?: (channelId: string) => string | undefined;
  appMode?: AppMode;
  powerPath?: string;
  isPendingConnection?: boolean;
  isHighlighted?: boolean;
}

export default function AmplifierCard({
  amplifier,
  presets,
  onUpdate,
  onRemove,
  onUpdateChannel,
  onInputNodeClick,
  onOutputNodeClick,
  inputConnectionColor,
  getOutputConnectionColor,
  appMode = 'advanced',
  powerPath,
  isPendingConnection = false,
  isHighlighted = false,
}: AmplifierCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isCustom = amplifier.model === 'custom';
  const isBasic = appMode === 'basic';
  const utilizationColor = amplifier.utilizationPercent > 90 ? 'text-destructive' : 
    amplifier.utilizationPercent > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground';

  const handleModelChange = (model: string) => {
    const preset = presets[model];
    if (preset) {
      const channels: AmpChannel[] = Array.from(
        { length: preset.channelCount || 2 }, 
        (_, i) => ({
          id: `ch_${Date.now()}_${i}`,
          enabled: true,
          bridged: false,
          hpf: i < 2 ? 30 : 80,
          lpf: i < 2 ? 100 : 16000,
          loadOhms: 8,
          energyWatts: 0,
          musicPowerWatts: 0,
          gain: 0,
          effectiveZ: 8,
        })
      );
      onUpdate({
        model,
        name: preset.name || 'Custom Amplifier',
        pmax: preset.pmax || 1000,
        efficiency: preset.efficiency || 0.85,
        parasiticDraw: preset.parasiticDraw || 50,
        powerFactor: preset.powerFactor || 0.95,
        supportsBridging: preset.supportsBridging || false,
        channelCount: preset.channelCount || 2,
        channels,
      });
    } else {
      onUpdate({ model });
    }
  };

  const handleChannelUpdate = (channelId: string, updates: Partial<AmpChannel>) => {
    if (updates.bridged !== undefined) {
      const channelIndex = amplifier.channels.findIndex(ch => ch.id === channelId);
      if (channelIndex % 2 === 0 && channelIndex + 1 < amplifier.channels.length) {
        const updatedChannels = amplifier.channels.map((ch, i) => {
          if (i === channelIndex) return { ...ch, ...updates };
          if (i === channelIndex + 1) return { ...ch, enabled: !updates.bridged };
          return ch;
        });
        onUpdate({ channels: updatedChannels });
        return;
      }
    }
    onUpdateChannel(channelId, updates);
  };

  return (
    <Card className={cn("relative overflow-visible", isHighlighted && "ring-2 ring-primary/50")} style={{ zIndex: 10 }}>
      <ConnectionNode
        id={amplifier.id}
        type="input"
        position="left"
        connected={!!inputConnectionColor}
        color={inputConnectionColor}
        onClick={() => onInputNodeClick?.(amplifier.id)}
        isPending={isPendingConnection}
        isHighlighted={isHighlighted}
      />
      
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-500" />
            <Input
              value={amplifier.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-7 w-32 font-medium text-sm"
              data-testid={`input-amp-name-${amplifier.id}`}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} data-testid={`button-remove-amp-${amplifier.id}`}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-3 mt-1.5">
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className={cn('text-xl font-mono font-semibold', utilizationColor)}>
                {amplifier.utilizationPercent.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">util</span>
            </div>
            <Progress value={amplifier.utilizationPercent} className="h-1.5" />
          </div>
          <div className="text-right">
            <div className="text-base font-mono">{amplifier.rmsWattsDrawn.toFixed(0)}W</div>
            <div className="text-xs text-muted-foreground">RMS</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        {powerPath && (
          <div className="text-center pb-1">
            <span className="text-xs text-muted-foreground bg-background/90 px-2 py-0.5 rounded-full border shadow-sm">
              {powerPath}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <SearchableModelSelect
            value={amplifier.model}
            onValueChange={handleModelChange}
            options={presets}
            formatData={(preset) => `${preset.channelCount}ch ${preset.pmax}W`}
            testId={`select-amp-model-${amplifier.id}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {!isBasic && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">PF</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={amplifier.powerFactor}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (!isNaN(num)) onUpdate({ powerFactor: Math.max(0, Math.min(1, num)) });
                }}
                className="h-7 w-14 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                disabled={!isCustom}
                data-testid={`input-power-factor-${amplifier.id}`}
              />
            </div>
          )}
        </div>

        {isCustom && !isBasic && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Pmax</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amplifier.pmax}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (!isNaN(num)) onUpdate({ pmax: num });
                }}
                className="h-7 w-24 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                data-testid={`input-pmax-${amplifier.id}`}
              />
              <span className="text-xs text-muted-foreground">W</span>
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Eff</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={amplifier.efficiency}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (!isNaN(num)) onUpdate({ efficiency: Math.max(0, Math.min(1, num)) });
                }}
                className="h-7 w-14 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                data-testid={`input-efficiency-${amplifier.id}`}
              />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Para</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amplifier.parasiticDraw}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (!isNaN(num)) onUpdate({ parasiticDraw: num });
                }}
                className="h-7 w-14 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                data-testid={`input-parasitic-${amplifier.id}`}
              />
              <span className="text-xs text-muted-foreground">W</span>
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Ch</Label>
              <Select
                value={String(amplifier.channelCount)}
                onValueChange={(v) => {
                  const count = Number(v) as 1 | 2 | 4 | 8;
                  const channels: AmpChannel[] = Array.from({ length: count }, (_, i) => 
                    amplifier.channels[i] || {
                      id: `ch_${Date.now()}_${i}`,
                      enabled: true,
                      bridged: false,
                      hpf: 30,
                      lpf: 16000,
                      loadOhms: 8,
                      energyWatts: 0,
                      musicPowerWatts: 0,
                      gain: 0,
                      effectiveZ: 8,
                    }
                  );
                  onUpdate({ channelCount: count, channels });
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs" data-testid={`select-channel-count-${amplifier.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {appMode === 'engineering' && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-7" data-testid={`button-toggle-amp-details-${amplifier.id}`}>
                <span className="text-xs text-muted-foreground">Channel Breakdown</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform', detailsOpen && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/50 rounded-md p-2 text-xs font-mono space-y-0.5">
                <div className="flex justify-between font-medium border-b pb-0.5 mb-0.5">
                  <span>Total:</span>
                  <span>{amplifier.rmsWattsDrawn.toFixed(0)}W RMS</span>
                </div>
                {amplifier.channels.map((ch, i) => (
                  <div key={ch.id} className="flex justify-between">
                    <span className="text-muted-foreground">Ch {i + 1}:</span>
                    <span>{ch.energyWatts.toFixed(0)}W/{ch.musicPowerWatts.toFixed(0)}W/{ch.effectiveZ.toFixed(1)}Ω</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="space-y-1.5">
          <span className="text-xs font-medium">Channels</span>
          {amplifier.channels.map((channel, index) => {
            const canBridge = index % 2 === 0;
            const bridgePartnerDisabled = index % 2 === 1 && 
              amplifier.channels[index - 1]?.bridged;
            
            return (
              <AmpChannelRow
                key={channel.id}
                channel={channel}
                index={index}
                canBridge={canBridge}
                bridgePartnerDisabled={bridgePartnerDisabled}
                supportsBridging={amplifier.supportsBridging}
                onUpdate={(updates) => handleChannelUpdate(channel.id, updates)}
                onNodeClick={onOutputNodeClick}
                connectionColor={getOutputConnectionColor?.(channel.id)}
                appMode={appMode}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
