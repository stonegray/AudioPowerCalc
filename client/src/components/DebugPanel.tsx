import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugEntry {
  label: string;
  value: string | number | boolean | undefined | null;
  unit?: string;
  isCalculated?: boolean;
  isConnection?: boolean;
}

interface DebugSection {
  title: string;
  entries: DebugEntry[];
}

interface DebugPanelProps {
  sections: DebugSection[];
  testId?: string;
}

function formatValue(value: string | number | boolean | undefined | null, unit?: string): string {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(4);
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return unit ? `${value} ${unit}` : value.toString();
}

export default function DebugPanel({ sections, testId }: DebugPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between h-7 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30" 
          data-testid={testId}
        >
          <div className="flex items-center gap-1.5">
            <Bug className="w-3 h-3 text-yellow-600" />
            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Debug Data</span>
          </div>
          <ChevronDown className={cn('w-3 h-3 text-yellow-600 transition-transform', open && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md p-2 mt-1 space-y-2 text-xs font-mono max-h-80 overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="text-yellow-700 dark:text-yellow-400 font-semibold border-b border-yellow-500/30 pb-0.5 mb-1">
                {section.title}
              </div>
              <div className="space-y-0.5 pl-1">
                {section.entries.map((entry, entryIndex) => (
                  <div 
                    key={entryIndex} 
                    className={cn(
                      "flex justify-between gap-2",
                      entry.isCalculated && "text-blue-600 dark:text-blue-400",
                      entry.isConnection && "text-green-600 dark:text-green-400"
                    )}
                  >
                    <span className="text-muted-foreground truncate">{entry.label}:</span>
                    <span className="text-right whitespace-nowrap">{formatValue(entry.value, entry.unit)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
