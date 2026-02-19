import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useEditorSaveAction } from '@/hooks/useEditorSaveAction';
import { toast } from 'sonner';
import { useFooterCTAConfig, type FooterCTAConfig, DEFAULT_FOOTER_CTA } from '@/hooks/useSectionConfig';
import { UrlInput } from './inputs/UrlInput';
import { ToggleInput } from './inputs/ToggleInput';
import { useDebounce } from '@/hooks/use-debounce';
import { triggerPreviewRefresh } from './LivePreviewPanel';

export function FooterCTAEditor() {
  const { data, isLoading, isSaving, update } = useFooterCTAConfig();
  const [localConfig, setLocalConfig] = useState<FooterCTAConfig>(DEFAULT_FOOTER_CTA);
  const debouncedConfig = useDebounce(localConfig, 300);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = useCallback(async () => {
    try {
      await update(localConfig);
      toast.success('Footer CTA section saved');
      triggerPreviewRefresh();
    } catch {
      toast.error('Failed to save');
    }
  }, [localConfig, update]);

  useEditorSaveAction(handleSave);

  const updateField = <K extends keyof FooterCTAConfig>(field: K, value: FooterCTAConfig[K]) => {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle className="text-lg">Footer CTA Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-muted-foreground">
            Configure the call-to-action section that appears before the footer.
          </p>

          {/* Eyebrow */}
          <ToggleInput
            label="Show Eyebrow Text"
            value={localConfig.show_eyebrow}
            onChange={(value) => updateField('show_eyebrow', value)}
            description="Display the small text above the headline"
          />
          {localConfig.show_eyebrow && (
            <div className="space-y-2">
              <Label htmlFor="eyebrow">Eyebrow Text</Label>
              <Input
                id="eyebrow"
                value={localConfig.eyebrow}
                onChange={(e) => updateField('eyebrow', e.target.value)}
                placeholder="Ready for Something Different?"
              />
            </div>
          )}

          {/* Headlines */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headline1">Headline Line 1</Label>
              <Input
                id="headline1"
                value={localConfig.headline_line1}
                onChange={(e) => updateField('headline_line1', e.target.value)}
                placeholder="Book Your"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline2">Headline Line 2</Label>
              <Input
                id="headline2"
                value={localConfig.headline_line2}
                onChange={(e) => updateField('headline_line2', e.target.value)}
                placeholder="Consult"
              />
            </div>
          </div>

          {/* Description */}
          <ToggleInput
            label="Show Description"
            value={localConfig.show_description}
            onChange={(value) => updateField('show_description', value)}
            description="Display the paragraph below the headline"
          />
          {localConfig.show_description && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={localConfig.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* CTA Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Call to Action</h4>
            <div className="space-y-2">
              <Label htmlFor="cta_text">Button Text</Label>
              <Input
                id="cta_text"
                value={localConfig.cta_text}
                onChange={(e) => updateField('cta_text', e.target.value)}
                placeholder="Book consult"
              />
            </div>
            <UrlInput
              label="Button URL"
              value={localConfig.cta_url}
              onChange={(value) => updateField('cta_url', value)}
              placeholder="/booking"
              description="Where the button links to"
            />
          </div>

          {/* Display Options */}
          <div className="pt-4 border-t">
            <ToggleInput
              label="Show Phone Numbers"
              value={localConfig.show_phone_numbers}
              onChange={(value) => updateField('show_phone_numbers', value)}
              description="Display location phone numbers below the CTA button"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
