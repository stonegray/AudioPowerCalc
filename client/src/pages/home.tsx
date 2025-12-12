import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import GlobalSettingsPanel from '@/components/GlobalSettingsPanel';
import GeneratorCard from '@/components/GeneratorCard';
import AmplifierCard from '@/components/AmplifierCard';
import SpeakerCard from '@/components/SpeakerCard';
import PoweredSpeakerCard from '@/components/PoweredSpeakerCard';
import AddEquipmentButton from '@/components/AddEquipmentButton';
import ConnectionLines from '@/components/ConnectionLines';
import SaveLoadDialog from '@/components/SaveLoadDialog';
import ProjectSettingsModal from '@/components/ProjectSettingsModal';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import SetupWizardModal from '@/components/SetupWizardModal';
import EquipmentPresetModal from '@/components/EquipmentPresetModal';
import HelpModal from '@/components/HelpModal';
import ThemeToggle from '@/components/ThemeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { HelpCircle, Settings } from 'lucide-react';
import { useSystemStore } from '@/lib/store';
import { 
  GENERATOR_PRESETS, 
  AMPLIFIER_PRESETS, 
  SPEAKER_PRESETS,
  POWERED_SPEAKER_PRESETS,
  CONNECTION_COLORS,
  type Connection,
  type DistroChannel,
  type AmpChannel,
} from '@/lib/types';
import { calculateGeneratorEffectiveWatts, calculateSPL, calculateParallelImpedance } from '@/lib/calculations';
import { getAmpPowerPath, getSpeakerPowerPath } from '@/lib/powerPath';

export default function Home() {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    sourceId: string;
    sourceType: 'distro' | 'ampChannel';
  } | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [projectSettingsModalOpen, setProjectSettingsModalOpen] = useState(false);
  const [proUpgradeModalOpen, setProUpgradeModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { theme, setTheme, toggleTheme } = useTheme();
  const [explodingSpeakerId, setExplodingSpeakerId] = useState<string | null>(null);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState<"generator" | "amplifier" | "speaker" | "poweredSpeaker" | null>(null);
  const [wizardGenId, setWizardGenId] = useState<string | null>(null);

  const {
    state,
    updateGlobalSettings,
    addGenerator,
    updateGenerator,
    removeGenerator,
    addDistroChannel,
    addAmplifier,
    updateAmplifier,
    removeAmplifier,
    addSpeaker,
    updateSpeaker,
    removeSpeaker,
    addPoweredSpeaker,
    updatePoweredSpeaker,
    removePoweredSpeaker,
    addConnection,
    removeConnection,
    saveConfiguration,
    loadConfiguration,
    getSavedConfigurations,
    clearState,
  } = useSystemStore();

  const hasUnsavedWork = state.generators.length > 0 || 
    state.amplifiers.length > 0 || 
    state.speakers.length > 0 || 
    state.poweredSpeakers.length > 0;

  useEffect(() => {
    const configs = getSavedConfigurations();
    if (configs.length === 0) {
      const defaultConfigs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
      if (!defaultConfigs['Large Show']) {
        defaultConfigs['Large Show'] = { note: 'Placeholder - configure your large show setup' };
      }
      if (!defaultConfigs['Small Show']) {
        defaultConfigs['Small Show'] = { note: 'Placeholder - configure your small show setup' };
      }
      localStorage.setItem('savedConfigs', JSON.stringify(defaultConfigs));
    }
  }, [getSavedConfigurations]);

  const getConnectionColor = useCallback((nodeId: string): string | undefined => {
    const conn = state.connections.find(c => c.sourceId === nodeId || c.targetId === nodeId);
    return conn?.color;
  }, [state.connections]);

  const isNodeHighlighted = useCallback((nodeId: string): boolean => {
    if (!hoveredConnectionId) return false;
    const hoveredConn = state.connections.find(c => c.id === hoveredConnectionId);
    if (!hoveredConn) return false;
    return hoveredConn.sourceId === nodeId || hoveredConn.targetId === nodeId;
  }, [hoveredConnectionId, state.connections]);

  const getAmpPath = useCallback((ampId: string): string | undefined => {
    const path = getAmpPowerPath(ampId, state.connections, state.generators);
    return path?.fullPath;
  }, [state.connections, state.generators]);

  const getSpeakerPath = useCallback((speakerId: string): string | undefined => {
    const path = getSpeakerPowerPath(speakerId, state.connections, state.generators, state.amplifiers);
    return path?.fullPath;
  }, [state.connections, state.generators, state.amplifiers]);

  const handleNodeClick = useCallback((nodeId: string, nodeType: 'distro' | 'ampChannel' | 'amp' | 'poweredSpeaker' | 'speaker') => {
    if (nodeType === 'distro' || nodeType === 'ampChannel') {
      // For amp channels, only allow one connection (remove existing)
      // For distros, allow multiple connections (don't remove existing)
      if (nodeType === 'ampChannel') {
        const existingConn = state.connections.find(c => c.sourceId === nodeId);
        if (existingConn) {
          removeConnection(existingConn.id);
          toast({ title: 'Connection removed' });
          return;
        }
      }
      
      if (pendingConnection?.sourceId === nodeId) {
        setPendingConnection(null);
        return;
      }
      
      setPendingConnection({ sourceId: nodeId, sourceType: nodeType });
      toast({ title: 'Click a target to connect' });
    } else {
      if (!pendingConnection) {
        const existingConn = state.connections.find(c => c.targetId === nodeId);
        if (existingConn) {
          removeConnection(existingConn.id);
          toast({ title: 'Connection removed' });
        }
        return;
      }
      
      // Prevent powered speakers from connecting to amplifier channels
      if (nodeType === 'poweredSpeaker' && pendingConnection.sourceType === 'ampChannel') {
        toast({ title: 'Invalid connection', description: 'Powered speakers cannot connect to amplifiers', variant: 'destructive' });
        setPendingConnection(null);
        return;
      }
      
      // Easter egg: Speaker connected to generator = explosion!
      if (nodeType === 'speaker' && pendingConnection.sourceType === 'distro') {
        toast({ title: 'Direct power to speaker!', description: 'This kills the speaker...', variant: 'destructive' });
        setExplodingSpeakerId(nodeId);
        setPendingConnection(null);
        // Delete speaker after explosion animation
        setTimeout(() => {
          removeSpeaker(nodeId);
          setExplodingSpeakerId(null);
        }, 2000);
        return;
      }
      
      // Remove ALL existing connections to this target
      // For amps connecting to distros: remove all distro-to-amp connections for this amp
      // For others: remove the single existing connection
      if (pendingConnection.sourceType === 'distro' && nodeType === 'amp') {
        // Remove all distro-to-amp connections for this amp
        state.connections
          .filter(c => c.targetId === nodeId && c.sourceType === 'distro' && c.targetType === 'amp')
          .forEach(conn => removeConnection(conn.id));
      } else {
        // For other connection types, just remove the first existing one
        const existingTargetConn = state.connections.find(c => c.targetId === nodeId);
        if (existingTargetConn) {
          removeConnection(existingTargetConn.id);
        }
      }
      
      const usedColors = state.connections.map(c => c.color);
      const availableColor = CONNECTION_COLORS.find(c => !usedColors.includes(c)) || CONNECTION_COLORS[0];
      
      const newConnection: Omit<Connection, 'id'> = {
        sourceId: pendingConnection.sourceId,
        sourceType: pendingConnection.sourceType,
        targetId: nodeId,
        targetType: nodeType as 'amp' | 'poweredSpeaker' | 'speaker',
        color: availableColor,
      };
      
      addConnection(newConnection);
      setPendingConnection(null);
      toast({ title: 'Connected!' });
    }
  }, [pendingConnection, state.connections, addConnection, removeConnection, removeSpeaker, toast]);

  const handleDistroNodeClick = useCallback((distroId: string) => {
    handleNodeClick(distroId, 'distro');
  }, [handleNodeClick]);

  const handleAmpInputNodeClick = useCallback((ampId: string) => {
    handleNodeClick(ampId, 'amp');
  }, [handleNodeClick]);

  const handleAmpOutputNodeClick = useCallback((channelId: string) => {
    handleNodeClick(channelId, 'ampChannel');
  }, [handleNodeClick]);

  const handleSpeakerNodeClick = useCallback((speakerId: string) => {
    handleNodeClick(speakerId, 'speaker');
  }, [handleNodeClick]);

  const handlePoweredSpeakerNodeClick = useCallback((speakerId: string) => {
    handleNodeClick(speakerId, 'poweredSpeaker');
  }, [handleNodeClick]);

  const handleUpdateDistro = useCallback((generatorId: string, channelId: string, updates: Partial<DistroChannel>) => {
    const generator = state.generators.find(g => g.id === generatorId);
    if (!generator) return;
    
    const updatedChannels = generator.distroChannels.map(ch =>
      ch.id === channelId ? { ...ch, ...updates } : ch
    );
    updateGenerator(generatorId, { distroChannels: updatedChannels });
  }, [state.generators, updateGenerator]);

  const handleRemoveDistro = useCallback((generatorId: string, channelId: string) => {
    const generator = state.generators.find(g => g.id === generatorId);
    if (!generator) return;
    
    const updatedChannels = generator.distroChannels.filter(ch => ch.id !== channelId);
    updateGenerator(generatorId, { distroChannels: updatedChannels });
    
    const conn = state.connections.find(c => c.sourceId === channelId);
    if (conn) {
      removeConnection(conn.id);
    }
  }, [state.generators, updateGenerator, state.connections, removeConnection]);

  const handleUpdateAmpChannel = useCallback((ampId: string, channelId: string, updates: Partial<AmpChannel>) => {
    const amplifier = state.amplifiers.find(a => a.id === ampId);
    if (!amplifier) return;
    
    const updatedChannels = amplifier.channels.map(ch =>
      ch.id === channelId ? { ...ch, ...updates } : ch
    );
    updateAmplifier(ampId, { channels: updatedChannels });
  }, [state.amplifiers, updateAmplifier]);

  const handleFindProblems = useCallback(() => {
    const problems: string[] = [];
    
    state.generators.forEach(gen => {
      if (gen.utilizationPercent > 100) {
        problems.push(`${gen.name} is over capacity at ${gen.utilizationPercent.toFixed(0)}%`);
      }
    });
    
    state.amplifiers.forEach(amp => {
      if (amp.utilizationPercent > 100) {
        problems.push(`${amp.name} is over capacity at ${amp.utilizationPercent.toFixed(0)}%`);
      }
      amp.channels.forEach((ch, i) => {
        if (ch.loadOhms < 2) {
          problems.push(`${amp.name} Ch ${i + 1} has dangerously low impedance: ${ch.loadOhms.toFixed(1)}Ω`);
        }
      });
    });
    
    if (problems.length === 0) {
      toast({ title: 'No problems found', description: 'System looks good!' });
    } else {
      toast({ 
        title: `Found ${problems.length} problem(s)`, 
        description: problems.slice(0, 3).join('\n'),
        variant: 'destructive',
      });
    }
  }, [state.generators, state.amplifiers, toast]);

  const handleSaveConfig = useCallback((name: string) => {
    saveConfiguration(name);
    toast({ title: 'Configuration saved', description: name });
  }, [saveConfiguration, toast]);

  const handleLoadConfig = useCallback((name: string) => {
    loadConfiguration(name);
    toast({ title: 'Configuration loaded', description: name });
  }, [loadConfiguration, toast]);

  const handleDeleteConfig = useCallback((name: string) => {
    const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
    delete configs[name];
    localStorage.setItem('savedConfigs', JSON.stringify(configs));
    toast({ title: 'Configuration deleted', description: name });
  }, [toast]);

  const handleExportJSON = useCallback(() => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audio-system-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Configuration exported', description: 'JSON file downloaded' });
  }, [state, toast]);

  const handleImportJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.globalSettings && (imported.generators || imported.amplifiers || imported.speakers)) {
          const merged = {
            globalSettings: { ...state.globalSettings, ...imported.globalSettings },
            generators: imported.generators || [],
            amplifiers: imported.amplifiers || [],
            speakers: imported.speakers || [],
            poweredSpeakers: imported.poweredSpeakers || [],
            connections: imported.connections || [],
          };
          Object.entries(merged).forEach(([key, value]) => {
            if (key === 'globalSettings') updateGlobalSettings(value as any);
          });
          // Re-save full state
          const configs = JSON.parse(localStorage.getItem('savedConfigs') || '{}');
          configs['Imported Config'] = merged;
          localStorage.setItem('savedConfigs', JSON.stringify(configs));
          loadConfiguration('Imported Config');
          toast({ title: 'Configuration imported', description: 'JSON file loaded successfully' });
        } else {
          toast({ title: 'Invalid file', description: 'JSON structure not recognized', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: 'Import failed', description: 'Error parsing JSON file', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  }, [state, updateGlobalSettings, loadConfiguration, toast]);

  const handleWizardGeneratorPreview = useCallback((generator: Partial<import('@/lib/types').Generator> | null) => {
    if (!generator) {
      // Clear preview if no generator selected
      if (wizardGenId) {
        removeGenerator(wizardGenId);
        setWizardGenId(null);
      }
      return;
    }

    // Regenerate distro channel IDs to be unique while keeping preset properties
    const distroChannels = (generator.distroChannels || []).map((dc, i) => ({
      ...dc,
      id: `distro_${Date.now()}_${i}`,
    }));

    if (!wizardGenId) {
      // Add a new generator for preview
      addGenerator();
      setTimeout(() => {
        const gens = state.generators;
        if (gens.length > 0) {
          const newGen = gens[gens.length - 1];
          if (newGen) {
            setWizardGenId(newGen.id);
            updateGenerator(newGen.id, {
              name: generator.name || 'Generator',
              model: generator.model || generator.name || 'Generator',
              type: generator.type || 'standard',
              continuousWatts: generator.continuousWatts || 5000,
              peakWatts: generator.peakWatts || 6000,
              voltage: generator.voltage || 120,
              phaseCount: generator.phaseCount || 1,
              phaseType: generator.phaseType || 'single',
              ratingType: generator.ratingType || 'watts',
              powerFactor: generator.powerFactor || 0.95,
              distroChannels,
            });
          }
        }
      }, 0);
    } else {
      // Update existing preview generator
      updateGenerator(wizardGenId, {
        name: generator.name || 'Generator',
        model: generator.model || generator.name || 'Generator',
        type: generator.type || 'standard',
        continuousWatts: generator.continuousWatts || 5000,
        peakWatts: generator.peakWatts || 6000,
        voltage: generator.voltage || 120,
        phaseCount: generator.phaseCount || 1,
        phaseType: generator.phaseType || 'single',
        ratingType: generator.ratingType || 'watts',
        powerFactor: generator.powerFactor || 0.95,
        distroChannels,
      });
    }
  }, [wizardGenId, addGenerator, updateGenerator, removeGenerator, state.generators]);

  const handleWizardLocationPreview = useCallback((temperature: number, altitude: number) => {
    updateGlobalSettings({
      ambientTemperature: temperature,
      altitude,
    });
  }, [updateGlobalSettings]);

  const handleWizardGenrePreview = useCallback((genre: import('@/lib/types').MusicGenre) => {
    updateGlobalSettings({
      musicGenre: genre,
    });
  }, [updateGlobalSettings]);

  const handleWizardModePreview = useCallback((mode: import('@/lib/types').AppMode) => {
    updateGlobalSettings({
      appMode: mode,
    });
  }, [updateGlobalSettings]);

  const handleWizardComplete = useCallback((config: {
    projectName: string;
    location: string;
    musicGenre: import('@/lib/types').MusicGenre;
    temperature: number;
    altitude: number;
    generator: Partial<import('@/lib/types').Generator> | null;
  }) => {
    // Clear wizard generator ID since we're done with preview
    setWizardGenId(null);

    toast({ 
      title: `Project "${config.projectName}" created`, 
      description: 'Your audio system configuration is ready' 
    });
  }, [toast]);

  const generatorsWithCalculations = (state.generators || []).map(gen => {
    const { effectiveWatts, derates } = calculateGeneratorEffectiveWatts(gen, state.globalSettings);
    const totalDistroWatts = (gen.distroChannels || []).reduce((sum, ch) => sum + (ch.enabled ? ch.loadWatts : 0), 0);
    const utilizationPercent = effectiveWatts > 0 ? (totalDistroWatts / effectiveWatts) * 100 : 0;
    return { ...gen, effectiveWatts, derates, utilizationPercent };
  });

  const speakersWithSPL = (state.speakers || []).map(spk => {
    const powerWatts = 100;
    const splOutput = calculateSPL(
      spk.sensitivity,
      powerWatts,
      spk.quantity,
      state.globalSettings.arraySummationFactor,
      state.globalSettings.splDistance
    );
    return { ...spk, splOutput };
  });

  const poweredSpeakersWithCalcs = (state.poweredSpeakers || []).map(spk => {
    const splOutput = calculateSPL(
      spk.sensitivity,
      spk.pmax * spk.efficiency,
      spk.quantity,
      state.globalSettings.arraySummationFactor,
      state.globalSettings.splDistance
    );
    return { ...spk, splOutput };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="w-full px-4 py-2 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Audio System Power Calculator</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setHelpModalOpen(true)} 
              data-testid="button-help"
              title="Learn how to connect equipment"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setProjectSettingsModalOpen(true)} data-testid="button-project-settings">
              <Settings className="w-4 h-4 mr-2" />
              Project Settings
            </Button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-4">
        <GlobalSettingsPanel
          settings={state.globalSettings}
          onUpdate={updateGlobalSettings}
          onSave={() => setSaveDialogOpen(true)}
          onLoad={() => setLoadDialogOpen(true)}
          onNewProject={(skipPrompt) => {
            if (skipPrompt) {
              clearState();
            }
            setSetupWizardOpen(true);
          }}
          onFindProblems={handleFindProblems}
          onStartSimulation={() => setProUpgradeModalOpen(true)}
          savedConfigs={getSavedConfigurations()}
          hasUnsavedWork={hasUnsavedWork}
        />

        <div 
          ref={containerRef}
          className="relative grid grid-cols-1 lg:grid-cols-3 gap-y-6 gap-x-12 lg:gap-x-16 px-4"
        >
          <ConnectionLines 
            connections={state.connections} 
            containerRef={containerRef} 
            hoveredConnectionId={hoveredConnectionId}
            onConnectionHover={setHoveredConnectionId}
            onConnectionClick={(connId) => {
              const conn = state.connections.find(c => c.id === connId);
              if (conn) {
                removeConnection(connId);
                toast({ title: 'Connection removed' });
              }
            }}
          />

          <div className="space-y-4 overflow-visible relative">
            <h2 className="text-lg font-medium text-muted-foreground">Power Sources</h2>
            <ScrollArea className="h-[calc(100vh-320px)] overflow-visible">
              <div className="space-y-4 pr-6 overflow-visible">
                {generatorsWithCalculations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="text-muted-foreground text-sm">
                      <p className="mb-2">To get started, add your first generator</p>
                      <div className="text-2xl">↓</div>
                    </div>
                  </div>
                )}
                {generatorsWithCalculations.map(gen => (
                  <GeneratorCard
                    key={gen.id}
                    generator={gen}
                    presets={GENERATOR_PRESETS}
                    onUpdate={(updates) => updateGenerator(gen.id, updates)}
                    onRemove={() => removeGenerator(gen.id)}
                    onAddDistro={() => addDistroChannel(gen.id)}
                    onUpdateDistro={(channelId, updates) => handleUpdateDistro(gen.id, channelId, updates)}
                    onRemoveDistro={(channelId) => handleRemoveDistro(gen.id, channelId)}
                    onNodeClick={handleDistroNodeClick}
                    getConnectionColor={getConnectionColor}
                    derates={gen.derates}
                    effectiveWatts={gen.effectiveWatts}
                    appMode={state.globalSettings.appMode}
                    globalSettings={state.globalSettings}
                  />
                ))}
                <AddEquipmentButton
                  label="Add Generator"
                  onClick={() => {
                    setEquipmentType("generator");
                    setEquipmentModalOpen(true);
                  }}
                  testId="button-add-generator"
                />
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4 overflow-visible relative px-4">
            <h2 className="text-lg font-medium text-muted-foreground">Amplification</h2>
            <ScrollArea className="h-[calc(100vh-320px)] overflow-visible">
              <div className="space-y-4 pr-6 pl-8 overflow-visible">
                {state.amplifiers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="text-muted-foreground text-sm">
                      <p className="mb-2">To get started, add your first amplifier</p>
                      <div className="text-2xl">↓</div>
                    </div>
                  </div>
                )}
                {state.amplifiers.map(amp => (
                  <AmplifierCard
                    key={amp.id}
                    amplifier={amp}
                    presets={AMPLIFIER_PRESETS}
                    onUpdate={(updates) => updateAmplifier(amp.id, updates)}
                    onRemove={() => removeAmplifier(amp.id)}
                    onUpdateChannel={(channelId, updates) => handleUpdateAmpChannel(amp.id, channelId, updates)}
                    onInputNodeClick={handleAmpInputNodeClick}
                    onOutputNodeClick={handleAmpOutputNodeClick}
                    inputConnectionColor={getConnectionColor(amp.id)}
                    getOutputConnectionColor={getConnectionColor}
                    appMode={state.globalSettings.appMode}
                    powerPath={getAmpPath(amp.id)}
                    isPendingConnection={pendingConnection?.sourceType === 'distro'}
                    isHighlighted={isNodeHighlighted(amp.id)}
                    connections={state.connections}
                    generators={state.generators}
                    settings={state.globalSettings}
                  />
                ))}
                <AddEquipmentButton
                  label="Add Amplifier"
                  onClick={() => {
                    setEquipmentType("amplifier");
                    setEquipmentModalOpen(true);
                  }}
                  variant="secondary"
                  testId="button-add-amplifier"
                />
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4 overflow-visible relative pl-4">
            <h2 className="text-lg font-medium text-muted-foreground">Speakers</h2>
            <ScrollArea className="h-[calc(100vh-320px)] overflow-visible">
              <div className="space-y-4 pr-4 pl-2 overflow-visible">
                {speakersWithSPL.length === 0 && poweredSpeakersWithCalcs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="text-muted-foreground text-sm">
                      <p className="mb-2">To get started, add your first speaker</p>
                      <div className="text-2xl">↓</div>
                    </div>
                  </div>
                )}
                {speakersWithSPL.map(spk => (
                  <SpeakerCard
                    key={spk.id}
                    speaker={spk}
                    presets={SPEAKER_PRESETS}
                    splDistance={state.globalSettings.splDistance}
                    onUpdate={(updates) => updateSpeaker(spk.id, updates)}
                    onRemove={() => removeSpeaker(spk.id)}
                    onNodeClick={handleSpeakerNodeClick}
                    connectionColor={getConnectionColor(spk.id)}
                    appMode={state.globalSettings.appMode}
                    powerPath={getSpeakerPath(spk.id)}
                    isPendingConnection={pendingConnection?.sourceType === 'ampChannel'}
                    isHighlighted={isNodeHighlighted(spk.id)}
                    isExploding={explodingSpeakerId === spk.id}
                    connections={state.connections}
                    units={state.globalSettings.units}
                    amplifiers={state.amplifiers}
                    generators={state.generators}
                  />
                ))}
                {poweredSpeakersWithCalcs.map(spk => (
                  <PoweredSpeakerCard
                    key={spk.id}
                    speaker={spk}
                    splDistance={state.globalSettings.splDistance}
                    onUpdate={(updates) => updatePoweredSpeaker(spk.id, updates)}
                    onRemove={() => removePoweredSpeaker(spk.id)}
                    onNodeClick={handlePoweredSpeakerNodeClick}
                    connectionColor={getConnectionColor(spk.id)}
                    appMode={state.globalSettings.appMode}
                    units={state.globalSettings.units}
                    generators={state.generators}
                    connections={state.connections}
                  />
                ))}
                <div className="space-y-2">
                  <AddEquipmentButton
                    label="Add Speaker"
                    onClick={() => {
                      setEquipmentType("speaker");
                      setEquipmentModalOpen(true);
                    }}
                    testId="button-add-speaker"
                  />
                  <AddEquipmentButton
                    label="Add Powered Speaker"
                    onClick={() => {
                      setEquipmentType("poweredSpeaker");
                      setEquipmentModalOpen(true);
                    }}
                    variant="secondary"
                    testId="button-add-powered-speaker"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      <SaveLoadDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        mode="save"
        savedConfigs={getSavedConfigurations()}
        onSave={handleSaveConfig}
        onLoad={handleLoadConfig}
        onDelete={handleDeleteConfig}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
      />

      <SaveLoadDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        mode="load"
        savedConfigs={getSavedConfigurations()}
        onSave={handleSaveConfig}
        onLoad={handleLoadConfig}
        onDelete={handleDeleteConfig}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
      />

      <ProjectSettingsModal
        open={projectSettingsModalOpen}
        onOpenChange={setProjectSettingsModalOpen}
        settings={state.globalSettings}
        onUpdate={updateGlobalSettings}
        theme={theme}
        onThemeChange={setTheme}
      />

      <ProUpgradeModal
        open={proUpgradeModalOpen}
        onOpenChange={setProUpgradeModalOpen}
      />

      <SetupWizardModal
        open={setupWizardOpen}
        onOpenChange={setSetupWizardOpen}
        onComplete={handleWizardComplete}
        onGeneratorPreview={handleWizardGeneratorPreview}
        onLocationPreview={handleWizardLocationPreview}
        onGenrePreview={handleWizardGenrePreview}
        onModePreview={handleWizardModePreview}
      />

      <HelpModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />

      <EquipmentPresetModal
        open={equipmentModalOpen}
        onOpenChange={setEquipmentModalOpen}
        equipmentType={equipmentType}
        presets={
          equipmentType === "generator"
            ? GENERATOR_PRESETS
            : equipmentType === "amplifier"
            ? AMPLIFIER_PRESETS
            : equipmentType === "poweredSpeaker"
            ? POWERED_SPEAKER_PRESETS
            : SPEAKER_PRESETS
        }
        onSelect={(presetKey) => {
          if (equipmentType === "generator") {
            addGenerator();
            if (presetKey) {
              const preset = GENERATOR_PRESETS[presetKey];
              setTimeout(() => {
                const gens = state.generators;
                if (gens.length > 0) {
                  const genId = gens[gens.length - 1].id;
                  // Regenerate distro IDs to avoid conflicts
                  const distroChannels = preset.distroChannels?.map(dc => ({
                    ...dc,
                    id: `distro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                  }));
                  updateGenerator(genId, {
                    ...preset,
                    distroChannels
                  });
                }
              }, 0);
            }
          } else if (equipmentType === "amplifier") {
            addAmplifier();
            if (presetKey) {
              const preset = AMPLIFIER_PRESETS[presetKey];
              setTimeout(() => {
                const amps = state.amplifiers;
                if (amps.length > 0) {
                  updateAmplifier(amps[amps.length - 1].id, preset);
                }
              }, 0);
            }
          } else if (equipmentType === "speaker") {
            addSpeaker();
            if (presetKey) {
              const preset = SPEAKER_PRESETS[presetKey];
              setTimeout(() => {
                const spks = state.speakers;
                if (spks.length > 0) {
                  updateSpeaker(spks[spks.length - 1].id, preset);
                }
              }, 0);
            }
          } else if (equipmentType === "poweredSpeaker") {
            addPoweredSpeaker();
            if (presetKey) {
              const preset = POWERED_SPEAKER_PRESETS[presetKey];
              setTimeout(() => {
                const pwSpks = state.poweredSpeakers;
                if (pwSpks.length > 0) {
                  updatePoweredSpeaker(pwSpks[pwSpks.length - 1].id, preset);
                }
              }, 0);
            }
          }
          setEquipmentType(null);
        }}
      />
    </div>
  );
}
