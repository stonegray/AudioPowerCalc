import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, AlertTriangle, Thermometer, Mountain, Ruler, Music, Palette, Settings2, Sun, Moon, FileJson, Download, Upload, FileText, Lock, Zap, Mail } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { GlobalSettings, MusicGenre, Units, SPLDistance, CrestCurvePoint, CrestAlgorithm } from '@/lib/types';
import { GENRE_PRESETS } from '@/lib/types';

interface ProjectSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onExport?: () => void;
  onImport?: () => void;
}

type SettingsCategory = 'project' | 'units' | 'audio' | 'theme' | 'advanced' | 'library';

const GRAPH_WIDTH = 460;
const GRAPH_HEIGHT = 260;
const PADDING = { top: 20, right: 30, bottom: 40, left: 50 };
const PLOT_WIDTH = GRAPH_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = GRAPH_HEIGHT - PADDING.top - PADDING.bottom;

const MIN_FREQ = 10;
const MAX_FREQ = 20000;
const MIN_CREST = 0;
const MAX_CREST = 20;

const freqToX = (freq: number): number => {
  const logMin = Math.log10(MIN_FREQ);
  const logMax = Math.log10(MAX_FREQ);
  const logFreq = Math.log10(Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq)));
  return PADDING.left + ((logFreq - logMin) / (logMax - logMin)) * PLOT_WIDTH;
};

const crestToY = (crest: number): number => {
  const clampedCrest = Math.max(MIN_CREST, Math.min(MAX_CREST, crest));
  return PADDING.top + PLOT_HEIGHT - (clampedCrest / MAX_CREST) * PLOT_HEIGHT;
};

const FREQ_TICKS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const CREST_TICKS = [0, 5, 10, 15, 20];

const formatFreq = (f: number): string => {
  if (f >= 1000) return `${f / 1000}k`;
  return `${f}`;
};

const PRESET_FORMULAS: Record<MusicGenre, string> = {
  bass_dubstep: '7.836251 + (1.774292 - 7.836251)/(1 + (f/107.2078)^11.43433)',
  rock: '8',
  acoustic: '10 + 2.5 * log10(f / 10)',
  white_noise: '0',
  custom: '7.836251 + (1.774292 - 7.836251)/(1 + (f/107.2078)^11.43433)',
};

const safeEvalRaw = (formula: string, f: number): number | null => {
  try {
    const sanitized = formula
      .replace(/log10/g, 'Math.log10')
      .replace(/log/g, 'Math.log')
      .replace(/ln/g, 'Math.log')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/pow/g, 'Math.pow')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/exp/g, 'Math.exp')
      .replace(/pi/gi, 'Math.PI')
      .replace(/\^/g, '**');
    
    const func = new Function('f', `return ${sanitized}`);
    const result = func(f);
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
};

const safeEval = (formula: string, f: number): number | null => {
  const result = safeEvalRaw(formula, f);
  if (result === null) return null;
  return Math.max(MIN_CREST, Math.min(MAX_CREST, result));
};

interface CurveValidation {
  hasError: boolean;
  hasWarning: boolean;
  errorMessage: string | null;
  warningMessage: string | null;
  errorFrequencies: number[];
  warningFrequencies: number[];
}

const validateFormula = (formula: string): CurveValidation => {
  const result: CurveValidation = {
    hasError: false,
    hasWarning: false,
    errorMessage: null,
    warningMessage: null,
    errorFrequencies: [],
    warningFrequencies: [],
  };
  
  const testFrequencies: number[] = [];
  for (let i = 0; i <= 100; i++) {
    const logMin = Math.log10(1);
    const logMax = Math.log10(30000);
    const logFreq = logMin + (i / 100) * (logMax - logMin);
    testFrequencies.push(Math.pow(10, logFreq));
  }
  
  for (const freq of testFrequencies) {
    const crest = safeEvalRaw(formula, freq);
    if (crest !== null) {
      if (crest < 0) {
        result.hasError = true;
        result.errorFrequencies.push(freq);
      }
      if (crest > 20) {
        result.hasWarning = true;
        result.warningFrequencies.push(freq);
      }
    }
  }
  
  if (result.hasError) {
    const minFreq = Math.min(...result.errorFrequencies);
    const maxFreq = Math.max(...result.errorFrequencies);
    if (minFreq === maxFreq) {
      result.errorMessage = `Crest factor below 0dB at ${formatFreq(Math.round(minFreq))}Hz`;
    } else {
      result.errorMessage = `Crest factor below 0dB between ${formatFreq(Math.round(minFreq))}Hz - ${formatFreq(Math.round(maxFreq))}Hz`;
    }
  }
  
  if (result.hasWarning) {
    const minFreq = Math.min(...result.warningFrequencies);
    const maxFreq = Math.max(...result.warningFrequencies);
    if (minFreq === maxFreq) {
      result.warningMessage = `Crest factor exceeds 20dB at ${formatFreq(Math.round(minFreq))}Hz`;
    } else {
      result.warningMessage = `Crest factor exceeds 20dB between ${formatFreq(Math.round(minFreq))}Hz - ${formatFreq(Math.round(maxFreq))}Hz`;
    }
  }
  
  return result;
};

const generateCurveFromFormula = (formula: string): CrestCurvePoint[] => {
  const points: CrestCurvePoint[] = [];
  const frequencies = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  
  for (const freq of frequencies) {
    const crest = safeEval(formula, freq);
    if (crest !== null) {
      points.push({ frequency: freq, crestFactor: Math.round(crest * 10) / 10 });
    }
  }
  
  return points;
};

const CATEGORY_ITEMS: { id: SettingsCategory; label: string; icon: typeof Settings2 }[] = [
  { id: 'project', label: 'Project', icon: FileText },
  { id: 'units', label: 'Units & Environment', icon: Ruler },
  { id: 'audio', label: 'Audio Content', icon: Music },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'library', label: 'User Library', icon: Lock },
  { id: 'advanced', label: 'Advanced Parameters', icon: Settings2 },
];

export default function ProjectSettingsModal({
  open,
  onOpenChange,
  settings,
  onUpdate,
  theme,
  onThemeChange,
  onExport,
  onImport,
}: ProjectSettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('project');
  const [formula, setFormula] = useState(() => PRESET_FORMULAS[settings.musicGenre] || PRESET_FORMULAS.rock);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [timeFormula, setTimeFormula] = useState('');

  const isCustom = settings.musicGenre === 'custom';

  useEffect(() => {
    const newFormula = PRESET_FORMULAS[settings.musicGenre] || PRESET_FORMULAS.rock;
    setFormula(newFormula);
    setFormulaError(null);
  }, [settings.musicGenre]);
  
  // Generate crest curve on mount if it's empty
  useEffect(() => {
    if (!settings.crestCurve || settings.crestCurve.length === 0) {
      const currentFormula = PRESET_FORMULAS[settings.musicGenre] || PRESET_FORMULAS.rock;
      const newCurve = generateCurveFromFormula(currentFormula);
      if (newCurve.length > 0) {
        onUpdate({ crestCurve: newCurve });
      }
    }
  }, []);

  const formulaCurvePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const numPoints = 100;
    
    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const logMin = Math.log10(MIN_FREQ);
      const logMax = Math.log10(MAX_FREQ);
      const logFreq = logMin + ratio * (logMax - logMin);
      const freq = Math.pow(10, logFreq);
      
      const crest = safeEval(formula, freq);
      if (crest !== null) {
        points.push({ x: freqToX(freq), y: crestToY(crest) });
      }
    }
    
    return points;
  }, [formula]);

  const formulaPath = useMemo(() => {
    if (formulaCurvePoints.length < 2) return '';
    return formulaCurvePoints.map((pt, i) => 
      i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`
    ).join(' ');
  }, [formulaCurvePoints]);

  const curveValidation = useMemo(() => validateFormula(formula), [formula]);

  const handleGenreChange = useCallback((newGenre: MusicGenre) => {
    const newFormula = PRESET_FORMULAS[newGenre];
    setFormula(newFormula);
    const newCurve = generateCurveFromFormula(newFormula);
    onUpdate({ musicGenre: newGenre, crestCurve: newCurve });
  }, [onUpdate]);

  const handleFormulaChange = useCallback((newFormula: string) => {
    setFormula(newFormula);
    
    const testResult = safeEval(newFormula, 1000);
    if (testResult === null) {
      setFormulaError('Invalid formula');
      return;
    }
    
    setFormulaError(null);
    
    if (isCustom) {
      const newCurve = generateCurveFromFormula(newFormula);
      if (newCurve.length > 0) {
        onUpdate({ crestCurve: newCurve });
      }
    }
  }, [isCustom, onUpdate]);

  const handleApplyFormula = useCallback(() => {
    if (!isCustom) {
      onUpdate({ musicGenre: 'custom' });
    }
    const newCurve = generateCurveFromFormula(formula);
    if (newCurve.length > 0) {
      onUpdate({ crestCurve: newCurve });
    }
  }, [formula, isCustom, onUpdate]);

  const tempUnit = settings.units === 'metric' ? 'C' : 'F';
  const altUnit = settings.units === 'metric' ? 'm' : 'ft';

  const displayTemp = settings.units === 'imperial' 
    ? Math.round((settings.ambientTemperature * 9/5) + 32) 
    : Math.round(settings.ambientTemperature);
  
  const displayAlt = settings.units === 'imperial'
    ? Math.round(settings.altitude * 3.28084)
    : settings.altitude;

  const handleTempChange = (displayValue: number) => {
    const metricValue = settings.units === 'imperial'
      ? (displayValue - 32) * 5/9
      : displayValue;
    onUpdate({ ambientTemperature: metricValue });
  };

  const handleAltChange = (displayValue: number) => {
    const metricValue = settings.units === 'imperial'
      ? displayValue / 3.28084
      : displayValue;
    onUpdate({ altitude: metricValue });
  };

  const renderUnitsContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Units & Environment</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure measurement units and environmental conditions for accurate power calculations.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Measurement System</Label>
          <Select
            value={settings.units}
            onValueChange={(v: Units) => onUpdate({ units: v })}
          >
            <SelectTrigger data-testid="select-units">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (Celsius, meters)</SelectItem>
              <SelectItem value="imperial">Imperial (Fahrenheit, feet)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Ambient Temperature
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={displayTemp}
                onChange={(e) => handleTempChange(parseFloat(e.target.value) || 0)}
                className="font-mono"
                data-testid="input-temperature"
              />
              <span className="text-sm text-muted-foreground w-8">{tempUnit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher temperatures reduce generator efficiency
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              Altitude
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                value={displayAlt}
                onChange={(e) => handleAltChange(parseFloat(e.target.value) || 0)}
                className="font-mono"
                data-testid="input-altitude"
              />
              <span className="text-sm text-muted-foreground w-8">{altUnit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher altitude reduces air density and cooling
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAudioContent = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h3 className="text-lg font-semibold mb-2">Audio Content - Crest Curve</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure the crest factor curve based on your audio content type.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre-select">Genre</Label>
        <Select key={settings.musicGenre} value={settings.musicGenre} onValueChange={handleGenreChange}>
          <SelectTrigger id="genre-select" data-testid="select-genre">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bass_dubstep">Bass/Dubstep</SelectItem>
            <SelectItem value="rock">Rock</SelectItem>
            <SelectItem value="acoustic">Acoustic</SelectItem>
            <SelectItem value="white_noise">White Noise</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isCustom && (
        <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>Formula is read-only for genre presets. Select "Custom" to modify.</span>
        </div>
      )}

      {curveValidation.hasError && (
        <div className="flex items-start gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>{curveValidation.errorMessage}</span>
        </div>
      )}

      {curveValidation.hasWarning && !curveValidation.hasError && (
        <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>{curveValidation.warningMessage}</span>
        </div>
      )}

      <div className={`flex-1 flex flex-col gap-4 min-h-0 transition-opacity ${!isCustom ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex flex-col overflow-hidden">
          <Label className="mb-2">Crest Factor vs Frequency</Label>
          <div className="border rounded-md bg-muted/30 p-2 flex-1 flex items-center justify-center overflow-auto">
            <svg
              width={GRAPH_WIDTH}
              height={GRAPH_HEIGHT}
              className="select-none flex-shrink-0"
              data-testid="svg-crest-graph"
            >
              <defs>
                <linearGradient id="settingsFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="settingsFormulaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={PLOT_WIDTH}
                height={PLOT_HEIGHT}
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />

              {FREQ_TICKS.map(freq => (
                <g key={freq}>
                  <line
                    x1={freqToX(freq)}
                    y1={PADDING.top}
                    x2={freqToX(freq)}
                    y2={PADDING.top + PLOT_HEIGHT}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={freqToX(freq)}
                    y={PADDING.top + PLOT_HEIGHT + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground"
                  >
                    {formatFreq(freq)}
                  </text>
                </g>
              ))}

              {CREST_TICKS.map(crest => (
                <g key={crest}>
                  <line
                    x1={PADDING.left}
                    y1={crestToY(crest)}
                    x2={PADDING.left + PLOT_WIDTH}
                    y2={crestToY(crest)}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={PADDING.left - 8}
                    y={crestToY(crest) + 4}
                    textAnchor="end"
                    className="text-[10px] fill-muted-foreground"
                  >
                    {crest}dB
                  </text>
                </g>
              ))}

              <text
                x={PADDING.left + PLOT_WIDTH / 2}
                y={GRAPH_HEIGHT - 4}
                textAnchor="middle"
                className="text-[11px] fill-muted-foreground font-medium"
              >
                Frequency (Hz)
              </text>
              <text
                x={12}
                y={PADDING.top + PLOT_HEIGHT / 2}
                textAnchor="middle"
                className="text-[11px] fill-muted-foreground font-medium"
                transform={`rotate(-90, 12, ${PADDING.top + PLOT_HEIGHT / 2})`}
              >
                Crest Factor (dB)
              </text>

              {formulaPath && (
                <g key={formula}>
                  <path
                    d={formulaPath + ` L ${formulaCurvePoints[formulaCurvePoints.length - 1]?.x || 0} ${PADDING.top + PLOT_HEIGHT} L ${formulaCurvePoints[0]?.x || 0} ${PADDING.top + PLOT_HEIGHT} Z`}
                    fill="url(#settingsFillGradient)"
                  />
                  <path
                    d={formulaPath}
                    fill="none"
                    stroke="url(#settingsFormulaGradient)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </svg>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Edit the formula to shape the curve
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <div className="space-y-2">
            <Label htmlFor="formula-input">Curve Formula</Label>
            <div className="flex items-start gap-2">
              <span className="text-sm font-mono text-muted-foreground pt-2">C(f) =</span>
              <Textarea
                id="formula-input"
                value={formula}
                onChange={(e) => handleFormulaChange(e.target.value)}
                className="font-mono text-sm resize-none min-h-20 flex-1"
                placeholder="e.g., 6 + 2 * log10(f / 10)"
                disabled={!isCustom}
                data-testid="input-formula"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Functions: log10(), sqrt(), pow(), sin(), cos(), exp()
            </p>
          </div>

          {formulaError && (
            <div className="flex items-start gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{formulaError}</span>
            </div>
          )}

          <Tabs value="formula" className="flex-shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formula">Formula Mode</TabsTrigger>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <TabsTrigger value="points" disabled className="opacity-50 cursor-not-allowed">
                      Point Mode
                    </TabsTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="time-formula">Time Domain</Label>
            <div className="flex items-start gap-2">
              <span className="text-sm font-mono text-muted-foreground pt-2">C(t) =</span>
              <Textarea
                id="time-formula"
                value={timeFormula}
                onChange={(e) => setTimeFormula(e.target.value)}
                className="font-mono text-sm resize-none flex-1 min-h-16"
                placeholder="e.g., 4 + 4 * cos(2 * pi * f * t)"
                data-testid="input-time-formula"
              />
            </div>
          </div>

          <Button 
            onClick={handleApplyFormula}
            disabled={!!formulaError}
            className="w-full"
            data-testid="button-apply-formula"
          >
            Apply Formula
          </Button>
        </div>
      </div>
    </div>
  );

  const renderThemeContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize the appearance of the application.
        </p>
      </div>

      <div className="space-y-4">
        <Label>Color Mode</Label>
        <div className="flex gap-4">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            className="flex-1 h-24 flex-col gap-2"
            onClick={() => onThemeChange('light')}
            data-testid="button-theme-light"
          >
            <Sun className="w-8 h-8" />
            <span>Light</span>
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="flex-1 h-24 flex-col gap-2"
            onClick={() => onThemeChange('dark')}
            data-testid="button-theme-dark"
          >
            <Moon className="w-8 h-8" />
            <span>Dark</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProjectContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Manage project name, notes, and configuration files.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input
            type="text"
            value={settings.projectName || ''}
            onChange={(e) => onUpdate({ projectName: e.target.value })}
            placeholder="Enter project name"
            data-testid="input-project-name"
          />
          <p className="text-xs text-muted-foreground">
            A name to help you identify this configuration
          </p>
        </div>

        <div className="space-y-2">
          <Label>User Notes</Label>
          <Textarea
            value={settings.userNotes || ''}
            onChange={(e) => onUpdate({ userNotes: e.target.value })}
            placeholder="Add any notes about this project..."
            className="resize-none h-32"
            data-testid="textarea-user-notes"
          />
          <p className="text-xs text-muted-foreground">
            Add notes about your setup, design decisions, or any other relevant information
          </p>
        </div>

        <div className="space-y-2">
          <Label>Configuration Files</Label>
          <div className="flex gap-2">
            {onExport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExport}
                data-testid="button-export-json"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            )}
            {onImport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onImport}
                data-testid="button-import-json"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import JSON
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Export your complete configuration as JSON or import a previously saved one
          </p>
        </div>
      </div>
    </div>
  );

  const renderUserLibraryContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">User Library</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Build and manage your custom library of equipment presets.
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-gradient-to-br from-primary/5 to-primary/10 space-y-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-2">Pro Feature</h4>
            <p className="text-sm text-muted-foreground">
              Create and save custom equipment presets to your personal library. Access your saved configurations across all projects.
            </p>
          </div>
        </div>

        <Button className="w-full gap-2" size="sm">
          <Zap className="w-4 h-4" />
          Upgrade to Pro
        </Button>
      </div>

      <div className="border rounded-lg p-6 bg-muted/50 space-y-4">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-2">For Manufacturers</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Are you a manufacturer? Contact us to include your products in the free version of this app, accessible to all users.
            </p>
            <Button variant="outline" size="sm">
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Advanced Parameters</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Fine-tune calculation parameters for more precise results.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>SPL Reference Distance</Label>
          <Select
            value={settings.splDistance}
            onValueChange={(v: SPLDistance) => onUpdate({ splDistance: v })}
          >
            <SelectTrigger data-testid="select-spl-distance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 meter</SelectItem>
              <SelectItem value="10m">10 meters</SelectItem>
              <SelectItem value="50m">50 meters</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Distance at which SPL values are calculated
          </p>
        </div>

        <div className="space-y-2">
          <Label>Array Summation Factor</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={settings.arraySummationFactor}
              onChange={(e) => onUpdate({ arraySummationFactor: parseFloat(e.target.value) || 0.91 })}
              className="font-mono"
              data-testid="input-array-summation"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Factor applied when multiple speakers are arrayed together (default: 0.91)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Crest Algorithm</Label>
          <Select
            value={settings.crestAlgorithm}
            onValueChange={(v: CrestAlgorithm) => onUpdate({ crestAlgorithm: v })}
          >
            <SelectTrigger data-testid="select-crest-algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="peak">Peak</SelectItem>
              <SelectItem value="maximum">Maximum</SelectItem>
              <SelectItem value="rms_weighted">RMS Weighted</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Method used to calculate effective crest factor from the curve
          </p>
        </div>

        <div className="space-y-2">
          <Label>Frequency Samples</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={settings.numSamples}
              onChange={(e) => onUpdate({ numSamples: parseInt(e.target.value) || 20 })}
              className="font-mono"
              data-testid="input-num-samples"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Number of frequency samples used for curve calculations
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'project':
        return renderProjectContent();
      case 'units':
        return renderUnitsContent();
      case 'audio':
        return renderAudioContent();
      case 'theme':
        return renderThemeContent();
      case 'library':
        return renderUserLibraryContent();
      case 'advanced':
        return renderAdvancedContent();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden p-0">
        <div className="flex h-[600px]">
          <div className="w-56 border-r bg-muted/30 p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 px-2">Project Settings</h2>
            <nav className="space-y-1 flex-1">
              {CATEGORY_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                    activeCategory === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover-elevate text-muted-foreground"
                  )}
                  data-testid={`button-settings-${item.id}`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
