import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useDrinkMenuConfig, type DrinkMenuConfig, DEFAULT_DRINK_MENU } from '@/hooks/useSectionConfig';

export function DrinkMenuEditor() {
  const { data, isLoading, isSaving, update } = useDrinkMenuConfig();
  const [localConfig, setLocalConfig] = useState<DrinkMenuConfig>(DEFAULT_DRINK_MENU);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('Drink Menu section saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateField = <K extends keyof DrinkMenuConfig>(field: K, value: DrinkMenuConfig[K]) => {
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
    <div className="max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle className="text-lg">Drink Menu Section</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-muted-foreground">
            Configure the header text that appears above the drink carousel.
          </p>

          <div className="space-y-2">
            <Label htmlFor="eyebrow">Eyebrow Start</Label>
            <Input
              id="eyebrow"
              value={localConfig.eyebrow}
              onChange={(e) => updateField('eyebrow', e.target.value)}
              placeholder="Drinks on us. We have an exclusive menu of"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlight">Highlighted Word (underlined)</Label>
            <Input
              id="highlight"
              value={localConfig.eyebrow_highlight}
              onChange={(e) => updateField('eyebrow_highlight', e.target.value)}
              placeholder="complimentary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suffix">Eyebrow End</Label>
            <Input
              id="suffix"
              value={localConfig.eyebrow_suffix}
              onChange={(e) => updateField('eyebrow_suffix', e.target.value)}
              placeholder="options for your appointment."
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Individual drinks are currently managed in code. Contact development to update the drink list.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
