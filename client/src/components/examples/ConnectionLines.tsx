import ConnectionLines from '../ConnectionLines';
import { useRef } from 'react';
import type { Connection } from '@/lib/types';

export default function ConnectionLinesExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const connections: Connection[] = [
    { id: 'conn_1', sourceId: 'source_1', sourceType: 'distro', targetId: 'target_1', targetType: 'amp', color: '#3b82f6' },
    { id: 'conn_2', sourceId: 'source_2', sourceType: 'ampChannel', targetId: 'target_2', targetType: 'speaker', color: '#10b981' },
  ];

  return (
    <div ref={containerRef} className="relative w-full h-64 bg-muted/30 rounded-md p-4">
      <ConnectionLines connections={connections} containerRef={containerRef} />
      
      <div className="flex justify-between items-center h-full px-8">
        <div className="space-y-8">
          <div className="relative bg-card border rounded-md p-3 pr-6">
            <span className="text-sm">Source 1</span>
            <button
              data-node-id="source_1"
              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"
            />
          </div>
          <div className="relative bg-card border rounded-md p-3 pr-6">
            <span className="text-sm">Source 2</span>
            <button
              data-node-id="source_2"
              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500"
            />
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="relative bg-card border rounded-md p-3 pl-6">
            <button
              data-node-id="target_1"
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"
            />
            <span className="text-sm">Target 1</span>
          </div>
          <div className="relative bg-card border rounded-md p-3 pl-6">
            <button
              data-node-id="target_2"
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500"
            />
            <span className="text-sm">Target 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
