import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Paintbrush, 
  Type, 
  Layout,
  Sparkles
} from 'lucide-react';
import { ClientEngineWelcome } from './ClientEngineWelcome';
import { ProgramLogoEditor } from './ProgramLogoEditor';
import { ProgramConfig } from '@/hooks/useProgramConfig';

interface WelcomePageConfig {
  headline: string;
  subheadline: string;
  ctaText: string;
  showHighlights: boolean;
  showRulesPreview: boolean;
  showTasksPreview: boolean;
  showWarningBanner: boolean;
}

interface WelcomePagePreviewProps {
  previewConfig?: ProgramConfig | null;
  onLogoChange?: (url: string | null) => void;
  onLogoSizeChange?: (size: number) => void;
  onLogoColorChange?: (color: string | null) => void;
}

export function WelcomePagePreview({ previewConfig, onLogoChange, onLogoSizeChange, onLogoColorChange }: WelcomePagePreviewProps) {
  const [config, setConfig] = useState<WelcomePageConfig>({
    headline: 'BUILD YOUR CLIENT ENGINE',
    subheadline: '75 days of focused execution. No shortcuts. No excuses. Transform your book and build a business that runs on autopilot.',
    ctaText: "I'M READY — START DAY 1",
    showHighlights: true,
    showRulesPreview: true,
    showTasksPreview: true,
    showWarningBanner: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Layout className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg tracking-wide">Welcome Page Editor</h2>
          <p className="text-sm text-muted-foreground">Customize the onboarding experience for new participants</p>
        </div>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Paintbrush className="w-4 h-4" />
            Customize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6">
          <Card className="overflow-hidden border-2 border-dashed border-border/50">
            <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                <Eye className="w-3 h-3 mr-1.5" />
                Live Preview
              </Badge>
              <span className="text-xs text-muted-foreground">
                This is what new participants will see
              </span>
            </div>
            <div className="bg-background">
              <ClientEngineWelcome onStartProgram={() => {}} isPreview previewConfig={previewConfig} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-6 space-y-6">
          {/* Program Logo Editor */}
          {onLogoChange && onLogoSizeChange && onLogoColorChange && (
            <ProgramLogoEditor
              currentLogoUrl={previewConfig?.logo_url || null}
              logoSize={previewConfig?.logo_size || 64}
              logoColor={previewConfig?.logo_color || null}
              onLogoChange={onLogoChange}
              onSizeChange={onLogoSizeChange}
              onColorChange={onLogoColorChange}
            />
          )}

          {/* Content Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Type className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm tracking-wide">CONTENT</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="headline">Main Headline</Label>
                <Input
                  id="headline"
                  value={config.headline}
                  onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                  placeholder="BUILD YOUR CLIENT ENGINE"
                  className="font-display tracking-wide"
                />
                <p className="text-xs text-muted-foreground">
                  Keep it punchy and action-oriented
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline</Label>
                <Textarea
                  id="subheadline"
                  value={config.subheadline}
                  onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                  placeholder="75 days of focused execution..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta">Call to Action Button</Label>
                <Input
                  id="cta"
                  value={config.ctaText}
                  onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                  placeholder="I'M READY — START DAY 1"
                  className="font-display tracking-wide"
                />
              </div>
            </div>
          </Card>

          {/* Layout Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Layout className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm tracking-wide">LAYOUT</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Highlights Grid</Label>
                  <p className="text-xs text-muted-foreground">Display the 4 program highlights</p>
                </div>
                <Switch
                  checked={config.showHighlights}
                  onCheckedChange={(checked) => setConfig({ ...config, showHighlights: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Tasks Preview</Label>
                  <p className="text-xs text-muted-foreground">Preview daily tasks in the commitment section</p>
                </div>
                <Switch
                  checked={config.showTasksPreview}
                  onCheckedChange={(checked) => setConfig({ ...config, showTasksPreview: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Rules Preview</Label>
                  <p className="text-xs text-muted-foreground">Preview program rules in the commitment section</p>
                </div>
                <Switch
                  checked={config.showRulesPreview}
                  onCheckedChange={(checked) => setConfig({ ...config, showRulesPreview: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Warning Banner</Label>
                  <p className="text-xs text-muted-foreground">Display the "Only begin when ready" warning</p>
                </div>
                <Switch
                  checked={config.showWarningBanner}
                  onCheckedChange={(checked) => setConfig({ ...config, showWarningBanner: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Content is pulled dynamically</p>
                <p className="text-xs text-muted-foreground">
                  The tasks and rules shown in the preview are pulled from your program configuration. 
                  Edit them in the "Daily Tasks" and "Rules" tabs to update the welcome page.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
