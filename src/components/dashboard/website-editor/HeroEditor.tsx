import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHeroConfig, type HeroConfig, DEFAULT_HERO } from '@/hooks/useSectionConfig';
import { RotatingWordsInput } from './RotatingWordsInput';
import { SectionPreviewWrapper } from './SectionPreviewWrapper';
import { HeroSectionPreview } from './previews/HeroSectionPreview';
import { SliderInput } from './inputs/SliderInput';
import { UrlInput } from './inputs/UrlInput';
import { ToggleInput } from './inputs/ToggleInput';
import { useDebounce } from '@/hooks/use-debounce';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function HeroEditor() {
  const { data, isLoading, isSaving, update } = useHeroConfig();
  const [localConfig, setLocalConfig] = useState<HeroConfig>(DEFAULT_HERO);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedConfig = useDebounce(localConfig, 300);

  // Sync local state when data loads
  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('Hero section saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof HeroConfig>(field: K, value: HeroConfig[K]) => {
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
          <CardTitle className="text-lg">Hero Section</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
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
              placeholder="Hair • Color • Artistry"
            />
          </div>

          {/* Rotating Words */}
          <RotatingWordsInput
            words={localConfig.rotating_words}
            onChange={(words) => updateField('rotating_words', words)}
            label="Headline Rotating Words"
            placeholder="e.g. Salon, Extensions..."
          />

          {/* Subheadline */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subheadline1">Subheadline Line 1</Label>
              <Input
                id="subheadline1"
                value={localConfig.subheadline_line1}
                onChange={(e) => updateField('subheadline_line1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheadline2">Subheadline Line 2</Label>
              <Input
                id="subheadline2"
                value={localConfig.subheadline_line2}
                onChange={(e) => updateField('subheadline_line2', e.target.value)}
              />
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Call to Action Buttons</h4>
            <div className="space-y-2">
              <Label htmlFor="cta_new">New Client Button Text</Label>
              <Input
                id="cta_new"
                value={localConfig.cta_new_client}
                onChange={(e) => updateField('cta_new_client', e.target.value)}
              />
            </div>
            <UrlInput
              label="New Client Button URL"
              value={localConfig.cta_new_client_url}
              onChange={(value) => updateField('cta_new_client_url', value)}
              placeholder="Leave empty to open consultation form"
              description="Leave empty to open the consultation form dialog"
            />
            <div className="space-y-2">
              <Label htmlFor="cta_returning">Returning Client Button Text</Label>
              <Input
                id="cta_returning"
                value={localConfig.cta_returning_client}
                onChange={(e) => updateField('cta_returning_client', e.target.value)}
              />
            </div>
            <UrlInput
              label="Returning Client Button URL"
              value={localConfig.cta_returning_client_url}
              onChange={(value) => updateField('cta_returning_client_url', value)}
              placeholder="/booking"
            />
          </div>

          {/* Consultation Notes */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Consultation Notes</h4>
            <div className="space-y-2">
              <Label htmlFor="note1">Note Line 1</Label>
              <Input
                id="note1"
                value={localConfig.consultation_note_line1}
                onChange={(e) => updateField('consultation_note_line1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note2">Note Line 2</Label>
              <Input
                id="note2"
                value={localConfig.consultation_note_line2}
                onChange={(e) => updateField('consultation_note_line2', e.target.value)}
              />
            </div>
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
            <CollapsibleContent className="space-y-6 pt-4">
              {/* Animation Timing */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">Animation Timing</h4>
                <SliderInput
                  label="Animation Start Delay"
                  value={localConfig.animation_start_delay}
                  onChange={(value) => updateField('animation_start_delay', value)}
                  min={1}
                  max={8}
                  step={0.5}
                  unit="s"
                  description="When word rotation begins after page load"
                />
                <SliderInput
                  label="Word Rotation Interval"
                  value={localConfig.word_rotation_interval}
                  onChange={(value) => updateField('word_rotation_interval', value)}
                  min={2}
                  max={10}
                  step={0.5}
                  unit="s"
                  description="How long each rotating word displays"
                />
              </div>

              {/* Scroll Indicator */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">Scroll Indicator</h4>
                <ToggleInput
                  label="Show Scroll Indicator"
                  value={localConfig.show_scroll_indicator}
                  onChange={(value) => updateField('show_scroll_indicator', value)}
                  description="Show the scroll arrow at the bottom"
                />
                <div className="space-y-2">
                  <Label>Scroll Indicator Text</Label>
                  <Input
                    value={localConfig.scroll_indicator_text}
                    onChange={(e) => updateField('scroll_indicator_text', e.target.value)}
                    placeholder="Scroll"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="hidden xl:block">
        <SectionPreviewWrapper>
          <HeroSectionPreview config={debouncedConfig} />
        </SectionPreviewWrapper>
      </div>
    </div>
  );
}
