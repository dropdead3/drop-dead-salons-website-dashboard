import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ToggleInputProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  className?: string;
}

export function ToggleInput({
  label,
  value,
  onChange,
  description,
  className,
}: ToggleInputProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2", className)}>
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  );
}
