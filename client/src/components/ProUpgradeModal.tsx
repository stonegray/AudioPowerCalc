import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Activity, TrendingUp, Cpu, Check } from 'lucide-react';

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const proFeatures = [
  {
    icon: Activity,
    title: 'Realtime Simulation',
    description: 'with audio input from your browser',
  },
  {
    icon: Zap,
    title: 'Fault and Failure Analysis',
    description: 'Identify potential issues before they happen',
  },
  {
    icon: TrendingUp,
    title: 'Crest Curve Analysis',
    description: 'G frequency-based crest factor curves',
  },
  {
    icon: Cpu,
    title: 'DSP Integration',
    description: 'Connect with your digital signal processors',
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
              className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium text-sm">{feature.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
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
