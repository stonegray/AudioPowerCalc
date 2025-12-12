import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Activity, TrendingUp, Cpu, Check } from 'lucide-react';

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const proFeatures = [
  {
    icon: Activity,
    title: 'Realtime Simulation',
    description: 'Connect live audio or upload audio files to see live power consumption and graphs',
  },
  {
    icon: Zap,
    title: 'Fault and Failure Analysis',
    description: 'Identify potential issues before they happen, such as determining if acoustic transients from hot plugging cables or 60hz noise will trip your breakers',
  },
  {
    icon: TrendingUp,
    title: 'Crest Curve Analysis',
    description: 'Generate and analyze frequency-based crest factor curves that accurately represent the frequency content of your uploaded music',
  },
  {
    icon: Cpu,
    title: 'Hardware Integration',
    description: 'Connect with your digital signal processors, and external energy monitoring hardware',
    beta: true,
  },
];

export default function ProUpgradeModal({ open, onOpenChange }: ProUpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Want to simulate your energy in real time?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Upgrade to Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {proFeatures.map((feature) => (
            <div
              key={feature.title}
              className={`flex items-start gap-3 p-3 rounded-md ${
                'beta' in feature && feature.beta ? 'bg-muted/30' : 'bg-muted/50'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  'beta' in feature && feature.beta
                    ? 'bg-muted/50'
                    : 'bg-primary/10'
                }`}
              >
                <feature.icon
                  className={`w-4 h-4 ${
                    'beta' in feature && feature.beta
                      ? 'text-muted-foreground'
                      : 'text-primary'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {('beta' in feature && feature.beta) ? (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  ) : (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm">{feature.title}</span>
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    'beta' in feature && feature.beta
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full" data-testid="button-upgrade-pro">
            Upgrade to Pro
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-maybe-later"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
