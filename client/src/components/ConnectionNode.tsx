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
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 flex items-center gap-1',
        position === 'left' ? '-left-3' : '-right-3',
        position === 'left' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {label && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {label}
        </span>
      )}
      <button
        data-testid={`node-${type}-${id}`}
        data-node-id={id}
        data-node-type={type}
        onClick={() => onClick?.(id)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
          'w-3 h-3 rounded-full border-2 transition-all duration-150',
          'hover:scale-125 hover:shadow-md',
          connected
            ? 'border-transparent'
            : 'border-muted-foreground/50 bg-background hover:border-primary',
        )}
        style={connected && color ? { backgroundColor: color, borderColor: color } : undefined}
      />
    </div>
  );
}
