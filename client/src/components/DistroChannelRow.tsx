import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2 } from 'lucide-react';
import ConnectionNode from './ConnectionNode';
import DebugPanel from './DebugPanel';
import type { DistroChannel, PhaseType, CableInputMode } from '@/lib/types';
import { AWG_RESISTANCE } from '@/lib/types';
import { cn } from '@/lib/utils';
import { calculateCableResistance } from '@/lib/calculations';

interface DistroChannelRowProps {
  channel: DistroChannel;
  index: number;
  maxPhases: number;
  generatorPhaseType: PhaseType;
  onUpdate: (updates: Partial<DistroChannel>) => void;
  onRemove: () => void;
  onNodeClick?: (id: string) => void;
  connectionColor?: string;
  appMode?: 'basic' | 'advanced' | 'engineering';
  generatorType?: string;
  warningShown?: boolean;
  onShowWarning?: () => void;
  onConfirmWarning?: (updates: Partial<DistroChannel>) => void;
}

export default function DistroChannelRow({
  channel,
  index,
  maxPhases,
  generatorPhaseType,
  onUpdate,
  onRemove,
  onNodeClick,
  connectionColor,
  appMode = 'advanced',
  generatorType = 'standard',
  warningShown = false,
  onShowWarning,
  onConfirmWarning,
}: DistroChannelRowProps) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [cablePresetsOpen, setCablePresetsOpen] = useState(false);
  const [pendingOutputTypeUpdate, setPendingOutputTypeUpdate] = useState<PhaseType | null>(null);

  const DISTRO_PRESETS = [
    { label: '15A Single', ampacity: 15, outputType: 'single' as PhaseType },
    { label: '20A Single', ampacity: 20, outputType: 'single' as PhaseType },
    { label: '30A Single', ampacity: 30, outputType: 'single' as PhaseType },
    { label: '50A Single', ampacity: 50, outputType: 'single' as PhaseType },
    { label: '30A 3-Phase', ampacity: 30, outputType: '3_wye' as PhaseType },
    { label: '50A 3-Phase', ampacity: 50, outputType: '3_wye' as PhaseType },
  ];

  const CABLE_PRESETS = [
    { label: '12 AWG @ 25 ft', awg: 12, length: 25 },
    { label: '12 AWG @ 50 ft', awg: 12, length: 50 },
    { label: '12 AWG @ 100 ft', awg: 12, length: 100 },
    { label: '10 AWG @ 25 ft', awg: 10, length: 25 },
    { label: '10 AWG @ 50 ft', awg: 10, length: 50 },
    { label: '10 AWG @ 100 ft', awg: 10, length: 100 },
    { label: '8 AWG @ 50 ft', awg: 8, length: 50 },
    { label: '8 AWG @ 100 ft', awg: 8, length: 100 },
    { label: '6 AWG @ 100 ft', awg: 6, length: 100 },
  ];

  const handleOutputTypeChange = (newType: PhaseType) => {
    // Check if we need to show warning
    if (generatorType !== 'shore' && !warningShown) {
      setPendingOutputTypeUpdate(newType);
      onShowWarning?.();
    } else {
      onUpdate({ outputType: newType });
    }
  };

  const handleConfirmOutputType = () => {
    if (pendingOutputTypeUpdate) {
      onConfirmWarning?.({ outputType: pendingOutputTypeUpdate });
      setPendingOutputTypeUpdate(null);
    }
  };

  const handlePreset = (preset: typeof DISTRO_PRESETS[0]) => {
    const phaseSource = preset.outputType === '3_wye' ? 123 : 1;
    // Check if we need to show warning for preset that changes output type
    if (generatorType !== 'shore' && !warningShown && preset.outputType !== channel.outputType) {
      setPendingOutputTypeUpdate(preset.outputType);
      onShowWarning?.();
    } else {
      onUpdate({
        ampacity: preset.ampacity,
        outputType: preset.outputType,
        phaseSource,
      });
    }
    setPresetsOpen(false);
  };

  const handleCablePreset = (preset: typeof CABLE_PRESETS[0]) => {
    onUpdate({
      cable: {
        ...channel.cable,
        mode: 'awg',
        awg: preset.awg,
        length: preset.length,
      },
    });
    setCablePresetsOpen(false);
  };

  const getPhaseOptions = (): { value: number; label: string }[] => {
    const options: { value: number; label: string }[] = [];
    
    // Add single phase line-to-neutral options (L1, L2, L3)
    for (let i = 1; i <= maxPhases; i++) {
      options.push({ value: i, label: `L${i}` });
    }
    
    // Add 3-phase line-to-line options if Wye generator
    if (generatorPhaseType === '3_wye' && maxPhases >= 3) {
      options.push(
        { value: 12, label: 'L12' },
        { value: 23, label: 'L23' },
        { value: 31, label: 'L31' },
        { value: 123, label: 'L123' }
      );
    }
    
    return options;
  };

  const phaseOptions = getPhaseOptions();
  const isLineToLine = channel.phaseSource >= 12;
  const voltageForAmpacity = isLineToLine ? 208 : 120;
  const maxWatts = channel.ampacity * voltageForAmpacity;
  const utilizationPercent = maxWatts > 0 ? (channel.loadWatts / maxWatts) * 100 : 0;
  const utilizationColor = utilizationPercent > 90 ? 'text-destructive' : 
    utilizationPercent > 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground';

  // Calculate voltage drop based on cable configuration
  const calculateActualVoltage = (): number => {
    let resistanceOhms = 0;
    
    if (channel.cable.mode === 'manual' && channel.cable.manualResistance) {
      resistanceOhms = channel.cable.manualResistance / 1000;
    } else if (channel.cable.mode === 'awg' && channel.cable.awg && channel.cable.length) {
      resistanceOhms = calculateCableResistance(channel.cable.awg, channel.cable.length, AWG_RESISTANCE);
    }
    
    if (resistanceOhms === 0 || channel.loadWatts === 0) {
      return voltageForAmpacity;
    }
    
    // Calculate current: for 3-phase, current = power / (voltage * sqrt(3))
    const currentAmps = isLineToLine 
      ? channel.loadWatts / (voltageForAmpacity * Math.sqrt(3))
      : channel.loadWatts / voltageForAmpacity;
    
    const voltageDrop = currentAmps * resistanceOhms;
    return Math.max(0, voltageForAmpacity - voltageDrop);
  };

  const actualVoltage = calculateActualVoltage();

  const getAvailablePhaseTypes = (): { value: PhaseType; label: string }[] => {
    const types: { value: PhaseType; label: string }[] = [
      { value: 'single', label: 'Single' },
      { value: 'split', label: 'Split' },
    ];
    
    if (maxPhases >= 3) {
      types.push({ value: '3_delta', label: '3ph Delta' });
      if (generatorPhaseType !== '3_delta') {
        types.push({ value: '3_wye', label: '3ph Wye' });
      }
    }
    
    return types;
  };

  const availablePhaseTypes = getAvailablePhaseTypes();
  const isBasic = appMode === 'basic';

  return (
    <div className="relative bg-muted/50 rounded-md p-2 pr-8">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <Switch
            checked={channel.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            data-testid={`switch-distro-enabled-${index}`}
          />
          <span className="text-xs font-medium">D{index + 1}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Badge variant="outline" className="font-mono text-xs h-fit">
            {voltageForAmpacity}V ({actualVoltage.toFixed(2)}V)
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 min-w-[100px] cursor-help">
                <span className={cn('text-xs font-mono', utilizationColor)}>
                  {channel.loadWatts.toFixed(0)}W/{maxWatts}W
                </span>
                <span className="text-xs text-muted-foreground">breaker</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Breaker capacity can exceed the generator's rated capacity. Verify total system power draw doesn't overload the generator.</p>
            </TooltipContent>
          </Tooltip>
          <Progress value={utilizationPercent} className="h-1.5 w-16" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={onRemove}
            data-testid={`button-remove-distro-${index}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isBasic && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Ph</Label>
            <Select
              value={String(channel.phaseSource)}
              onValueChange={(v) => onUpdate({ phaseSource: Number(v) })}
            >
              <SelectTrigger className="h-7 w-20 text-xs" data-testid={`select-phase-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {phaseOptions.map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isBasic && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">A</Label>
            <Select
              value={String(channel.ampacity)}
              onValueChange={(v) => onUpdate({ ampacity: Number(v) })}
            >
              <SelectTrigger className="h-7 w-16 text-xs" data-testid={`select-ampacity-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15A</SelectItem>
                <SelectItem value="20">20A</SelectItem>
                <SelectItem value="30">30A</SelectItem>
                <SelectItem value="50">50A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {!isBasic && (
          <Popover open={presetsOpen} onOpenChange={setPresetsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs" data-testid={`button-distro-presets-${index}`}>
                Presets
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {DISTRO_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-7 text-xs font-mono"
                    onClick={() => handlePreset(preset)}
                    data-testid={`button-distro-preset-${preset.label}`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {!isBasic && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={channel.outputType}
              onValueChange={handleOutputTypeChange}
            >
              <SelectTrigger className="h-7 w-24 text-xs" data-testid={`select-output-type-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePhaseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isBasic && (
          <div className="flex items-center gap-1">
            <Select
              value={channel.cable.mode}
              onValueChange={(v: CableInputMode) => onUpdate({ cable: { ...channel.cable, mode: v } })}
            >
              <SelectTrigger className="h-7 w-14 text-xs" data-testid={`select-cable-mode-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="awg">AWG</SelectItem>
                <SelectItem value="manual">mΩ</SelectItem>
              </SelectContent>
            </Select>
            {channel.cable.mode === 'awg' ? (
              <>
                <Input
                  type="number"
                  value={channel.cable.awg || 12}
                  onChange={(e) => onUpdate({ cable: { ...channel.cable, awg: Number(e.target.value) } })}
                  className="h-7 w-20 font-mono text-right text-xs"
                  data-testid={`input-cable-awg-${index}`}
                />
                <Input
                  type="number"
                  value={channel.cable.length || 50}
                  onChange={(e) => onUpdate({ cable: { ...channel.cable, length: Number(e.target.value) } })}
                  className="h-7 w-20 font-mono text-right text-xs"
                  placeholder="ft"
                  data-testid={`input-cable-length-${index}`}
                />
                <Popover open={cablePresetsOpen} onOpenChange={setCablePresetsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs" data-testid={`button-cable-presets-${index}`}>
                      Cable
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-1" align="start">
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {CABLE_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-7 text-xs font-mono"
                          onClick={() => handleCablePreset(preset)}
                          data-testid={`button-cable-preset-${preset.label}`}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <Input
                type="number"
                value={channel.cable.manualResistance || 0}
                onChange={(e) => onUpdate({ cable: { ...channel.cable, manualResistance: Number(e.target.value) } })}
                className="h-7 w-20 font-mono text-right text-xs"
                placeholder="mΩ"
                data-testid={`input-cable-resistance-${index}`}
              />
            )}
          </div>
        )}
      </div>

      {appMode === 'engineering' && channel.connectedLoads && channel.connectedLoads.length > 0 && (
        <DebugPanel
          testId={`button-toggle-debug-distro-${channel.id}`}
          sections={[
            {
              title: 'Connected Loads',
              entries: channel.connectedLoads.map((load, i) => ({
                label: `${load.ampName} (Amp ${i + 1})`,
                value: `${load.watts.toFixed(0)}W avg / ${load.peakWatts.toFixed(0)}W pk`,
                isConnection: true
              }))
            },
            {
              title: 'Per-Load Details',
              entries: channel.connectedLoads.flatMap((load, i) => [
                { label: `Amp ${i + 1} Watts`, value: load.watts, unit: 'W', isCalculated: true },
                { label: `Amp ${i + 1} Peak`, value: load.peakWatts, unit: 'W', isCalculated: true },
                { label: `Amp ${i + 1} PF`, value: load.powerFactor.toFixed(2), isCalculated: true },
                { label: `Amp ${i + 1} VA`, value: load.va, unit: 'VA', isCalculated: true },
                { label: `Amp ${i + 1} Peak VA`, value: load.peakVa, unit: 'VA', isCalculated: true },
              ])
            },
            {
              title: 'Aggregated',
              entries: [
                { label: 'Total Load Watts', value: channel.loadWatts, unit: 'W', isCalculated: true },
                { label: 'Total Peak Watts', value: channel.peakLoadWatts, unit: 'W', isCalculated: true },
                { label: 'Aggregate PF', value: (channel.aggregatePowerFactor || 1.0).toFixed(2), isCalculated: true },
                { label: 'Total VA', value: channel.totalVa, unit: 'VA', isCalculated: true },
                { label: 'Peak VA', value: channel.peakTotalVa, unit: 'VA', isCalculated: true },
              ]
            }
          ]}
        />
      )}

      <ConnectionNode
        id={channel.id}
        type="output"
        position="right"
        connected={!!connectionColor}
        color={connectionColor}
        onClick={onNodeClick}
      />
    </div>
  );
}
