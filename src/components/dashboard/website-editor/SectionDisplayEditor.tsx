import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SliderInput } from './inputs/SliderInput';
import { ToggleInput } from './inputs/ToggleInput';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'slider' | 'toggle';
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

interface SectionDisplayEditorProps<T extends object> {
  title: string;
  description: string;
  data: T;
  isLoading: boolean;
  isSaving: boolean;
  update: (value: T) => Promise<void>;
  fields: FieldConfig[];
}

export function SectionDisplayEditor<T extends object>({
  title,
  description,
  data,
  isLoading,
  isSaving,
  update,
  fields,
}: SectionDisplayEditorProps<T>) {
  const [localConfig, setLocalConfig] = useState<T>(data);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success(`${title} saved`);
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = (key: string, value: unknown) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save & Publish Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-muted-foreground">{description}</p>

          {fields.map((field) => {
            const value = localConfig[field.key as keyof T];

            switch (field.type) {
              case 'text':
                return (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      value={(value as string) || ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                );
              case 'textarea':
                return (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Textarea
                      value={(value as string) || ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  </div>
                );
              case 'select':
                return (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Select value={value as string} onValueChange={(v) => updateField(field.key, v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              case 'slider':
                return (
                  <SliderInput
                    key={field.key}
                    label={field.label}
                    value={value as number}
                    onChange={(v) => updateField(field.key, v)}
                    min={field.min ?? 1}
                    max={field.max ?? 20}
                    step={field.step ?? 1}
                    unit={field.unit}
                    description={field.description}
                  />
                );
              case 'toggle':
                return (
                  <ToggleInput
                    key={field.key}
                    label={field.label}
                    value={value as boolean}
                    onChange={(v) => updateField(field.key, v)}
                    description={field.description}
                  />
                );
              default:
                return null;
            }
          })}
        </CardContent>
      </Card>
    </div>
  );
}
