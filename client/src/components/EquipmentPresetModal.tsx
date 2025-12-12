import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import type { Generator, Amplifier, Speaker, PoweredSpeaker } from "@/lib/types";

interface EquipmentPresetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentType: "generator" | "amplifier" | "speaker" | "poweredSpeaker" | null;
  presets: Record<string, Partial<Generator | Amplifier | Speaker | PoweredSpeaker>>;
  onSelect: (presetKey: string | null) => void;
}

export default function EquipmentPresetModal({
  open,
  onOpenChange,
  equipmentType,
  presets,
  onSelect,
}: EquipmentPresetModalProps) {
  const [search, setSearch] = useState("");

  const filteredPresets = Object.entries(presets).filter(
    ([key, preset]) =>
      key !== "custom" &&
      (preset.name?.toLowerCase().includes(search.toLowerCase()) ||
        key.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (key: string | null) => {
    onSelect(key);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {equipmentType === "generator" && "Choose a Generator"}
            {equipmentType === "amplifier" && "Choose an Amplifier"}
            {equipmentType === "speaker" && "Choose a Speaker"}
            {equipmentType === "poweredSpeaker" && "Choose a Powered Speaker"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Can't find your model? No problem — add it anyway and you can easily change the model once it's in your project.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${equipmentType}s...`}
              className="pl-9"
              data-testid={`input-search-${equipmentType}`}
              autoFocus
            />
          </div>

          <ScrollArea className="h-72 border rounded-md">
            <div className="p-2 space-y-1">
              <button
                className="w-full text-left px-3 py-2 rounded-md transition-colors hover-elevate text-sm"
                onClick={() => handleSelect(null)}
                data-testid={`button-${equipmentType}-custom`}
              >
                <div className="font-medium">Custom {equipmentType}</div>
                <div className="text-xs opacity-70">Create with default values</div>
              </button>

              {filteredPresets.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8">
                  No {equipmentType}s found. Select "Custom" above.
                </div>
              )}

              {filteredPresets.map(([key, preset]) => (
                <button
                  key={key}
                  className="w-full text-left px-3 py-2 rounded-md transition-colors hover-elevate text-sm"
                  onClick={() => handleSelect(key)}
                  data-testid={`button-${equipmentType}-${key}`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs opacity-70">
                    {equipmentType === "generator" &&
                      `${(preset as Generator).continuousWatts?.toLocaleString()}W`}
                    {equipmentType === "amplifier" &&
                      `${(preset as Amplifier).pmax?.toLocaleString()}W per channel`}
                    {equipmentType === "speaker" &&
                      `${(preset as Speaker).sensitivity?.toFixed(1)}dB SPL`}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
