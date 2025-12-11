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

export default function ConnectionLines({ 
  connections, 
  containerRef, 
  hoveredConnectionId,
  dragState,
  onConnectionHover,
  onConnectionClick,
}: ConnectionLinesProps) {
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
    
    const handleScroll = () => updateNodePositions();
    window.addEventListener('scroll', handleScroll, true);
    
    if (containerRef.current) {
      const scrollables = containerRef.current.querySelectorAll('[data-radix-scroll-area-viewport]');
      scrollables.forEach(el => {
        el.addEventListener('scroll', handleScroll);
      });
    }
    
    const interval = setInterval(updateNodePositions, 50);
    
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll, true);
      if (containerRef.current) {
        const scrollables = containerRef.current.querySelectorAll('[data-radix-scroll-area-viewport]');
        scrollables.forEach(el => {
          el.removeEventListener('scroll', handleScroll);
        });
      }
      clearInterval(interval);
    };
  }, [updateNodePositions, containerRef]);

  const createBezierPath = (startX: number, startY: number, endX: number, endY: number): string => {
    const dx = endX - startX;
    const controlOffset = Math.min(Math.abs(dx) * 0.4, 150);
    
    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  };

  const getConnectedIds = (connectionId: string): Set<string> => {
    const conn = connections.find(c => c.id === connectionId);
    if (!conn) return new Set();
    
    const ids = new Set<string>();
    ids.add(conn.sourceId);
    ids.add(conn.targetId);
    
    connections.forEach(c => {
      if (c.sourceId === conn.sourceId || c.targetId === conn.sourceId ||
          c.sourceId === conn.targetId || c.targetId === conn.targetId) {
        ids.add(c.sourceId);
        ids.add(c.targetId);
      }
    });
    
    return ids;
  };

  const isConnectionHighlighted = (conn: Connection): boolean => {
    if (!hoveredConnectionId) return false;
    if (conn.id === hoveredConnectionId) return true;
    
    const hoveredConn = connections.find(c => c.id === hoveredConnectionId);
    if (!hoveredConn) return false;
    
    return conn.sourceId === hoveredConn.sourceId || 
           conn.targetId === hoveredConn.targetId ||
           conn.sourceId === hoveredConn.targetId ||
           conn.targetId === hoveredConn.sourceId;
  };

  return (
    <svg
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
        const startPos = nodePositions.get(conn.sourceId);
        const endPos = nodePositions.get(conn.targetId);
        
        if (!startPos || !endPos) return null;
        
        const path = createBezierPath(startPos.x, startPos.y, endPos.x, endPos.y);
        const isHighlighted = isConnectionHighlighted(conn);
        
        return (
          <g key={conn.id}>
            {isHighlighted && (
              <path
                d={path}
                fill="none"
                stroke={conn.color}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.3"
                filter="url(#glow)"
              />
            )}
            <path
              d={path}
              fill="none"
              stroke={`url(#gradient-${conn.id})`}
              strokeWidth={isHighlighted ? "4" : "3"}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
            <path
              d={path}
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
          d={createBezierPath(dragState.sourceX, dragState.sourceY, dragState.currentX, dragState.currentY)}
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
