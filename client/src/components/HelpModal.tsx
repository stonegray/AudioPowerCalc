import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpModal({ open, onOpenChange }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            How to Connect Equipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                1
              </div>
              <h3 className="font-semibold">Click the output node on your power source</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-sm text-muted-foreground">
                Find a generator's distro channel or look for the small connection point on the right side of the card. This is your power output.
              </p>
              <div className="bg-muted p-4 rounded-md border border-border">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono text-muted-foreground">Generator Card</div>
                  <div className="flex-1 h-12 bg-card border border-border rounded flex items-center px-3 justify-between">
                    <span className="text-xs">Distro Channel 1</span>
                    <div className="w-2 h-2 bg-primary rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                2
              </div>
              <h3 className="font-semibold">Click the input node on your destination equipment</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-sm text-muted-foreground">
                Find an amplifier's input point on the left side of its card. This is where power flows in from your generator.
              </p>
              <div className="bg-muted p-4 rounded-md border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full shadow-lg"></div>
                  <div className="flex-1 h-12 bg-card border border-border rounded flex items-center px-3 justify-between">
                    <span className="text-xs">Amplifier</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">Amp Card</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                3
              </div>
              <h3 className="font-semibold">Connection created!</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-sm text-muted-foreground">
                A colored line will appear connecting the two nodes. Power flows from the generator through this connection to your amplifier.
              </p>
              <div className="bg-muted p-4 rounded-md border border-border space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-12 bg-card border border-border rounded flex items-center px-3 justify-between">
                    <span className="text-xs">Distro Channel</span>
                    <div className="w-2 h-2 bg-primary rounded-full shadow-lg"></div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 h-12 bg-card border border-border rounded flex items-center px-3 justify-between">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-lg"></div>
                    <span className="text-xs">Amplifier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Quick Tips</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• You can connect multiple amplifiers to the same distro channel</li>
              <li>• Hover over a connection line to see its details</li>
              <li>• Click a connection line to remove it</li>
              <li>• Powered speakers connect directly (no amplifier needed)</li>
              <li>• The power calculations update automatically when you connect equipment</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
