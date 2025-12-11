import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Speaker } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import SearchableModelSelect from './SearchableModelSelect';
import type { Speaker as SpeakerType, SPEAKER_PRESETS, AppMode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SpeakerCardProps {
  speaker: SpeakerType;
  presets: typeof SPEAKER_PRESETS;
  splDistance: string;
  onUpdate: (updates: Partial<SpeakerType>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: AppMode;
  powerPath?: string;
  isPendingConnection?: boolean;
  isHighlighted?: boolean;
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
  powerPath,
  isPendingConnection = false,
  isHighlighted = false,
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
    <Card className={cn("relative overflow-visible", isHighlighted && "ring-2 ring-primary/50")} style={{ zIndex: 10 }}>
      <ConnectionNode
        id={speaker.id}
        type="input"
        position="left"
        connected={!!connectionColor}
        color={connectionColor}
        onClick={() => onNodeClick?.(speaker.id)}
        isPending={isPendingConnection}
        isHighlighted={isHighlighted}
      />
      
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
            value={speaker.model}
            onValueChange={handleModelChange}
            options={presets}
            formatData={(preset) => `${preset.pmaxAES}W AES`}
            testId={`select-speaker-model-${speaker.id}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Qty</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={speaker.quantity}
              onChange={(e) => {
                const num = Number(e.target.value);
                if (!isNaN(num)) onUpdate({ quantity: Math.max(1, num) });
              }}
              className="h-7 w-12 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
              data-testid={`input-speaker-quantity-${speaker.id}`}
            />
          </div>

          {!isBasic && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Pmax</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={speaker.pmaxAES}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) onUpdate({ pmaxAES: num });
                  }}
                  className="h-7 w-20 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={!isCustom}
                  data-testid={`input-speaker-pmax-${speaker.id}`}
                />
                <span className="text-xs text-muted-foreground">W</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Z</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={speaker.impedance}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) onUpdate({ impedance: num });
                  }}
                  className="h-7 w-12 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={!isCustom}
                  data-testid={`input-speaker-impedance-${speaker.id}`}
                />
                <span className="text-xs text-muted-foreground">Ω</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Sens</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={speaker.sensitivity}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) onUpdate({ sensitivity: num });
                  }}
                  className="h-7 w-14 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={!isCustom}
                  data-testid={`input-speaker-sensitivity-${speaker.id}`}
                />
                <span className="text-xs text-muted-foreground">dB</span>
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
