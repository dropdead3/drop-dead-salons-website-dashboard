import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useBrandsConfig, type BrandsConfig, DEFAULT_BRANDS } from '@/hooks/useSectionConfig';

export function BrandsEditor() {
  const { data, isLoading, isSaving, update } = useBrandsConfig();
  const [localConfig, setLocalConfig] = useState<BrandsConfig>(DEFAULT_BRANDS);

  useEffect(() => {
    if (data && !isLoading) {
      setLocalConfig(data);
    }
  }, [data, isLoading]);

  const handleSave = async () => {
    try {
      await update(localConfig);
      toast.success('Brands section saved');
    } catch {
      toast.error('Failed to save');
    }
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
          <CardTitle className="text-lg">Brands Section</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="intro_text">Introduction Text</Label>
            <Input
              id="intro_text"
              value={localConfig.intro_text}
              onChange={(e) => setLocalConfig({ ...localConfig, intro_text: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Brand logos are currently hardcoded. Contact development to update the logo list.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
