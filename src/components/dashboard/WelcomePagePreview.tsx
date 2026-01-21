import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Paintbrush, 
  Type, 
  Layout,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { ClientEngineWelcome } from './ClientEngineWelcome';
import { ProgramLogoEditor } from './ProgramLogoEditor';
import { ProgramConfig } from '@/hooks/useProgramConfig';
import { Link } from 'react-router-dom';

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

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="edit" className="gap-2">
            <Paintbrush className="w-4 h-4" />
            Customize
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
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
              <ClientEngineWelcome 
                onStartProgram={() => {}} 
                isPreview 
                previewConfig={previewConfig} 
                contentOverrides={{
                  headline: config.headline,
                  subheadline: config.subheadline,
                  ctaText: config.ctaText
                }}
              />
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

            <div className="space-y-2">
              {/* Highlights Grid */}
              <Collapsible>
                <div className="flex items-center justify-between py-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left hover:text-primary transition-colors group">
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                      <div>
                        <Label className="cursor-pointer">Show Highlights Grid</Label>
                        <p className="text-xs text-muted-foreground">Display the 4 program highlights</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <Switch
                    checked={config.showHighlights}
                    onCheckedChange={(checked) => setConfig({ ...config, showHighlights: checked })}
                  />
                </div>
                <CollapsibleContent className="pl-6 pb-3">
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="mb-2">The highlights grid shows 4 key program features:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>75 Consecutive Days</li>
                      <li>Streak-Based System</li>
                      <li>Life Happens Passes</li>
                      <li>Weekly Wins</li>
                    </ul>
                    <p className="mt-3 text-xs italic">Highlight content is based on program settings.</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Tasks Preview */}
              <Collapsible>
                <div className="flex items-center justify-between py-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left hover:text-primary transition-colors group">
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                      <div>
                        <Label className="cursor-pointer">Show Tasks Preview</Label>
                        <p className="text-xs text-muted-foreground">Preview daily tasks in the commitment section</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <Switch
                    checked={config.showTasksPreview}
                    onCheckedChange={(checked) => setConfig({ ...config, showTasksPreview: checked })}
                  />
                </div>
                <CollapsibleContent className="pl-6 pb-3">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">Tasks shown are pulled from your program configuration.</p>
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <Link to="/dashboard/admin/program-editor?tab=tasks">
                        <ExternalLink className="w-3 h-3" />
                        Edit Daily Tasks
                      </Link>
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Rules Preview */}
              <Collapsible>
                <div className="flex items-center justify-between py-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left hover:text-primary transition-colors group">
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                      <div>
                        <Label className="cursor-pointer">Show Rules Preview</Label>
                        <p className="text-xs text-muted-foreground">Preview program rules in the commitment section</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <Switch
                    checked={config.showRulesPreview}
                    onCheckedChange={(checked) => setConfig({ ...config, showRulesPreview: checked })}
                  />
                </div>
                <CollapsibleContent className="pl-6 pb-3">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">Rules shown are pulled from your program configuration.</p>
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <Link to="/dashboard/admin/program-editor?tab=rules">
                        <ExternalLink className="w-3 h-3" />
                        Edit Program Rules
                      </Link>
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Warning Banner */}
              <Collapsible>
                <div className="flex items-center justify-between py-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left hover:text-primary transition-colors group">
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                      <div>
                        <Label className="cursor-pointer">Show Warning Banner</Label>
                        <p className="text-xs text-muted-foreground">Display the "Only begin when ready" warning</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <Switch
                    checked={config.showWarningBanner}
                    onCheckedChange={(checked) => setConfig({ ...config, showWarningBanner: checked })}
                  />
                </div>
                <CollapsibleContent className="pl-6 pb-3">
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="mb-2">The warning banner displays:</p>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs">
                      <p className="font-medium text-foreground mb-1">Only begin when you're ready</p>
                      <p>This program requires consecutive days of execution. Miss a day and you restart from Day 1.</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
