import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Speaker } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import type { Speaker as SpeakerType, SPEAKER_PRESETS, AppMode } from '@/lib/types';

interface SpeakerCardProps {
  speaker: SpeakerType;
  presets: typeof SPEAKER_PRESETS;
  splDistance: string;
  onUpdate: (updates: Partial<SpeakerType>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: AppMode;
}

export default function SpeakerCard({
  speaker,
  presets,
  splDistance,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
}: SpeakerCardProps) {
  const isCustom = speaker.model === 'custom';
  const isBasic = appMode === 'basic';

  const handleModelChange = (model: string) => {
    const preset = presets[model];
    if (preset) {
      onUpdate({
        model,
        name: preset.name || 'Custom Speaker',
        pmaxAES: preset.pmaxAES || 1000,
        impedance: preset.impedance || 8,
        sensitivity: preset.sensitivity || 100,
      });
    } else {
      onUpdate({ model });
    }
  };

  return (
    <Card className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <ConnectionNode
          id={speaker.id}
          type="input"
          position="left"
          connected={!!connectionColor}
          color={connectionColor}
          onClick={() => onNodeClick?.(speaker.id)}
        />
      </div>

      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Speaker className="w-4 h-4 text-green-500" />
            <Input
              value={speaker.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-7 w-28 font-medium text-sm"
              data-testid={`input-speaker-name-${speaker.id}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {speaker.quantity}x
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} data-testid={`button-remove-speaker-${speaker.id}`}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-mono font-semibold">
            {speaker.splOutput.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">dB SPL @ {splDistance}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={speaker.model} onValueChange={handleModelChange}>
              <SelectTrigger className="h-7 w-28 text-xs" data-testid={`select-speaker-model-${speaker.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(presets).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Qty</Label>
            <Input
              type="number"
              min="1"
              value={speaker.quantity}
              onChange={(e) => onUpdate({ quantity: Math.max(1, Number(e.target.value)) })}
              className="h-7 w-12 font-mono text-right text-xs"
              data-testid={`input-speaker-quantity-${speaker.id}`}
            />
          </div>

          {!isBasic && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Pmax</Label>
                <Input
                  type="number"
                  value={speaker.pmaxAES}
                  onChange={(e) => onUpdate({ pmaxAES: Number(e.target.value) })}
                  className="h-7 w-16 font-mono text-right text-xs"
                  disabled={!isCustom}
                  data-testid={`input-speaker-pmax-${speaker.id}`}
                />
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Z</Label>
                <Input
                  type="number"
                  value={speaker.impedance}
                  onChange={(e) => onUpdate({ impedance: Number(e.target.value) })}
                  className="h-7 w-12 font-mono text-right text-xs"
                  disabled={!isCustom}
                  data-testid={`input-speaker-impedance-${speaker.id}`}
                />
                <span className="text-xs text-muted-foreground">Ω</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Sens</Label>
                <Input
                  type="number"
                  value={speaker.sensitivity}
                  onChange={(e) => onUpdate({ sensitivity: Number(e.target.value) })}
                  className="h-7 w-14 font-mono text-right text-xs"
                  disabled={!isCustom}
                  data-testid={`input-speaker-sensitivity-${speaker.id}`}
                />
              </div>
            </>
          )}
        </div>

        <div className="bg-muted/50 rounded-md px-2 py-1 text-xs font-mono">
          <span className="text-muted-foreground">Eff Z: </span>
          <span>{(speaker.impedance / speaker.quantity).toFixed(1)}Ω</span>
        </div>
      </CardContent>
    </Card>
  );
}
