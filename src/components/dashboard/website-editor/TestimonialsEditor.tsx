import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTestimonialsConfig, type TestimonialsConfig, DEFAULT_TESTIMONIALS } from '@/hooks/useSectionConfig';
import { useDebounce } from '@/hooks/use-debounce';
import { SectionPreviewWrapper } from './SectionPreviewWrapper';
import { TestimonialsPreview } from './previews/TestimonialsPreview';

export function TestimonialsEditor() {
  const { data, isLoading, isSaving, update } = useTestimonialsConfig();
  const [localConfig, setLocalConfig] = useState<TestimonialsConfig>(DEFAULT_TESTIMONIALS);
  const debouncedConfig = useDebounce(localConfig, 300);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('Testimonials section saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof TestimonialsConfig>(field: K, value: TestimonialsConfig[K]) => {
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
    <div className="grid xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle className="text-lg">Testimonials Section</CardTitle>
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
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={localConfig.headline}
              onChange={(e) => updateField('headline', e.target.value)}
            />
          </div>

          {/* Google Review URL */}
          <div className="space-y-2">
            <Label htmlFor="review_url">Google Review URL</Label>
            <Input
              id="review_url"
              value={localConfig.google_review_url}
              onChange={(e) => updateField('google_review_url', e.target.value)}
              placeholder="https://g.page/r/..."
            />
          </div>

          {/* Link Text */}
          <div className="space-y-2">
            <Label htmlFor="link_text">Review Link Text</Label>
            <Input
              id="link_text"
              value={localConfig.link_text}
              onChange={(e) => updateField('link_text', e.target.value)}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Individual testimonials are managed in the Testimonials Manager.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <div className="hidden xl:block">
        <SectionPreviewWrapper>
          <TestimonialsPreview config={debouncedConfig} />
        </SectionPreviewWrapper>
      </div>
    </div>
  );
}
