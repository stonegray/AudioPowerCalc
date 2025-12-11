import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ConnectionNodeProps {
  id: string;
  type: 'input' | 'output';
  position: 'left' | 'right';
  connected?: boolean;
  color?: string;
  onClick?: (id: string) => void;
  onDragStart?: (id: string, x: number, y: number) => void;
  onDragEnd?: (id: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  label?: string;
  isPending?: boolean;
  isHighlighted?: boolean;
}

const DEFAULT_COLORS = {
  input: '#3b82f6',
  output: '#10b981',
};

export default function ConnectionNode({
  id,
  type,
  position,
  connected = false,
  color,
  onClick,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  label,
  isPending = false,
  isHighlighted = false,
}: ConnectionNodeProps) {
  const nodeColor = color || DEFAULT_COLORS[type];
  const nodeRef = useRef<HTMLButtonElement>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    dragStartPos.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    isDragging.current = false;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartPos.current.x;
      const dy = moveEvent.clientY - dragStartPos.current.y;
      
      if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging.current = true;
        onDragStart?.(id, dragStartPos.current.x, dragStartPos.current.y);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (isDragging.current) {
        onDragEnd?.(id);
        isDragging.current = false;
      } else {
        onClick?.(id);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [id, onClick, onDragStart, onDragEnd]);
  
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 flex items-center gap-2',
        position === 'left' ? '-left-6' : '-right-6',
        position === 'left' ? 'flex-row-reverse' : 'flex-row'
      )}
      style={{ zIndex: 9999 }}
    >
      {label && (
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium bg-background/90 px-1.5 py-0.5 rounded shadow-sm border">
          {label}
        </span>
      )}
      <button
        ref={nodeRef}
        data-testid={`node-${type}-${id}`}
        data-node-id={id}
        data-node-type={type}
        onMouseDown={handleMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          'w-5 h-5 rounded-full border-3 transition-all duration-150',
          'hover:scale-125 cursor-pointer',
          'focus:outline-none',
          isPending && 'animate-pulse scale-110',
          isHighlighted && 'scale-125',
        )}
        style={{ 
          backgroundColor: connected ? nodeColor : 'hsl(var(--background))',
          borderColor: nodeColor,
          borderWidth: '3px',
          boxShadow: isHighlighted 
            ? `0 0 12px 4px ${nodeColor}80, 0 0 0 2px ${nodeColor}40`
            : `0 0 0 3px hsl(var(--background)), 0 2px 8px ${nodeColor}60`,
        }}
      />
    </div>
  );
}
