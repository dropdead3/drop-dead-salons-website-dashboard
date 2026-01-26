import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNewClientConfig, type NewClientConfig, DEFAULT_NEW_CLIENT } from '@/hooks/useSectionConfig';
import { RotatingWordsInput } from './RotatingWordsInput';
import { BenefitsListInput } from './BenefitsListInput';
import { SectionPreviewWrapper } from './SectionPreviewWrapper';
import { NewClientPreview } from './previews/NewClientPreview';
import { useDebounce } from '@/hooks/use-debounce';

export function NewClientEditor() {
  const { data, isLoading, isSaving, update } = useNewClientConfig();
  const [localConfig, setLocalConfig] = useState<NewClientConfig>(DEFAULT_NEW_CLIENT);
  const debouncedConfig = useDebounce(localConfig, 300);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('New Client section saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof NewClientConfig>(field: K, value: NewClientConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
      {/* Editor Panel */}
      <Card className="overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4 sticky top-0 bg-card z-10 border-b">
          <CardTitle className="text-lg">New Client CTA</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline_prefix">Headline Prefix</Label>
            <Input
              id="headline_prefix"
              value={localConfig.headline_prefix}
              onChange={(e) => updateField('headline_prefix', e.target.value)}
              placeholder="New Clients"
            />
          </div>

          {/* Rotating Words */}
          <RotatingWordsInput
            words={localConfig.rotating_words}
            onChange={(words) => updateField('rotating_words', words)}
            label="Rotating Words"
            placeholder="e.g. Start Here, Wanted..."
          />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={localConfig.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Benefits */}
          <BenefitsListInput
            benefits={localConfig.benefits}
            onChange={(benefits) => updateField('benefits', benefits)}
            label="Benefits (shown as badges)"
            placeholder="Add a benefit..."
          />

          {/* CTA */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="cta_text">CTA Button Text</Label>
            <Input
              id="cta_text"
              value={localConfig.cta_text}
              onChange={(e) => updateField('cta_text', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="hidden xl:block">
        <SectionPreviewWrapper>
          <NewClientPreview config={debouncedConfig} />
        </SectionPreviewWrapper>
      </div>
    </div>
  );
}
