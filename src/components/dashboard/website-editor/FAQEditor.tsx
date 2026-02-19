import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Settings2, RotateCcw } from 'lucide-react';
import { useEditorSaveAction } from '@/hooks/useEditorSaveAction';
import { toast } from 'sonner';
import { useFAQConfig, type FAQConfig, DEFAULT_FAQ } from '@/hooks/useSectionConfig';
import { RotatingWordsInput } from './RotatingWordsInput';
import { UrlInput } from './inputs/UrlInput';
import { ToggleInput } from './inputs/ToggleInput';
import { CharCountInput } from './inputs/CharCountInput';
import { useDebounce } from '@/hooks/use-debounce';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { triggerPreviewRefresh } from './LivePreviewPanel';

export function FAQEditor() {
  const { data, isLoading, isSaving, update } = useFAQConfig();
  const [localConfig, setLocalConfig] = useState<FAQConfig>(DEFAULT_FAQ);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedConfig = useDebounce(localConfig, 300);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = useCallback(async () => {
    try {
      await update(localConfig);
      toast.success('FAQ section saved');
      triggerPreviewRefresh();
    } catch {
      toast.error('Failed to save');
    }
  }, [localConfig, update]);

  useEditorSaveAction(handleSave);

  const updateField = <K extends keyof FAQConfig>(field: K, value: FAQConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...localConfig.intro_paragraphs];
    newParagraphs[index] = value;
    updateField('intro_paragraphs', newParagraphs);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_FAQ);
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
          <CardTitle className="text-lg">FAQ Section</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
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
            <p className="text-xs text-muted-foreground">Displayed above the FAQ list to set context for visitors.</p>
            {localConfig.intro_paragraphs.map((paragraph, index) => (
              <div key={index} className="space-y-2">
                <Label>Paragraph {index + 1}</Label>
                <Textarea
                  value={paragraph}
                  onChange={(e) => updateParagraph(index, e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Call to Action Buttons</h4>
            <div className="grid grid-cols-2 gap-4">
              <CharCountInput
                label="Primary Button Text"
                value={localConfig.cta_primary_text}
                onChange={(value) => updateField('cta_primary_text', value)}
                maxLength={30}
                description="Main CTA below the FAQ list"
              />
              <CharCountInput
                label="Secondary Button Text"
                value={localConfig.cta_secondary_text}
                onChange={(value) => updateField('cta_secondary_text', value)}
                maxLength={30}
              />
            </div>
            <UrlInput
              label="Primary Button URL"
              value={localConfig.cta_primary_url}
              onChange={(value) => updateField('cta_primary_url', value)}
              placeholder="/faq"
              description="Where the primary button links to"
            />
            <UrlInput
              label="Secondary Button URL"
              value={localConfig.cta_secondary_url}
              onChange={(value) => updateField('cta_secondary_url', value)}
              placeholder="/policies"
              description="Where the secondary button links to"
            />
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between mt-4">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Advanced Settings
                </span>
                <span className="text-xs text-muted-foreground">
                  {showAdvanced ? 'Hide' : 'Show'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <h4 className="font-medium text-sm">Search & Display</h4>
                <ToggleInput
                  label="Show Search Bar"
                  value={localConfig.show_search_bar}
                  onChange={(value) => updateField('show_search_bar', value)}
                  description="Allow visitors to search through FAQs"
                />
                {localConfig.show_search_bar && (
                  <div className="space-y-2">
                    <Label>Search Placeholder</Label>
                    <Input
                      value={localConfig.search_placeholder}
                      onChange={(e) => updateField('search_placeholder', e.target.value)}
                      placeholder="Search questions..."
                    />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

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
