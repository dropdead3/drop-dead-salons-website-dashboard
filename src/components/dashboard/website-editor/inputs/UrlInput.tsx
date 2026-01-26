import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  className?: string;
}

export function UrlInput({
  label,
  value,
  onChange,
  placeholder = 'https://',
  description,
  className,
}: UrlInputProps) {
  const isValidUrl = value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'));

  const handleTestLink = () => {
    if (isValidUrl) {
      window.open(value, '_blank');
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleTestLink}
          disabled={!isValidUrl}
          title="Test link"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
