import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Speaker } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import GainKnob from './GainKnob';
import type { PoweredSpeaker, AppMode, Units, Generator } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PoweredSpeakerCardProps {
  speaker: PoweredSpeaker;
  splDistance: string;
  onUpdate: (updates: Partial<PoweredSpeaker>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: AppMode;
  units?: Units;
  generators?: Generator[];
  connections?: any[];
}

const getDisplayDistance = (distance: string, units: Units = 'metric'): string => {
  if (units === 'metric') return distance;
  // Convert to feet: 1m ≈ 3ft, 10m ≈ 33ft, 50m ≈ 164ft
  const conversions: Record<string, string> = {
    '1m': '3 ft',
    '10m': '33 ft',
    '50m': '164 ft'
  };
  return conversions[distance] || distance;
};

const isUpstreamEnabled = (
  speakerId: string,
  connections: any[],
  generators: Generator[]
): boolean => {
  // Find connection to this powered speaker
  const connection = connections.find(c => c.targetId === speakerId && c.targetType === 'poweredSpeaker');
  if (!connection) return false;

  // Find the distro channel
  const distroChannel = generators
    .flatMap(g => g.distroChannels)
    .find(dc => dc.id === connection.sourceId);
  
  if (!distroChannel || !distroChannel.enabled) return false;

  return true;
};

export default function PoweredSpeakerCard({
  speaker,
  splDistance,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
  units = 'metric',
  generators = [],
  connections = [],
}: PoweredSpeakerCardProps) {
  const isBasic = appMode === 'basic';
  const utilizationPercent = (speaker.rmsWattsDrawn / speaker.pmax) * 100;
  const utilizationColor = utilizationPercent > 90 ? 'text-destructive' : 
    utilizationPercent > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground';
  
  const hasConnection = connections.some(c => c.targetId === speaker.id && c.targetType === 'poweredSpeaker');
  const isPowered = hasConnection && isUpstreamEnabled(speaker.id, connections, generators);

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
            {!hasConnection && (
              <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-xs">
                Disconnected
              </Badge>
            )}
            <Speaker className="w-5 h-5 text-purple-500" />
            <Input
              value={speaker.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-8 w-32 font-medium"
              data-testid={`input-powered-speaker-name-${speaker.id}`}
            />
            <Badge variant="outline" className="text-xs">Powered</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} data-testid={`button-remove-powered-speaker-${speaker.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn('text-xl font-mono font-semibold', utilizationColor)}>
                {utilizationPercent.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">util</span>
            </div>
            <Progress value={utilizationPercent} className="h-2" />
          </div>
          <div className="text-right">
            <div className="text-lg font-mono">{speaker.splOutput.toFixed(1)} dB</div>
            <div className="text-xs text-muted-foreground">SPL @ {getDisplayDistance(splDistance, units)}</div>
          </div>
          <GainKnob
            value={speaker.gain}
            onChange={(gain) => onUpdate({ gain })}
            size="sm"
            testId={`knob-powered-speaker-gain-${speaker.id}`}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={speaker.quantity}
              onChange={(e) => onUpdate({ quantity: Math.max(1, Number(e.target.value)) })}
              className="font-mono text-right"
              data-testid={`input-powered-quantity-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">PMAX (W)</Label>
            <Input
              type="number"
              value={speaker.pmax}
              onChange={(e) => onUpdate({ pmax: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-pmax-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Power Factor</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={speaker.powerFactor}
              onChange={(e) => onUpdate({ powerFactor: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-pf-${speaker.id}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Efficiency</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={speaker.efficiency}
              onChange={(e) => onUpdate({ efficiency: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-efficiency-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">HPF (Hz)</Label>
            <Input
              type="number"
              value={speaker.hpf}
              onChange={(e) => onUpdate({ hpf: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-hpf-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">LPF (Hz)</Label>
            <Input
              type="number"
              value={speaker.lpf}
              onChange={(e) => onUpdate({ lpf: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-lpf-${speaker.id}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Impedance (Ω)</Label>
            <Input
              type="number"
              value={speaker.impedance}
              onChange={(e) => onUpdate({ impedance: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-impedance-${speaker.id}`}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sensitivity (dB)</Label>
            <Input
              type="number"
              value={speaker.sensitivity}
              onChange={(e) => onUpdate({ sensitivity: Number(e.target.value) })}
              className="font-mono text-right"
              data-testid={`input-powered-sensitivity-${speaker.id}`}
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-md p-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">RMS Drawn:</span>
            <span>{speaker.rmsWattsDrawn.toFixed(0)}W</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
