import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useFAQConfig, type FAQConfig, DEFAULT_FAQ } from '@/hooks/useSectionConfig';
import { RotatingWordsInput } from './RotatingWordsInput';
import { useDebounce } from '@/hooks/use-debounce';

export function FAQEditor() {
  const { data, isLoading, isSaving, update } = useFAQConfig();
  const [localConfig, setLocalConfig] = useState<FAQConfig>(DEFAULT_FAQ);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('FAQ section saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof FAQConfig>(field: K, value: FAQConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...localConfig.intro_paragraphs];
    newParagraphs[index] = value;
    updateField('intro_paragraphs', newParagraphs);
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
          <CardTitle className="text-lg">FAQ Section</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Rotating Words */}
          <RotatingWordsInput
            words={localConfig.rotating_words}
            onChange={(words) => updateField('rotating_words', words)}
            label="Headline Rotating Words"
            placeholder="e.g. Asked, Answered..."
          />

          {/* Intro Paragraphs */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Introduction Paragraphs</h4>
            {localConfig.intro_paragraphs.map((paragraph, index) => (
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

          {/* CTA Buttons */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Call to Action Buttons</h4>
            <div className="space-y-2">
              <Label htmlFor="cta_primary">Primary Button Text</Label>
              <Input
                id="cta_primary"
                value={localConfig.cta_primary_text}
                onChange={(e) => updateField('cta_primary_text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_secondary">Secondary Button Text</Label>
              <Input
                id="cta_secondary"
                value={localConfig.cta_secondary_text}
                onChange={(e) => updateField('cta_secondary_text', e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> FAQ questions and answers are managed separately in the FAQ Manager.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
