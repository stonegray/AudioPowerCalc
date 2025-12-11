import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddEquipmentButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary';
  className?: string;
  testId?: string;
}

export default function AddEquipmentButton({
  label,
  onClick,
  variant = 'default',
  className,
  testId,
}: AddEquipmentButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        'w-full h-20 border-dashed border-2 flex-col gap-1',
        variant === 'secondary' && 'h-12',
        className
      )}
      data-testid={testId}
    >
      <Plus className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}
