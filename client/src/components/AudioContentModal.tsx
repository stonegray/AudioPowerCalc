import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
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

const MIN_FREQ = 20;
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

const FREQ_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const CREST_TICKS = [0, 5, 10, 15, 20];

const formatFreq = (f: number): string => {
  if (f >= 1000) return `${f / 1000}k`;
  return `${f}`;
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

  const isCustom = genre === 'custom';
  const sortedCurve = [...(crestCurve || [])].sort((a, b) => a.frequency - b.frequency);

  const handleGenreChange = useCallback((newGenre: MusicGenre) => {
    onGenreChange(newGenre);
    if (newGenre !== 'custom') {
      onCrestCurveChange(GENRE_CREST_PRESETS[newGenre]);
    }
  }, [onGenreChange, onCrestCurveChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    if (!isCustom) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(index);
    setSelectedIndex(index);
  }, [isCustom]);

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
    if (!isCustom || !svgRef.current) return;
    
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
  }, [isCustom, sortedCurve, onCrestCurveChange]);

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

  const pathD = sortedCurve.length > 1
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
          <DialogTitle>Audio Content</DialogTitle>
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
            <div className="flex items-center justify-between">
              <Label>Crest Curve (Crest Factor vs Frequency)</Label>
              {isCustom && selectedIndex !== null && sortedCurve.length > 2 && (
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
                className="cursor-crosshair select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={isCustom ? handleAddPoint : undefined}
                data-testid="svg-crest-graph"
              >
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
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

                {sortedCurve.length > 1 && (
                  <>
                    <path
                      d={pathD + ` L ${freqToX(sortedCurve[sortedCurve.length - 1].frequency)} ${PADDING.top + PLOT_HEIGHT} L ${freqToX(sortedCurve[0].frequency)} ${PADDING.top + PLOT_HEIGHT} Z`}
                      fill="url(#fillGradient)"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#curveGradient)"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {sortedCurve.map((pt, i) => {
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
              
              {isCustom && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Double-click to add point. Drag points to adjust. Select and delete with button.
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
