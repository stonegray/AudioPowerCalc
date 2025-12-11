import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MusicGenre, CrestCurvePoint } from '@/lib/types';
import { GENRE_CREST_PRESETS } from '@/lib/types';

interface AudioContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genre: MusicGenre;
  onGenreChange: (genre: MusicGenre) => void;
  crestCurve: CrestCurvePoint[];
  onCrestCurveChange: (curve: CrestCurvePoint[]) => void;
}

const GRAPH_WIDTH = 500;
const GRAPH_HEIGHT = 280;
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

const xToFreq = (x: number): number => {
  const logMin = Math.log10(MIN_FREQ);
  const logMax = Math.log10(MAX_FREQ);
  const ratio = (x - PADDING.left) / PLOT_WIDTH;
  const logFreq = logMin + ratio * (logMax - logMin);
  return Math.pow(10, logFreq);
};

const crestToY = (crest: number): number => {
  const clampedCrest = Math.max(MIN_CREST, Math.min(MAX_CREST, crest));
  return PADDING.top + PLOT_HEIGHT - (clampedCrest / MAX_CREST) * PLOT_HEIGHT;
};

const yToCrest = (y: number): number => {
  const ratio = (PADDING.top + PLOT_HEIGHT - y) / PLOT_HEIGHT;
  return ratio * MAX_CREST;
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

export default function AudioContentModal({
  open,
  onOpenChange,
  genre,
  onGenreChange,
  crestCurve,
  onCrestCurveChange,
}: AudioContentModalProps) {
  const [formula, setFormula] = useState(() => PRESET_FORMULAS[genre] || PRESET_FORMULAS.rock);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [timeFormula, setTimeFormula] = useState('');

  const isCustom = genre === 'custom';

  useEffect(() => {
    const newFormula = PRESET_FORMULAS[genre] || PRESET_FORMULAS.rock;
    setFormula(newFormula);
    setFormulaError(null);
  }, [genre]);

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
    onGenreChange(newGenre);
    setFormula(PRESET_FORMULAS[newGenre]);
    onCrestCurveChange(GENRE_CREST_PRESETS[newGenre]);
  }, [onGenreChange, onCrestCurveChange]);

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
        onCrestCurveChange(newCurve);
      }
    }
  }, [isCustom, onCrestCurveChange]);

  const handleApplyFormula = useCallback(() => {
    if (!isCustom) {
      onGenreChange('custom');
    }
    const newCurve = generateCurveFromFormula(formula);
    if (newCurve.length > 0) {
      onCrestCurveChange(newCurve);
    }
  }, [formula, isCustom, onGenreChange, onCrestCurveChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Audio Content - Crest Curve</DialogTitle>
        </DialogHeader>

        {/* Genre Selector */}
        <div className="space-y-2">
          <Label htmlFor="genre-select">Genre</Label>
          <Select value={genre} onValueChange={handleGenreChange}>
            <SelectTrigger id="genre-select" data-testid="select-genre">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bass_dubstep">Bass/Dubstep</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="acoustic">Acoustic</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Column: Inputs and Warnings */}
          <div className="space-y-4 overflow-y-auto pr-4">
            {/* Warnings */}
            {!isCustom && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md" data-testid="formula-preset-warning">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>Formula is read-only for genre presets. Select "Custom" to modify.</span>
              </div>
            )}

            {curveValidation.hasError && (
              <div className="flex items-start gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md" data-testid="curve-error">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{curveValidation.errorMessage}</span>
              </div>
            )}

            {curveValidation.hasWarning && !curveValidation.hasError && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md" data-testid="curve-warning">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{curveValidation.warningMessage}</span>
              </div>
            )}

            {/* Formula Input */}
            <div className="space-y-2">
              <Label htmlFor="formula-input">Curve Formula</Label>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-mono text-muted-foreground pt-2">C(f) =</span>
                  <div className="flex-1">
                    <Textarea
                      id="formula-input"
                      value={formula}
                      onChange={(e) => handleFormulaChange(e.target.value)}
                      className="font-mono text-sm resize-none min-h-24"
                      placeholder="e.g., 6 + 2 * log10(f / 10)"
                      disabled={!isCustom}
                      data-testid="input-formula"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Functions: log10(), sqrt(), pow(), sin(), cos(), exp() | Constants: pi, f (frequency) | Operator: ^ for power
                </p>
              </div>

              {formulaError && (
                <div className="flex items-start gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-md">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{formulaError}</span>
                </div>
              )}
            </div>

            {isCustom && (
              <Button 
                onClick={handleApplyFormula}
                disabled={!!formulaError}
                className="w-full"
                data-testid="button-apply-formula"
              >
                Apply Formula
              </Button>
            )}

            {isCustom && (
              <Tabs value="formula">
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
            )}
          </div>

          {/* Right Column: Graph and Time Domain */}
          <div className="space-y-4 flex flex-col overflow-hidden">
            {/* Graph */}
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
              <Label>Crest Factor vs Frequency</Label>
              <div className="border rounded-md bg-muted/30 p-2 flex-1 flex items-center justify-center overflow-auto">
                <svg
                  width={GRAPH_WIDTH}
                  height={GRAPH_HEIGHT}
                  className="select-none flex-shrink-0"
                  data-testid="svg-crest-graph"
                >
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="formulaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
                      fill="url(#fillGradient)"
                    />
                    <path
                      d={formulaPath}
                      fill="none"
                      stroke="url(#formulaGradient)"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

              </svg>
              </div>
              {isCustom ? (
                <p className="text-xs text-muted-foreground text-center">
                  Edit the formula to shape the curve
                </p>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  Select "Custom" to edit
                </p>
              )}
            </div>

            {/* Time Domain */}
            <div className="space-y-2">
              <Label htmlFor="time-formula">Time Domain</Label>
              <div className="flex items-start gap-2">
                <span className="text-sm font-mono text-muted-foreground pt-2">C(t) =</span>
                <Textarea
                  id="time-formula"
                  value={timeFormula}
                  onChange={(e) => setTimeFormula(e.target.value)}
                  className="font-mono text-sm resize-none flex-1"
                  placeholder="e.g., 4 + 4 * cos(2 * pi * f * t)"
                  data-testid="input-time-formula"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use: t (time), f (frequency), pi, cos(), sin(), exp()
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
