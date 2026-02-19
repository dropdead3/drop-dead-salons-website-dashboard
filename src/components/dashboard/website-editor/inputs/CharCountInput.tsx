import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CharCountInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  description?: string;
  className?: string;
  id?: string;
}

export function CharCountInput({
  label,
  value,
  onChange,
  maxLength = 60,
  placeholder,
  description,
  className,
  id,
}: CharCountInputProps) {
  const length = value.length;
  const isOver = length > maxLength;
  const isNear = length > maxLength * 0.85;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <span className={cn(
          "text-[10px] font-mono tabular-nums",
          isOver ? "text-destructive" : isNear ? "text-[hsl(var(--platform-warning))]" : "text-muted-foreground"
        )}>
          {length}/{maxLength}
        </span>
      </div>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(isOver && "border-destructive")}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
