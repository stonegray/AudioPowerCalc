import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Trash2, Speaker } from "lucide-react";
import ConnectionNode from "./ConnectionNode";
import SearchableModelSelect from "./SearchableModelSelect";
import DebugPanel from "./DebugPanel";
import type {
  Speaker as SpeakerType,
  SPEAKER_PRESETS,
  AppMode,
  Connection,
  Units,
  Amplifier,
  Generator,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  isExploding?: boolean;
  connections?: Connection[];
  units?: Units;
  amplifiers?: Amplifier[];
  generators?: Generator[];
}

const getDisplayDistance = (
  distance: string,
  units: Units = "metric",
): string => {
  if (units === "metric") return distance;
  // Convert to feet: 1m ≈ 3ft, 10m ≈ 33ft, 50m ≈ 164ft
  const conversions: Record<string, string> = {
    "1m": "3 ft",
    "10m": "33 ft",
    "50m": "164 ft",
  };
  return conversions[distance] || distance;
};

const isUpstreamEnabled = (
  speakerId: string,
  connections: Connection[],
  amplifiers: Amplifier[],
  generators: Generator[],
): boolean => {
  // Find connection to this speaker
  const connection = connections.find(
    (c) => c.targetId === speakerId && c.targetType === "speaker",
  );
  if (!connection) return false;

  // Find the connected amp channel
  const amp = amplifiers.find((a) =>
    a.channels.some((ch) => ch.id === connection.sourceId),
  );
  if (!amp) return false;

  const channel = amp.channels.find((ch) => ch.id === connection.sourceId);
  if (!channel || !channel.enabled) return false;

  // Find the generator that powers this amp
  const generator = generators.find((g) =>
    g.distroChannels.some((dc) => dc.id === amp.connectedDistroId),
  );
  if (!generator) return false;

  // Find the distro channel
  const distroChannel = generator.distroChannels.find(
    (dc) => dc.id === amp.connectedDistroId,
  );
  if (!distroChannel || !distroChannel.enabled) return false;

  return true;
};

export default function SpeakerCard({
  speaker,
  presets,
  splDistance,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
  appMode = "advanced",
  powerPath,
  isPendingConnection = false,
  isHighlighted = false,
  isExploding = false,
  connections = [],
  units = "metric",
  amplifiers = [],
  generators = [],
}: SpeakerCardProps) {
  const isCustom = speaker.model === "custom";
  const isBasic = appMode === "basic";
  const hasConnection = connections.some(
    (c) => c.targetId === speaker.id && c.targetType === "speaker",
  );
  const isPowered =
    hasConnection &&
    isUpstreamEnabled(speaker.id, connections, amplifiers, generators);
  const utilizationColor =
    speaker.utilizationPercent > 90
      ? "text-destructive"
      : speaker.utilizationPercent > 75
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-foreground";

  const handleModelChange = (model: string) => {
    const preset = presets[model];
    if (preset) {
      onUpdate({
        model,
        name: preset.name || "Custom Speaker",
        pmax: preset.pmax || 1000,
        impedance: preset.impedance || 8,
        nominalImpedance: preset.nominalImpedance || 8,
        actualImpedance: undefined,
        cableImpedanceMilliohms: preset.cableImpedanceMilliohms || 0,
        sensitivity: preset.sensitivity || 100,
      });
    } else {
      onUpdate({ model });
    }
  };

  const nominalZ = speaker.nominalImpedance ?? speaker.impedance ?? 8;
  const cableZ = speaker.cableImpedanceMilliohms ?? 0;
  const effectiveImpedance =
    speaker.actualImpedance !== undefined && speaker.actualImpedance > 0
      ? speaker.actualImpedance
      : nominalZ;
  const cableImpedanceOhms = cableZ / 1000;

  return (
    <Card
      className={cn(
        "relative overflow-visible",
        isHighlighted && "ring-2 ring-primary/50",
        isExploding && "animate-explode pointer-events-none",
      )}
      style={{ 
        zIndex: isExploding ? 100 : 10,
        ...(isExploding && {
          animation: "explode 2s ease-out forwards",
        }),
      }}
    >
      {isExploding && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-orange-500 via-red-600 to-transparent opacity-90 animate-pulse" />
          <div className="text-4xl font-bold text-white drop-shadow-lg animate-bounce">BOOM!</div>
        </div>
      )}
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
            {!isPowered && (
              <Badge
                variant="destructive"
                className="bg-orange-500 hover:bg-orange-600 text-xs"
              >
                Disconnected
              </Badge>
            )}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRemove}
              data-testid={`button-remove-speaker-${speaker.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {appMode !== "basic" && (
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-mono font-semibold">
              {speaker.splOutput.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              dB SPL @ {getDisplayDistance(splDistance, units)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-1.5">
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span
                className={cn(
                  "text-lg font-mono font-semibold",
                  utilizationColor,
                )}
              >
                {speaker.utilizationPercent.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">util</span>
              <span className="text-xs text-muted-foreground">-</span>
              <span className="text-sm font-mono">
                {((speaker.utilizationPercent / 100) * speaker.pmax).toFixed(0)}
                W
              </span>
            </div>
            <Progress value={speaker.utilizationPercent} className="h-1.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        {appMode!== "basic" && (
          <div className="text-center pb-1">
            <span className="text-xs text-muted-foreground bg-background/90 px-2 py-0.5 rounded-full border shadow-sm">
              {powerPath}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <SearchableModelSelect
            value={speaker.model}
            onValueChange={handleModelChange}
            options={presets}
            formatData={(preset) => `${preset.pmax}W`}
            testId={`select-speaker-model-${speaker.id}`}
          />

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
              onWheel={(e) => {
                e.preventDefault();
                const delta = (e as any).deltaY > 0 ? -1 : 1;
                onUpdate({ quantity: Math.max(1, speaker.quantity + delta) });
              }}
              className="h-7 w-12 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
              data-testid={`input-speaker-quantity-${speaker.id}`}
            />
          </div>

          {!isBasic && (
            <>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  Pmax
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={speaker.pmax}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num)) onUpdate({ pmax: num });
                  }}
                  className="h-7 w-20 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={!isCustom}
                  data-testid={`input-speaker-pmax-${speaker.id}`}
                />
                <span className="text-xs text-muted-foreground">W</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Z nom</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={nominalZ}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num))
                      onUpdate({ nominalImpedance: num, impedance: num });
                  }}
                  className="h-7 w-12 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  disabled={!isCustom}
                  data-testid={`input-speaker-nominal-impedance-${speaker.id}`}
                  title="Nominal (rated) impedance"
                />
                <span className="text-xs text-muted-foreground">Ω</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Z act</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={speaker.actualImpedance ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      onUpdate({ actualImpedance: undefined });
                    } else {
                      const num = Number(val);
                      if (!isNaN(num)) onUpdate({ actualImpedance: num });
                    }
                  }}
                  placeholder={nominalZ.toFixed(1)}
                  className="h-7 w-12 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  data-testid={`input-speaker-actual-impedance-${speaker.id}`}
                  title="Actual impedance (optional, leave blank to use nominal)"
                />
                <span className="text-xs text-muted-foreground">Ω</span>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Cable Z</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={cableZ}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!isNaN(num))
                      onUpdate({ cableImpedanceMilliohms: Math.max(0, num) });
                  }}
                  className="h-7 w-16 font-mono text-right text-xs [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                  data-testid={`input-speaker-cable-impedance-${speaker.id}`}
                  title="Cable impedance in milliohms"
                />
                <span className="text-xs text-muted-foreground">mΩ</span>
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

        {appMode !== "basic" && (
          <div className="bg-muted/50 rounded-md px-2 py-1 text-xs font-mono">
            <span className="text-muted-foreground">Eff Z: </span>
            <span>
              {(
                (effectiveImpedance + cableImpedanceOhms) /
                speaker.quantity
              ).toFixed(2)}
              Ω
            </span>
          </div>
        )}

        {appMode === "engineering" && (
          <DebugPanel
            testId={`button-toggle-debug-speaker-${speaker.id}`}
            sections={[
              {
                title: "User Inputs",
                entries: [
                  { label: "Model", value: speaker.model },
                  { label: "Pmax", value: speaker.pmax, unit: "W" },
                  { label: "Nominal Z", value: nominalZ, unit: "Ω" },
                  {
                    label: "Actual Z (override)",
                    value: speaker.actualImpedance,
                    unit: "Ω",
                  },
                  { label: "Cable Z", value: cableZ, unit: "mΩ" },
                  {
                    label: "Sensitivity",
                    value: speaker.sensitivity,
                    unit: "dB",
                  },
                  { label: "Quantity", value: speaker.quantity },
                  { label: "Gain", value: speaker.gain, unit: "dB" },
                ],
              },
              {
                title: "Connection Input",
                entries: [
                  {
                    label: "Connected Amp Channel",
                    value: speaker.connectedAmpChannelId || "None",
                    isConnection: true,
                  },
                  {
                    label: "Has Power Connection",
                    value: hasConnection,
                    isConnection: true,
                  },
                  {
                    label: "Is Powered (Upstream Enabled)",
                    value: isPowered,
                    isConnection: true,
                  },
                  {
                    label: "Power Path",
                    value: powerPath || "None",
                    isConnection: true,
                  },
                ],
              },
              {
                title: "Calculated Capacity",
                entries: [
                  {
                    label: "Pmax x Quantity",
                    value: speaker.pmax * speaker.quantity,
                    unit: "W",
                    isCalculated: true,
                  },
                ],
              },
              {
                title: "Calculated Outputs",
                entries: [
                  {
                    label: "Effective Impedance (per unit)",
                    value: effectiveImpedance,
                    unit: "Ω",
                    isCalculated: true,
                  },
                  {
                    label: "Effective Z + Cable (per unit)",
                    value: effectiveImpedance + cableImpedanceOhms,
                    unit: "Ω",
                    isCalculated: true,
                  },
                  {
                    label: "Parallel Z (all units)",
                    value:
                      (effectiveImpedance + cableImpedanceOhms) /
                      speaker.quantity,
                    unit: "Ω",
                    isCalculated: true,
                  },
                  {
                    label: "SPL Output",
                    value: speaker.splOutput,
                    unit: "dB",
                    isCalculated: true,
                  },
                  {
                    label: "Utilization (per speaker)",
                    value: speaker.utilizationPercent,
                    unit: "%",
                    isCalculated: true,
                  },
                ],
              },
              {
                title: "SPL Calculation Inputs",
                entries: [
                  { label: "SPL Distance", value: splDistance },
                  {
                    label: "Base SPL",
                    value: `Sensitivity + 10*log10(power/quantity)`,
                    isCalculated: true,
                  },
                ],
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
