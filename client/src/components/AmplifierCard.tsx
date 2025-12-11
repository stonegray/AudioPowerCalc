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
import type { Amplifier, AmpChannel, AMPLIFIER_PRESETS } from '@/lib/types';
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
}: AmplifierCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isCustom = amplifier.model === 'custom';
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
    <Card className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <ConnectionNode
          id={amplifier.id}
          type="input"
          position="left"
          connected={!!inputConnectionColor}
          color={inputConnectionColor}
          onClick={() => onInputNodeClick?.(amplifier.id)}
        />
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-500" />
            <Input
              value={amplifier.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-8 w-40 font-medium"
              data-testid={`input-amp-name-${amplifier.id}`}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} data-testid={`button-remove-amp-${amplifier.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn('text-2xl font-mono font-semibold', utilizationColor)}>
                {amplifier.utilizationPercent.toFixed(0)}%
              </span>
              <span className="text-sm text-muted-foreground">utilization</span>
            </div>
            <Progress value={amplifier.utilizationPercent} className="h-2" />
          </div>
          <div className="text-right">
            <div className="text-lg font-mono">{amplifier.rmsWattsDrawn.toFixed(0)}W</div>
            <div className="text-xs text-muted-foreground">RMS drawn</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={amplifier.model} onValueChange={handleModelChange}>
              <SelectTrigger data-testid={`select-amp-model-${amplifier.id}`}>
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
            <Label className="text-xs text-muted-foreground">Power Factor</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={amplifier.powerFactor}
              onChange={(e) => onUpdate({ powerFactor: Number(e.target.value) })}
              className="font-mono text-right"
              disabled={!isCustom}
              data-testid={`input-power-factor-${amplifier.id}`}
            />
          </div>
        </div>

        {isCustom && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">PMAX (W)</Label>
                <Input
                  type="number"
                  value={amplifier.pmax}
                  onChange={(e) => onUpdate({ pmax: Number(e.target.value) })}
                  className="font-mono text-right"
                  data-testid={`input-pmax-${amplifier.id}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Efficiency</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={amplifier.efficiency}
                  onChange={(e) => onUpdate({ efficiency: Number(e.target.value) })}
                  className="font-mono text-right"
                  data-testid={`input-efficiency-${amplifier.id}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Parasitic (W)</Label>
                <Input
                  type="number"
                  value={amplifier.parasiticDraw}
                  onChange={(e) => onUpdate({ parasiticDraw: Number(e.target.value) })}
                  className="font-mono text-right"
                  data-testid={`input-parasitic-${amplifier.id}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Channels</Label>
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
                    }
                  );
                  onUpdate({ channelCount: count, channels });
                }}
              >
                <SelectTrigger data-testid={`select-channel-count-${amplifier.id}`}>
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
          </>
        )}

        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid={`button-toggle-amp-details-${amplifier.id}`}>
              <span className="text-xs text-muted-foreground">Channel Breakdown</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', detailsOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-muted/50 rounded-md p-3 text-sm font-mono space-y-1">
              <div className="flex justify-between font-medium border-b pb-1 mb-1">
                <span>Total Draw:</span>
                <span>{amplifier.rmsWattsDrawn.toFixed(0)}W RMS</span>
              </div>
              {amplifier.channels.map((ch, i) => (
                <div key={ch.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ch {i + 1}:</span>
                  <span>{ch.energyWatts.toFixed(0)}W / {ch.musicPowerWatts.toFixed(0)}W / {ch.loadOhms.toFixed(1)}Ω</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <span className="text-sm font-medium">Channels</span>
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
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
