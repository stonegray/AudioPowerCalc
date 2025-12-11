import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
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
  bass_dubstep: '3 + 3.3 * log10(f / 10)',
  rock: '6 + 2 * log10(f / 10)',
  acoustic: '10 + 2.5 * log10(f / 10)',
  custom: '6 + 2 * log10(f / 10)',
};

const safeEval = (formula: string, f: number): number | null => {
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
    return Math.max(MIN_CREST, Math.min(MAX_CREST, result));
  } catch {
    return null;
  }
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [formula, setFormula] = useState(PRESET_FORMULAS[genre]);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'points' | 'formula'>('formula');

  const isCustom = genre === 'custom';
  const sortedCurve = [...(crestCurve || [])].sort((a, b) => a.frequency - b.frequency);

  useEffect(() => {
    if (genre !== 'custom') {
      setFormula(PRESET_FORMULAS[genre]);
    }
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

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    if (!isCustom || editMode !== 'points') return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(index);
    setSelectedIndex(index);
  }, [isCustom, editMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingIndex === null || !svgRef.current || !isCustom) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newFreq = Math.round(xToFreq(x));
    const newCrest = Math.round(yToCrest(y) * 10) / 10;
    
    const clampedFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, newFreq));
    const clampedCrest = Math.max(MIN_CREST, Math.min(MAX_CREST, newCrest));
    
    const newCurve = [...sortedCurve];
    newCurve[draggingIndex] = { frequency: clampedFreq, crestFactor: clampedCrest };
    onCrestCurveChange(newCurve.sort((a, b) => a.frequency - b.frequency));
  }, [draggingIndex, isCustom, sortedCurve, onCrestCurveChange]);

  const handleMouseUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const handleAddPoint = useCallback((e: React.MouseEvent) => {
    if (!isCustom || editMode !== 'points' || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x < PADDING.left || x > PADDING.left + PLOT_WIDTH) return;
    if (y < PADDING.top || y > PADDING.top + PLOT_HEIGHT) return;
    
    const newFreq = Math.round(xToFreq(x));
    const newCrest = Math.round(yToCrest(y) * 10) / 10;
    
    const newCurve = [...sortedCurve, { frequency: newFreq, crestFactor: newCrest }];
    onCrestCurveChange(newCurve.sort((a, b) => a.frequency - b.frequency));
  }, [isCustom, editMode, sortedCurve, onCrestCurveChange]);

  const handleDeletePoint = useCallback(() => {
    if (selectedIndex === null || sortedCurve.length <= 2) return;
    const newCurve = sortedCurve.filter((_, i) => i !== selectedIndex);
    onCrestCurveChange(newCurve);
    setSelectedIndex(null);
  }, [selectedIndex, sortedCurve, onCrestCurveChange]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggingIndex(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const pointsPathD = sortedCurve.length > 1
    ? sortedCurve.map((pt, i) => {
        const x = freqToX(pt.frequency);
        const y = crestToY(pt.crestFactor);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Audio Content - Crest Curve</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="genre">Genre Preset</Label>
            <Select value={genre} onValueChange={(v: MusicGenre) => handleGenreChange(v)}>
              <SelectTrigger id="genre" data-testid="select-content-genre">
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

          <div className="space-y-2">
            <Label>Curve Formula</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">C(f) =</span>
                  <Input
                    value={formula}
                    onChange={(e) => handleFormulaChange(e.target.value)}
                    className="font-mono text-sm flex-1"
                    placeholder="e.g., 6 + 2 * log10(f / 10)"
                    disabled={!isCustom}
                    data-testid="input-formula"
                  />
                </div>
                {formulaError && (
                  <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {formulaError}
                  </div>
                )}
              </div>
              {isCustom && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleApplyFormula}
                  disabled={!!formulaError}
                  data-testid="button-apply-formula"
                >
                  Apply
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Use: f (frequency), log10(), sqrt(), pow(), sin(), cos(), exp(), pi, ^ for power
            </p>
          </div>

          {isCustom && (
            <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'points' | 'formula')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="formula">Formula Mode</TabsTrigger>
                <TabsTrigger value="points">Point Mode</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Crest Factor vs Frequency</Label>
              {isCustom && editMode === 'points' && selectedIndex !== null && sortedCurve.length > 2 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeletePoint}
                  data-testid="button-delete-point"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Point
                </Button>
              )}
            </div>
            <div className="border rounded-md bg-muted/30 p-2">
              <svg
                ref={svgRef}
                width={GRAPH_WIDTH}
                height={GRAPH_HEIGHT}
                className={isCustom && editMode === 'points' ? "cursor-crosshair select-none" : "select-none"}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={isCustom && editMode === 'points' ? handleAddPoint : undefined}
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
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity="1" />
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
                  <>
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
                  </>
                )}

                {editMode === 'points' && sortedCurve.map((pt, i) => {
                  const x = freqToX(pt.frequency);
                  const y = crestToY(pt.crestFactor);
                  const isSelected = selectedIndex === i;
                  const isDragging = draggingIndex === i;
                  
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected || isDragging ? 8 : 6}
                        fill={isCustom ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                        className={isCustom ? "cursor-grab active:cursor-grabbing" : ""}
                        onMouseDown={(e) => handleMouseDown(e, i)}
                        data-testid={`point-${i}`}
                      />
                      {(isSelected || isDragging) && (
                        <text
                          x={x}
                          y={y - 14}
                          textAnchor="middle"
                          className="text-[9px] fill-foreground font-mono"
                        >
                          {formatFreq(Math.round(pt.frequency))}Hz, {pt.crestFactor.toFixed(1)}dB
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              
              {isCustom && editMode === 'points' && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Double-click to add point. Drag points to adjust. Select and delete with button.
                </p>
              )}
              {isCustom && editMode === 'formula' && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Edit the formula above to shape the curve. Click Apply to update.
                </p>
              )}
              {!isCustom && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Select "Custom" preset to edit the curve
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
