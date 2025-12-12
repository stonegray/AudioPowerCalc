import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GainKnobProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  testId?: string;
}

export default function GainKnob({
  value,
  min = -12,
  max = 12,
  onChange,
  size = 'md',
  label = 'Gain',
  className,
  testId,
}: GainKnobProps) {
  const safeValue = value ?? 0;
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(safeValue);

  const normalizedValue = (safeValue - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = safeValue;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY.current - moveEvent.clientY;
      const sensitivity = (max - min) / 300;
      const newValue = Math.min(max, Math.max(min, startValue.current + deltaY * sensitivity));
      onChange(Math.round(newValue * 10) / 10);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [safeValue, min, max, onChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.5 : 0.5;
    const newValue = Math.min(max, Math.max(min, safeValue + delta));
    onChange(Math.round(newValue * 10) / 10);
  }, [safeValue, min, max, onChange]);

  const tickMarks = [];
  for (let i = 0; i <= 6; i++) {
    const tickAngle = -135 + (i / 6) * 270;
    tickMarks.push(
      <div
        key={i}
        className="absolute w-0.5 h-1.5 bg-muted-foreground/40"
        style={{
          top: '2px',
          left: '50%',
          transformOrigin: 'center 24px',
          transform: `translateX(-50%) rotate(${tickAngle}deg)`,
        }}
      />
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        ref={knobRef}
        className={cn(
          'relative rounded-full cursor-grab select-none',
          'bg-gradient-to-b from-muted to-muted/80',
          'border border-border shadow-sm',
          sizeClasses[size],
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        data-testid={testId}
      >
        {tickMarks}
        
        <div
          className="absolute inset-2 rounded-full bg-gradient-to-b from-card to-muted/50 border border-border/50 shadow-inner"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div 
            className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full bg-primary"
          />
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-xs font-mono font-medium">
          {safeValue > 0 ? '+' : ''}{safeValue.toFixed(1)} dB
        </div>
      </div>
    </div>
  );
}
