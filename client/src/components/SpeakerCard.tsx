import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Speaker } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import type { Speaker as SpeakerType, SPEAKER_PRESETS } from '@/lib/types';

interface SpeakerCardProps {
  speaker: SpeakerType;
  presets: typeof SPEAKER_PRESETS;
  splDistance: string;
  onUpdate: (updates: Partial<SpeakerType>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
}

export default function SpeakerCard({
  speaker,
  presets,
  splDistance,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
}: SpeakerCardProps) {
  const isCustom = speaker.model === 'custom';

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

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Speaker className="w-5 h-5 text-green-500" />
            <Input
              value={speaker.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-8 w-32 font-medium"
              data-testid={`input-speaker-name-${speaker.id}`}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} data-testid={`button-remove-speaker-${speaker.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-semibold">
              {speaker.splOutput.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">dB SPL @ {splDistance}</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {speaker.quantity}x
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={speaker.model} onValueChange={handleModelChange}>
              <SelectTrigger data-testid={`select-speaker-model-${speaker.id}`}>
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
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={speaker.quantity}
              onChange={(e) => onUpdate({ quantity: Math.max(1, Number(e.target.value)) })}
              className="font-mono text-right"
              data-testid={`input-speaker-quantity-${speaker.id}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">PMAX (W)</Label>
            <Input
              type="number"
              value={speaker.pmaxAES}
              onChange={(e) => onUpdate({ pmaxAES: Number(e.target.value) })}
              className="font-mono text-right"
              disabled={!isCustom}
              data-testid={`input-speaker-pmax-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Impedance (Ω)</Label>
            <Input
              type="number"
              value={speaker.impedance}
              onChange={(e) => onUpdate({ impedance: Number(e.target.value) })}
              className="font-mono text-right"
              disabled={!isCustom}
              data-testid={`input-speaker-impedance-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sensitivity</Label>
            <Input
              type="number"
              value={speaker.sensitivity}
              onChange={(e) => onUpdate({ sensitivity: Number(e.target.value) })}
              className="font-mono text-right"
              disabled={!isCustom}
              data-testid={`input-speaker-sensitivity-${speaker.id}`}
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-md p-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Effective Z:</span>
            <span>{(speaker.impedance / speaker.quantity).toFixed(1)}Ω</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
