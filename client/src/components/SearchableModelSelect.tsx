import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SearchableModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Record<string, any>;
  formatData?: (preset: any) => string;
  testId?: string;
  presetType?: 'generator' | 'amplifier' | 'speaker';
}

const getVerifiedMessage = (type?: string) => {
  switch (type) {
    case 'generator':
      return "This generator's preset has been verified against the manufacturer's documentation";
    case 'amplifier':
      return "This amplifier's preset has been verified against the manufacturer's documentation";
    case 'speaker':
      return "This speaker's preset has been verified against the manufacturer's documentation";
    default:
      return "This preset has been verified against the manufacturer's documentation";
  }
};

export default function SearchableModelSelect({
  value,
  onValueChange,
  options,
  formatData,
  testId,
  presetType,
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
            filteredOptions.map(([key, preset]) => {
              const dataDisplay = formatData ? formatData(preset) : null;
              return (
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
                  <div className={value === key ? 'ml-0' : 'ml-5'}>
                    <div className="flex items-baseline gap-1.5">
                      <span>{preset.name}</span>
                      {preset.verified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BadgeCheck className="w-3 h-3 text-green-600 dark:text-green-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">{getVerifiedMessage(presetType)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {dataDisplay && (
                        <span className="text-muted-foreground text-xs">
                          {dataDisplay}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
