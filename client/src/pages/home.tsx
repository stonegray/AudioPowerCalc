import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import GlobalSettingsPanel from '@/components/GlobalSettingsPanel';
import GeneratorCard from '@/components/GeneratorCard';
import AmplifierCard from '@/components/AmplifierCard';
import SpeakerCard from '@/components/SpeakerCard';
import PoweredSpeakerCard from '@/components/PoweredSpeakerCard';
import AddEquipmentButton from '@/components/AddEquipmentButton';
import ConnectionLines from '@/components/ConnectionLines';
import SaveLoadDialog from '@/components/SaveLoadDialog';
import AudioContentModal from '@/components/AudioContentModal';
import ThemeToggle from '@/components/ThemeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useSystemStore } from '@/lib/store';
import { 
  GENERATOR_PRESETS, 
  AMPLIFIER_PRESETS, 
  SPEAKER_PRESETS,
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
  const [audioContentModalOpen, setAudioContentModalOpen] = useState(false);

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
  } = useSystemStore();

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
      const existingConn = state.connections.find(c => c.sourceId === nodeId);
      if (existingConn) {
        removeConnection(existingConn.id);
        toast({ title: 'Connection removed' });
        return;
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
      
      const existingTargetConn = state.connections.find(c => c.targetId === nodeId);
      if (existingTargetConn) {
        removeConnection(existingTargetConn.id);
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
  }, [pendingConnection, state.connections, addConnection, removeConnection, toast]);

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

  const generatorsWithCalculations = (state.generators || []).map(gen => {
    const { effectiveWatts, derates } = calculateGeneratorEffectiveWatts(gen, state.globalSettings);
    return { ...gen, effectiveWatts, derates };
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
            <Button variant="outline" size="sm" onClick={() => setAudioContentModalOpen(true)} data-testid="button-audio-content">
              Audio Content
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-4">
        <GlobalSettingsPanel
          settings={state.globalSettings}
          onUpdate={updateGlobalSettings}
          onSave={() => setSaveDialogOpen(true)}
          onLoad={() => setLoadDialogOpen(true)}
          onFindProblems={handleFindProblems}
          onStartSimulation={() => toast({ title: 'Simulation Started', description: 'Running power flow analysis...' })}
          savedConfigs={getSavedConfigurations()}
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
                  onClick={addGenerator}
                  testId="button-add-generator"
                />
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4 overflow-visible relative px-4">
            <h2 className="text-lg font-medium text-muted-foreground">Amplification</h2>
            <ScrollArea className="h-[calc(100vh-320px)] overflow-visible">
              <div className="space-y-4 pr-6 pl-8 overflow-visible">
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
                  />
                ))}
                <div className="space-y-2">
                  <AddEquipmentButton
                    label="Add Amplifier"
                    onClick={addAmplifier}
                    variant="secondary"
                    testId="button-add-amplifier"
                  />
                  <AddEquipmentButton
                    label="Add Powered Speaker"
                    onClick={addPoweredSpeaker}
                    variant="secondary"
                    testId="button-add-powered-speaker"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4 overflow-visible relative pl-4">
            <h2 className="text-lg font-medium text-muted-foreground">Speakers</h2>
            <ScrollArea className="h-[calc(100vh-320px)] overflow-visible">
              <div className="space-y-4 pr-4 pl-2 overflow-visible">
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
                  />
                ))}
                <AddEquipmentButton
                  label="Add Speaker"
                  onClick={addSpeaker}
                  testId="button-add-speaker"
                />
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
      />

      <SaveLoadDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        mode="load"
        savedConfigs={getSavedConfigurations()}
        onSave={handleSaveConfig}
        onLoad={handleLoadConfig}
        onDelete={handleDeleteConfig}
      />

      <AudioContentModal
        open={audioContentModalOpen}
        onOpenChange={setAudioContentModalOpen}
        genre={state.globalSettings.musicGenre}
        onGenreChange={(genre) => updateGlobalSettings({ musicGenre: genre })}
        crestCurve={state.globalSettings.crestCurve || []}
        onCrestCurveChange={(curve) => updateGlobalSettings({ crestCurve: curve })}
      />
    </div>
  );
}
