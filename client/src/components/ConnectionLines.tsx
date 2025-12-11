import { useEffect, useState, useCallback } from 'react';
import type { Connection } from '@/lib/types';

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface ConnectionLinesProps {
  connections: Connection[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ConnectionLines({ connections, containerRef }: ConnectionLinesProps) {
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());

  const updateNodePositions = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newPositions = new Map<string, NodePosition>();
    
    const nodes = container.querySelectorAll('[data-node-id]');
    nodes.forEach((node) => {
      const id = node.getAttribute('data-node-id');
      if (!id) return;
      
      const rect = node.getBoundingClientRect();
      newPositions.set(id, {
        id,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      });
    });
    
    setNodePositions(newPositions);
  }, [containerRef]);

  useEffect(() => {
    updateNodePositions();
    
    const resizeObserver = new ResizeObserver(updateNodePositions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    const mutationObserver = new MutationObserver(updateNodePositions);
    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
    
    window.addEventListener('scroll', updateNodePositions, true);
    
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', updateNodePositions, true);
    };
  }, [updateNodePositions, containerRef]);

  const createBezierPath = (start: NodePosition, end: NodePosition): string => {
    const dx = end.x - start.x;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);
    
    return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ overflow: 'visible' }}
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
            <stop offset="0%" stopColor={conn.color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={conn.color} stopOpacity="1" />
          </linearGradient>
        ))}
      </defs>
      
      {connections.map((conn) => {
        const startPos = nodePositions.get(conn.sourceId);
        const endPos = nodePositions.get(conn.targetId);
        
        if (!startPos || !endPos) return null;
        
        const path = createBezierPath(startPos, endPos);
        
        return (
          <g key={conn.id}>
            <path
              d={path}
              fill="none"
              stroke={`url(#gradient-${conn.id})`}
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-150"
            />
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="10"
              strokeLinecap="round"
              className="pointer-events-auto cursor-pointer hover:stroke-destructive/20"
              data-testid={`connection-line-${conn.id}`}
            />
          </g>
        );
      })}
    </svg>
  );
}
