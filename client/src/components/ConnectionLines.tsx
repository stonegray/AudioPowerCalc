import { useLayoutEffect, useRef, memo } from 'react';
import type { Connection } from '@/lib/types';

interface NodePosition {
  x: number;
  y: number;
}

interface ConnectionLinesProps {
  connections: Connection[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  hoveredConnectionId?: string | null;
  dragState?: {
    sourceId: string;
    sourceX: number;
    sourceY: number;
    currentX: number;
    currentY: number;
  } | null;
  onConnectionHover?: (connectionId: string | null) => void;
  onConnectionClick?: (connectionId: string) => void;
}

const createBezierPath = (startX: number, startY: number, endX: number, endY: number): string => {
  const dx = endX - startX;
  const controlOffset = Math.min(Math.abs(dx) * 0.4, 150);
  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
};

function ConnectionLinesComponent({ 
  connections, 
  containerRef, 
  hoveredConnectionId,
  dragState,
  onConnectionHover,
  onConnectionClick,
}: ConnectionLinesProps) {
  const nodePositionsRef = useRef<Map<string, NodePosition>>(new Map());
  const pathCacheRef = useRef<Map<string, string>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const connectionIdsRef = useRef<Set<string>>(new Set());

  // Calculate node positions from DOM
  const updateNodePositions = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const positions = nodePositionsRef.current;
    
    const nodes = container.querySelectorAll('[data-node-id]');
    nodes.forEach((node) => {
      const id = node.getAttribute('data-node-id');
      if (!id) return;
      
      const rect = node.getBoundingClientRect();
      positions.set(id, {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      });
    });
  };

  // Update SVG paths with calculated positions
  const updatePaths = () => {
    const positions = nodePositionsRef.current;
    const pathCache = pathCacheRef.current;
    const connectionIds = connectionIdsRef.current;

    connectionIds.forEach((connId) => {
      const group = svgRef.current?.querySelector(`[data-connection-id="${connId}"]`);
      if (!group) return;

      const paths = group.querySelectorAll('path') as NodeListOf<SVGPathElement>;
      if (paths.length === 0) return;

      // Extract connection info from DOM or reconstruct
      const connIndex = Array.from(group.parentElement?.querySelectorAll('[data-connection-id]') || []).indexOf(group);
      const conn = connections[connIndex];
      if (!conn) return;

      const startPos = positions.get(conn.sourceId);
      const endPos = positions.get(conn.targetId);
      
      if (!startPos || !endPos) return;
      
      const newPath = createBezierPath(startPos.x, startPos.y, endPos.x, endPos.y);
      const prevPath = pathCache.get(connId);
      
      if (newPath === prevPath) return;
      
      pathCache.set(connId, newPath);
      
      // Update all paths in the group
      paths.forEach((path) => {
        path.setAttribute('d', newPath);
      });
    });

    // Update drag line
    if (dragState && svgRef.current) {
      const dragPath = createBezierPath(
        dragState.sourceX,
        dragState.sourceY,
        dragState.currentX,
        dragState.currentY
      );
      const dragLine = svgRef.current.querySelector('[data-drag-line]') as SVGPathElement;
      if (dragLine) {
        dragLine.setAttribute('d', dragPath);
      }
    }
  };

  // 60fps RAF loop
  const raf = () => {
    updateNodePositions();
    updatePaths();
    rafIdRef.current = requestAnimationFrame(raf);
  };

  // Setup RAF loop on mount
  useLayoutEffect(() => {
    // Update connection IDs set
    connectionIdsRef.current = new Set(connections.map(c => c.id));

    // Initial update
    updateNodePositions();
    updatePaths();

    // Start RAF loop if not running
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(raf);
    }

    // Resize observer for layout changes
    const resizeObserver = new ResizeObserver(() => {
      updateNodePositions();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Update connection IDs when connections change (but don't restart RAF)
  useLayoutEffect(() => {
    connectionIdsRef.current = new Set(connections.map(c => c.id));
  }, [connections]);

  // Cleanup RAF on unmount
  useLayoutEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible', zIndex: 0 }}
    >
      <defs>
        {connections.map((conn) => (
          <linearGradient
            key={`gradient-${conn.id}`}
            id={`gradient-${conn.id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={conn.color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={conn.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={conn.color} stopOpacity="0.6" />
          </linearGradient>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {connections.map((conn) => {
        const isHighlighted = hoveredConnectionId === conn.id;
        
        return (
          <g key={conn.id} data-connection-id={conn.id}>
            {isHighlighted && (
              <path
                fill="none"
                stroke={conn.color}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.3"
                filter="url(#glow)"
              />
            )}
            <path
              fill="none"
              stroke={`url(#gradient-${conn.id})`}
              strokeWidth={isHighlighted ? "4" : "3"}
              strokeLinecap="round"
            />
            <path
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              strokeLinecap="round"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => onConnectionHover?.(conn.id)}
              onMouseLeave={() => onConnectionHover?.(null)}
              onClick={() => onConnectionClick?.(conn.id)}
              data-testid={`connection-line-${conn.id}`}
            />
          </g>
        );
      })}
      
      {dragState && (
        <path
          data-drag-line
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 4"
          opacity="0.7"
        />
      )}
    </svg>
  );
}

export default memo(ConnectionLinesComponent);
