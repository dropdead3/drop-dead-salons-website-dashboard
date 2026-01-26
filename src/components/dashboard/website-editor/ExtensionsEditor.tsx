import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Star, Award, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useExtensionsConfig, type ExtensionsConfig, DEFAULT_EXTENSIONS } from '@/hooks/useSectionConfig';
import { useDebounce } from '@/hooks/use-debounce';

const ICON_OPTIONS = [
  { value: 'Star', icon: Star },
  { value: 'Award', icon: Award },
  { value: 'MapPin', icon: MapPin },
];

export function ExtensionsEditor() {
  const { data, isLoading, isSaving, update } = useExtensionsConfig();
  const [localConfig, setLocalConfig] = useState<ExtensionsConfig>(DEFAULT_EXTENSIONS);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('Extensions section saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof ExtensionsConfig>(field: K, value: ExtensionsConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateFeature = (index: number, field: keyof ExtensionsConfig['features'][0], value: string) => {
    const newFeatures = [...localConfig.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateField('features', newFeatures);
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
          <CardTitle className="text-lg">Extensions Section</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Badge */}
          <div className="space-y-2">
            <Label htmlFor="badge_text">Badge Text</Label>
            <Input
              id="badge_text"
              value={localConfig.badge_text}
              onChange={(e) => updateField('badge_text', e.target.value)}
            />
          </div>

          {/* Eyebrow */}
          <div className="space-y-2">
            <Label htmlFor="eyebrow">Eyebrow Text</Label>
            <Input
              id="eyebrow"
              value={localConfig.eyebrow}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          {/* Headlines */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headline1">Headline Line 1</Label>
              <Input
                id="headline1"
                value={localConfig.headline_line1}
                onChange={(e) => updateField('headline_line1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline2">Headline Line 2</Label>
              <Input
                id="headline2"
                value={localConfig.headline_line2}
                onChange={(e) => updateField('headline_line2', e.target.value)}
              />
            </div>
          </div>

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

          {/* Features */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Feature Cards</h4>
            {localConfig.features.map((feature, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Feature {index + 1}
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={feature.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Call to Action Buttons</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cta_primary">Primary CTA</Label>
                <Input
                  id="cta_primary"
                  value={localConfig.cta_primary}
                  onChange={(e) => updateField('cta_primary', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta_secondary">Secondary CTA</Label>
                <Input
                  id="cta_secondary"
                  value={localConfig.cta_secondary}
                  onChange={(e) => updateField('cta_secondary', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="education_link">Education Link Text</Label>
              <Input
                id="education_link"
                value={localConfig.education_link_text}
                onChange={(e) => updateField('education_link_text', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
