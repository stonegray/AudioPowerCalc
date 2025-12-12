import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, MapPin, Music, Zap, Check, Search, BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  onGeneratorPreview?: (generator: Partial<Generator> | null) => void;
  onLocationPreview?: (temperature: number, altitude: number) => void;
  onGenrePreview?: (genre: MusicGenre) => void;
  onModePreview?: (mode: import('@/lib/types').AppMode) => void;
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
    id: "denver", 
    name: "Denver, CO", 
    temperature: 17, 
    altitude: 1609,
    description: "High altitude urban environment"
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
  onGeneratorPreview,
  onLocationPreview,
  onGenrePreview,
  onModePreview,
}: SetupWizardModalProps) {
  const [page, setPage] = useState(1);
  const [projectName, setProjectName] = useState("New Project");
  const [location, setLocation] = useState("black_rock");
  const [musicGenre, setMusicGenre] = useState<MusicGenre>("bass_dubstep");
  const [selectedGenerator, setSelectedGenerator] = useState<string | null>(null);
  const [generatorSearch, setGeneratorSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [appMode, setAppMode] = useState<import('@/lib/types').AppMode>("basic");
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [showEngineeringMode, setShowEngineeringMode] = useState(false);

  const selectedLocation = LOCATIONS.find(l => l.id === location);

  // Update preview when generator selection changes
  useEffect(() => {
    if (page === 2 && onGeneratorPreview) {
      const genPreset = selectedGenerator ? GENERATOR_PRESETS[selectedGenerator] : null;
      onGeneratorPreview(genPreset);
    }
  }, [selectedGenerator, page, onGeneratorPreview]);

  // Update preview when location changes
  useEffect(() => {
    if (onLocationPreview && selectedLocation) {
      onLocationPreview(selectedLocation.temperature, selectedLocation.altitude);
    }
  }, [location, onLocationPreview, selectedLocation]);

  // Update preview when genre changes
  useEffect(() => {
    if (onGenrePreview) {
      onGenrePreview(musicGenre);
    }
  }, [musicGenre, onGenrePreview]);

  // Update preview when app mode changes (only on page 3)
  useEffect(() => {
    if (page === 3 && onModePreview) {
      onModePreview(appMode);
    }
  }, [appMode, page, onModePreview]);
  
  const filteredLocations = LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.description.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredPresets = Object.entries(GENERATOR_PRESETS)
    .filter(([key, preset]) => 
      key !== "custom" && 
      preset.name?.toLowerCase().includes(generatorSearch.toLowerCase())
    );

  const handleNext = () => {
    if (page < 4) {
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
    setLocationSearch("");
    setAppMode("basic");
    setSkipConfirmOpen(false);
    setShowEngineeringMode(false);
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
                <Zap className="w-5 h-5" />
                Choose Mode
              </>
            )}
            {page === 4 && (
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
                  Location affects temperature and altitude derating calculations for your generators, thermal alarms for your amplifiers, and contributes to thermal compression calculations on speaker models which support it.
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="pl-8"
                      data-testid="input-location-search"
                    />
                  </div>
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-1">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => {
                              setLocation(loc.id);
                              setLocationSearch("");
                            }}
                            className={`w-full text-left p-2 rounded-md transition-colors ${
                              location === loc.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                            data-testid={`button-location-${loc.id}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{loc.name}</span>
                              <span className="text-xs opacity-75">
                                {loc.temperature}°C, {loc.altitude}m altitude • {loc.description}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No locations found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  What kind of music?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Different music genres have different electrical consumption patterns. 
                  Select the genre closest to what you plan to primarily use the system for; you can change this later.
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
                  Select a generator or shore power preset to add to your project. You can add more generators later.
                </p>
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Don't see your generator? No problem — proceed and add it manually in the editor, or select shore power (wall power) for now.
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

              <div className="grid grid-cols-2 gap-3 h-80">
                {/* Generators Column */}
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Generators</h3>
                  <ScrollArea className="flex-1 border rounded-md">
                    <div className="p-2 space-y-1">
                      {filteredPresets.filter(([_, preset]) => preset.type !== "shore").length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-4">No generators found</div>
                      ) : (
                        filteredPresets
                          .filter(([_, preset]) => preset.type !== "shore")
                          .map(([key, preset]) => (
                            <button
                              key={key}
                              className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                                selectedGenerator === key 
                                  ? "bg-primary text-primary-foreground" 
                                  : "hover-elevate"
                              }`}
                              onClick={() => setSelectedGenerator(key)}
                              data-testid={`button-generator-${key}`}
                            >
                              <div className="font-medium text-sm flex items-center gap-1.5">
                                {preset.name}
                                {preset.verified && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <BadgeCheck className="w-3 h-3 text-green-600 dark:text-green-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                      <p className="text-xs">This generator's preset has been verified against the manufacturer's documentation</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="text-xs opacity-70">
                                {preset.continuousWatts?.toLocaleString()}W
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Shore Power Column */}
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Shore Power</h3>
                  <ScrollArea className="flex-1 border rounded-md">
                    <div className="p-2 space-y-1">
                      <button
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                          selectedGenerator === null 
                            ? "bg-primary text-primary-foreground" 
                            : "hover-elevate"
                        }`}
                        onClick={() => setSelectedGenerator(null)}
                        data-testid="button-generator-skip"
                      >
                        <div className="font-medium text-sm">Skip for now</div>
                        <div className="text-xs opacity-70">Add manually</div>
                      </button>
                      {filteredPresets
                        .filter(([_, preset]) => preset.type === "shore")
                        .length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-4">No shore power found</div>
                      ) : (
                        filteredPresets
                          .filter(([_, preset]) => preset.type === "shore")
                          .map(([key, preset]) => (
                            <button
                              key={key}
                              className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                                selectedGenerator === key 
                                  ? "bg-primary text-primary-foreground"
                                  : "hover-elevate"
                              }`}
                              onClick={() => setSelectedGenerator(key)}
                              data-testid={`button-generator-${key}`}
                            >
                              <div className="font-medium text-sm flex items-center gap-1.5">
                                {preset.name}
                                {preset.verified && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <BadgeCheck className="w-3 h-3 text-green-600 dark:text-green-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                      <p className="text-xs">This generator's preset has been verified against the manufacturer's documentation</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="text-xs opacity-70">
                                {preset.continuousWatts?.toLocaleString()}W
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {page === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What's your experience level?</Label>
                <p className="text-sm text-muted-foreground">
                  Choose a mode that matches your needs. You can change this anytime in settings.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setAppMode("basic")}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    appMode === "basic"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                  data-testid="button-mode-basic"
                >
                  <div className="font-medium">Basic Mode</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="font-semibold text-xs mb-2">Pros:</div>
                    <div className="text-xs space-y-1">
                      <div>• Clean, simple interface</div>
                      <div>• Essential calculations only</div>
                      <div>• Great for getting started</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <div className="font-semibold text-xs mb-1 text-destructive">Cons:</div>
                    <div className="text-xs">Limited advanced controls</div>
                  </div>
                </button>

                <button
                  onClick={() => setAppMode("advanced")}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    appMode === "advanced"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                  data-testid="button-mode-advanced"
                >
                  <div className="font-medium">Advanced Mode</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="font-semibold text-xs mb-2">Pros:</div>
                    <div className="text-xs space-y-1">
                      <div>• More controls and options</div>
                      <div>• Professional-grade features</div>
                      <div>• Flexible configurations</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <div className="font-semibold text-xs mb-1 text-destructive">Cons:</div>
                    <div className="text-xs">More fields to configure</div>
                  </div>
                </button>

                {showEngineeringMode && (
                  <button
                    onClick={() => setAppMode("engineering")}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      appMode === "engineering"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                    data-testid="button-mode-engineering"
                  >
                    <div className="font-medium">Engineering Mode</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="font-semibold text-xs mb-2">Pros:</div>
                      <div className="text-xs space-y-1">
                        <div>• All features unlocked</div>
                        <div>• Debug panels visible</div>
                        <div>• Complete transparency</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      <div className="font-semibold text-xs mb-1 text-destructive">Cons:</div>
                      <div className="text-xs">Complex interface, steep learning curve</div>
                    </div>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Checkbox
                  id="show-engineering"
                  checked={showEngineeringMode}
                  onCheckedChange={(checked) => setShowEngineeringMode(checked as boolean)}
                  data-testid="checkbox-show-engineering"
                />
                <Label htmlFor="show-engineering" className="text-xs cursor-pointer">
                  Show even more advanced modes
                </Label>
              </div>
            </div>
          )}

          {page === 4 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">You're all set!</h3>
                <p className="text-sm text-muted-foreground">
                  Your project "{projectName}" has been configured in <span className="font-medium capitalize">{appMode}</span> mode. You can now add amplifiers, 
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
            {page > 1 && page < 4 && (
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
              {[1, 2, 3, 4].map((p) => (
                <div
                  key={p}
                  className={`w-2 h-2 rounded-full ${
                    p === page ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button onClick={handleNext} data-testid="button-next">
              {page === 4 ? "Close" : "Next"}
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
