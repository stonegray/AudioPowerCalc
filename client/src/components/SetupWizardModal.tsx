import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, MapPin, Music, Zap, Check, Search } from "lucide-react";
import type { MusicGenre, GlobalSettings, Generator } from "@/lib/types";
import { GENERATOR_PRESETS } from "@/lib/types";

interface SetupWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (config: {
    projectName: string;
    location: string;
    musicGenre: MusicGenre;
    temperature: number;
    altitude: number;
    generator: Partial<Generator> | null;
  }) => void;
}

const LOCATIONS = [
  { 
    id: "black_rock", 
    name: "Black Rock City, NV", 
    temperature: 40, 
    altitude: 1190,
    description: "Desert conditions with extreme heat"
  },
  { 
    id: "tankwa", 
    name: "Tankwa Karoo, ZA", 
    temperature: 38, 
    altitude: 450,
    description: "Semi-desert with high temperatures"
  },
  { 
    id: "indoor", 
    name: "Indoor, Sea Level", 
    temperature: 22, 
    altitude: 0,
    description: "Climate controlled environment"
  },
];

const MUSIC_GENRES: { value: MusicGenre; label: string; description: string }[] = [
  { 
    value: "bass_dubstep", 
    label: "Bass / Dubstep", 
    description: "Heavy bass, high power draw peaks" 
  },
  { 
    value: "rock", 
    label: "Rock / Pop", 
    description: "Moderate dynamics, balanced consumption" 
  },
  { 
    value: "acoustic", 
    label: "Acoustic / Classical", 
    description: "Wide dynamics, lower average power" 
  },
  { 
    value: "white_noise", 
    label: "White Noise / Electronic", 
    description: "Sustained levels, consistent power" 
  },
];

export default function SetupWizardModal({
  open,
  onOpenChange,
  onComplete,
}: SetupWizardModalProps) {
  const [page, setPage] = useState(1);
  const [projectName, setProjectName] = useState("New Project");
  const [location, setLocation] = useState("black_rock");
  const [musicGenre, setMusicGenre] = useState<MusicGenre>("bass_dubstep");
  const [selectedGenerator, setSelectedGenerator] = useState<string | null>(null);
  const [generatorSearch, setGeneratorSearch] = useState("");
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

  const selectedLocation = LOCATIONS.find(l => l.id === location);
  
  const filteredPresets = Object.entries(GENERATOR_PRESETS)
    .filter(([key, preset]) => 
      key !== "custom" && 
      preset.name?.toLowerCase().includes(generatorSearch.toLowerCase())
    );

  const handleNext = () => {
    if (page < 3) {
      setPage(page + 1);
    } else {
      const genPreset = selectedGenerator ? GENERATOR_PRESETS[selectedGenerator] : null;
      onComplete({
        projectName,
        location,
        musicGenre,
        temperature: selectedLocation?.temperature ?? 25,
        altitude: selectedLocation?.altitude ?? 0,
        generator: genPreset,
      });
      resetAndClose();
    }
  };

  const handleBack = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const resetAndClose = () => {
    setPage(1);
    setProjectName("New Project");
    setLocation("black_rock");
    setMusicGenre("bass_dubstep");
    setSelectedGenerator(null);
    setGeneratorSearch("");
    onOpenChange(false);
  };

  const handleSkip = () => {
    setSkipConfirmOpen(true);
  };

  const handleSkipConfirm = () => {
    setSkipConfirmOpen(false);
    resetAndClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetAndClose();
        else onOpenChange(isOpen);
      }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {page === 1 && (
              <>
                <MapPin className="w-5 h-5" />
                Project Setup
              </>
            )}
            {page === 2 && (
              <>
                <Zap className="w-5 h-5" />
                Power Source
              </>
            )}
            {page === 3 && (
              <>
                <Check className="w-5 h-5" />
                Setup Complete
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {page === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  data-testid="input-project-name"
                />
              </div>

              <div className="space-y-2">
                <Label>Where are you?</Label>
                <p className="text-sm text-muted-foreground">
                  Location affects temperature and altitude derating calculations for your generators.
                </p>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        <div className="flex flex-col">
                          <span>{loc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {loc.temperature}°C, {loc.altitude}m altitude
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  What kind of music?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Different music genres have different electrical consumption patterns. 
                  Select the genre closest to what you plan to primarily use the system for.
                </p>
                <Select value={musicGenre} onValueChange={(v) => setMusicGenre(v as MusicGenre)}>
                  <SelectTrigger data-testid="select-genre">
                    <SelectValue placeholder="Select music genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_GENRES.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value}>
                        <div className="flex flex-col">
                          <span>{genre.label}</span>
                          <span className="text-xs text-muted-foreground">{genre.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {page === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How do you power your system?</Label>
                <p className="text-sm text-muted-foreground">
                  Select a generator preset to add to your project. You can add more generators later.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={generatorSearch}
                  onChange={(e) => setGeneratorSearch(e.target.value)}
                  placeholder="Search generators..."
                  className="pl-9"
                  data-testid="input-generator-search"
                />
              </div>

              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedGenerator === null 
                        ? "bg-primary text-primary-foreground" 
                        : "hover-elevate"
                    }`}
                    onClick={() => setSelectedGenerator(null)}
                    data-testid="button-generator-skip"
                  >
                    <div className="font-medium">Skip for now</div>
                    <div className="text-xs opacity-70">Add generators manually later</div>
                  </button>
                  {filteredPresets.map(([key, preset]) => (
                    <button
                      key={key}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedGenerator === key 
                          ? "bg-primary text-primary-foreground" 
                          : "hover-elevate"
                      }`}
                      onClick={() => setSelectedGenerator(key)}
                      data-testid={`button-generator-${key}`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs opacity-70">
                        {preset.continuousWatts?.toLocaleString()}W continuous, {preset.type}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {page === 3 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">You're all set!</h3>
                <p className="text-sm text-muted-foreground">
                  Your project "{projectName}" has been configured. You can now add amplifiers, 
                  speakers, and connect your audio system.
                </p>
              </div>
              <div className="pt-4">
                <a
                  href="https://docs.replit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  data-testid="link-docs"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Documentation
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <div className="flex gap-2">
            {page > 1 && page < 3 && (
              <Button variant="outline" onClick={handleBack} data-testid="button-back">
                Back
              </Button>
            )}
            {page < 3 && (
              <Button variant="ghost" onClick={handleSkip} data-testid="button-skip-wizard">
                Skip
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mr-4">
              {[1, 2, 3].map((p) => (
                <div
                  key={p}
                  className={`w-2 h-2 rounded-full ${
                    p === page ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button onClick={handleNext} data-testid="button-next">
              {page === 3 ? "Close" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Setup?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Skipping the setup wizard will create an entirely empty project file. 
                <strong className="block mt-2">You will be responsible for entering all project data manually.</strong>
              </p>
              <p className="text-sm">
                This includes project settings, generators, amplifiers, speakers, and all connections.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel data-testid="button-skip-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkipConfirm} data-testid="button-skip-confirm">
              Skip Setup
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
