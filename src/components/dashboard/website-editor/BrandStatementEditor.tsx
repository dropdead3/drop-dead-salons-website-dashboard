import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useBrandStatementConfig, type BrandStatementConfig, DEFAULT_BRAND_STATEMENT } from '@/hooks/useSectionConfig';
import { RotatingWordsInput } from './RotatingWordsInput';
import { SectionPreviewWrapper } from './SectionPreviewWrapper';
import { BrandStatementPreview } from './previews/BrandStatementPreview';
import { useDebounce } from '@/hooks/use-debounce';

export function BrandStatementEditor() {
  const { data, isLoading, isSaving, update } = useBrandStatementConfig();
  const [localConfig, setLocalConfig] = useState<BrandStatementConfig>(DEFAULT_BRAND_STATEMENT);
  const debouncedConfig = useDebounce(localConfig, 300);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('Brand Statement saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof BrandStatementConfig>(field: K, value: BrandStatementConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...localConfig.paragraphs];
    newParagraphs[index] = value;
    updateField('paragraphs', newParagraphs);
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
          <CardTitle className="text-lg">Brand Statement</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Eyebrow */}
          <div className="space-y-2">
            <Label htmlFor="eyebrow">Eyebrow Text</Label>
            <Input
              id="eyebrow"
              value={localConfig.eyebrow}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Headline Prefix</Label>
              <Input
                id="prefix"
                value={localConfig.headline_prefix}
                onChange={(e) => updateField('headline_prefix', e.target.value)}
                placeholder="Not Your"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Headline Suffix</Label>
              <Input
                id="suffix"
                value={localConfig.headline_suffix}
                onChange={(e) => updateField('headline_suffix', e.target.value)}
                placeholder="Salon"
              />
            </div>
          </div>

          {/* Rotating Words */}
          <RotatingWordsInput
            words={localConfig.rotating_words}
            onChange={(words) => updateField('rotating_words', words)}
            label="Rotating Words (Between Prefix & Suffix)"
            placeholder="e.g. Boring, Average..."
          />

          {/* Paragraphs */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Description Paragraphs</h4>
            {localConfig.paragraphs.map((paragraph, index) => (
              <div key={index} className="space-y-2">
                <Label>Paragraph {index + 1}</Label>
                <Textarea
                  value={paragraph}
                  onChange={(e) => updateParagraph(index, e.target.value)}
                  rows={4}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="hidden xl:block">
        <SectionPreviewWrapper>
          <BrandStatementPreview config={debouncedConfig} />
        </SectionPreviewWrapper>
      </div>
    </div>
  );
}
