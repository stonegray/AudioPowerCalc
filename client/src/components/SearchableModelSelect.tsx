import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Record<string, { name: string }>;
  testId?: string;
}

export default function SearchableModelSelect({
  value,
  onValueChange,
  options,
  testId,
}: SearchableModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = Object.entries(options).filter(([, preset]) =>
    preset.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options[value]?.name || 'Select model...';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full justify-between text-xs font-normal"
          data-testid={testId}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <div className="p-2">
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              No models found.
            </div>
          ) : (
            filteredOptions.map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  onValueChange(key);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors flex items-center gap-2',
                  value === key && 'bg-muted font-medium'
                )}
              >
                {value === key && <Check className="w-3 h-3" />}
                <span className={value === key ? 'ml-0' : 'ml-5'}>
                  {preset.name}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
