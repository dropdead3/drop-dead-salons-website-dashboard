import { useState, useEffect, useCallback } from 'react';
import { tokens } from '@/lib/design-tokens';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { useEditorSaveAction } from '@/hooks/useEditorSaveAction';
import { toast } from 'sonner';
import { useFooterCTAConfig, type FooterCTAConfig, DEFAULT_FOOTER_CTA } from '@/hooks/useSectionConfig';
import { UrlInput } from './inputs/UrlInput';
import { ToggleInput } from './inputs/ToggleInput';
import { CharCountInput } from './inputs/CharCountInput';
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

  const handleReset = () => {
    setLocalConfig(DEFAULT_FOOTER_CTA);
    toast.info('Reset to defaults — save to apply');
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
          <Button variant="ghost" size={tokens.button.card} onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
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
            <CharCountInput
              label="Eyebrow Text"
              value={localConfig.eyebrow}
              onChange={(value) => updateField('eyebrow', value)}
              maxLength={50}
              placeholder="Ready for Something Different?"
              description="Small introductory text above the headline"
            />
          )}

          {/* Headlines */}
          <ToggleInput
            label="Show Headline"
            value={localConfig.show_headline}
            onChange={(value) => updateField('show_headline', value)}
            description="Display the main headline text"
          />
          {localConfig.show_headline && (
            <div className="grid grid-cols-2 gap-4">
              <CharCountInput
                label="Headline Line 1"
                value={localConfig.headline_line1}
                onChange={(value) => updateField('headline_line1', value)}
                maxLength={30}
                placeholder="Book Your"
              />
              <CharCountInput
                label="Headline Line 2"
                value={localConfig.headline_line2}
                onChange={(value) => updateField('headline_line2', value)}
                maxLength={30}
                placeholder="Consult"
              />
            </div>
          )}

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
              <p className="text-xs text-muted-foreground">Supporting text that appears below the headline</p>
            </div>
          )}

          {/* CTA Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Call to Action</h4>
            <ToggleInput
              label="Show CTA Button"
              value={localConfig.show_cta_button}
              onChange={(value) => updateField('show_cta_button', value)}
              description="Display the call-to-action button"
            />
            {localConfig.show_cta_button && (
              <>
                <CharCountInput
                  label="Button Text"
                  value={localConfig.cta_text}
                  onChange={(value) => updateField('cta_text', value)}
                  maxLength={30}
                  placeholder="Book consult"
                  description="Text displayed on the CTA button"
                />
                <UrlInput
                  label="Button URL"
                  value={localConfig.cta_url}
                  onChange={(value) => updateField('cta_url', value)}
                  placeholder="/booking"
                  description="Where the button links to"
                />
              </>
            )}
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
