import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, FolderOpen, Download, Upload } from 'lucide-react';

interface SaveLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'save' | 'load';
  savedConfigs: string[];
  onSave: (name: string) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export default function SaveLoadDialog({
  open,
  onOpenChange,
  mode,
  savedConfigs,
  onSave,
  onLoad,
  onDelete,
  onExport,
  onImport,
}: SaveLoadDialogProps) {
  const [saveName, setSaveName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim());
      setSaveName('');
      onOpenChange(false);
    }
  };

  const handleLoad = (name: string) => {
    onLoad(name);
    onOpenChange(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      onImport(file);
      onOpenChange(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-import-file"
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'save' ? 'Save Configuration' : 'Load Configuration'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'save' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Configuration Name</Label>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="My Show Setup"
                data-testid="input-save-name"
              />
            </div>

            {savedConfigs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Existing Configurations</Label>
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="space-y-1">
                    {savedConfigs.map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSaveName(name)}
                      >
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onExport} className="flex-1" data-testid="button-export-json">
                  <Download className="w-3 h-3 mr-1" />
                  Export JSON
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!saveName.trim()} data-testid="button-confirm-save">
                Save
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {savedConfigs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No saved configurations</p>
              </div>
            ) : (
              <ScrollArea className="h-64 rounded-md border">
                <div className="p-2 space-y-1">
                  {savedConfigs.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 rounded hover:bg-muted/50 group"
                    >
                      <button
                        className="flex-1 text-left text-sm font-medium"
                        onClick={() => handleLoad(name)}
                        data-testid={`button-load-${name}`}
                      >
                        {name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(name);
                        }}
                        className="opacity-0 group-hover:opacity-100"
                        data-testid={`button-delete-${name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="space-y-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleImportClick} className="flex-1" data-testid="button-import-json">
                  <Upload className="w-3 h-3 mr-1" />
                  Import JSON
                </Button>
                <Button variant="outline" size="sm" onClick={onExport} className="flex-1" data-testid="button-export-json">
                  <Download className="w-3 h-3 mr-1" />
                  Export JSON
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
