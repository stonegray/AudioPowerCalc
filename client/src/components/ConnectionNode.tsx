import { cn } from '@/lib/utils';

interface ConnectionNodeProps {
  id: string;
  type: 'input' | 'output';
  position: 'left' | 'right';
  connected?: boolean;
  color?: string;
  onClick?: (id: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  label?: string;
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
  onMouseEnter,
  onMouseLeave,
  label,
}: ConnectionNodeProps) {
  const nodeColor = color || DEFAULT_COLORS[type];
  
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 flex items-center gap-2 z-[100]',
        position === 'left' ? '-left-8' : '-right-8',
        position === 'left' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {label && (
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium bg-background/80 px-1 rounded">
          {label}
        </span>
      )}
      <button
        data-testid={`node-${type}-${id}`}
        data-node-id={id}
        data-node-type={type}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(id);
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          'w-5 h-5 rounded-full border-2 transition-all duration-150',
          'hover:scale-150 hover:shadow-lg cursor-pointer',
          'ring-4 ring-background shadow-md',
          'focus:outline-none focus:ring-primary/50',
        )}
        style={{ 
          backgroundColor: nodeColor,
          borderColor: connected ? nodeColor : 'hsl(var(--background))',
          boxShadow: `0 0 0 2px ${nodeColor}40, 0 2px 8px ${nodeColor}60`,
        }}
      />
    </div>
  );
}
