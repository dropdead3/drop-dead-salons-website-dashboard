import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Palette, Calendar, ShoppingBag, Scale, 
  ExternalLink, Check, Loader2, Save, Megaphone,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Eye,
  ArrowLeft, PanelRightClose, PanelRightOpen, LayoutGrid,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { colorThemes, type ColorTheme } from '@/hooks/useColorTheme';
import {
  useWebsiteBookingSettings,
  useUpdateWebsiteBookingSettings,
  useWebsiteRetailSettings,
  useUpdateWebsiteRetailSettings,
  useWebsiteSeoLegalSettings,
  useUpdateWebsiteSeoLegalSettings,
  useWebsiteThemeSettings,
  useUpdateWebsiteThemeSettings,
  useWebsiteSocialLinksSettings,
  useUpdateWebsiteSocialLinksSettings,
  type WebsiteBookingSettings,
  type WebsiteRetailSettings,
  type WebsiteSeoLegalSettings,
  type WebsiteThemeSettings,
  type WebsiteSocialLinksSettings,
} from '@/hooks/useWebsiteSettings';
import {
  useAnnouncementBarSettings,
  useUpdateAnnouncementBarSettings,
  type AnnouncementBarSettings,
} from '@/hooks/useAnnouncementBar';
import { cn } from '@/lib/utils';
import { DomainConfigCard } from './DomainConfigCard';
import { ActiveThemeCard } from './ActiveThemeCard';
import { ThemeLibraryGrid } from './ThemeLibraryGrid';
import { useWebsiteThemes, useActiveTheme, useActivateTheme } from '@/hooks/useWebsiteThemes';
import { useColorTheme } from '@/hooks/useColorTheme';
// Website Editor components for embedded editor
import { WebsiteEditorSidebar } from '@/components/dashboard/website-editor/WebsiteEditorSidebar';
import { LivePreviewPanel } from '@/components/dashboard/website-editor/LivePreviewPanel';
import { HeroEditor } from '@/components/dashboard/website-editor/HeroEditor';
import { BrandStatementEditor } from '@/components/dashboard/website-editor/BrandStatementEditor';
import { NewClientEditor } from '@/components/dashboard/website-editor/NewClientEditor';
import { TestimonialsEditor } from '@/components/dashboard/website-editor/TestimonialsEditor';
import { ExtensionsEditor } from '@/components/dashboard/website-editor/ExtensionsEditor';
import { FAQEditor } from '@/components/dashboard/website-editor/FAQEditor';
import { BrandsManager } from '@/components/dashboard/website-editor/BrandsManager';
import { DrinksManager } from '@/components/dashboard/website-editor/DrinksManager';
import { FooterCTAEditor } from '@/components/dashboard/website-editor/FooterCTAEditor';
import { TestimonialsContent } from '@/components/dashboard/website-editor/TestimonialsContent';
import { GalleryContent } from '@/components/dashboard/website-editor/GalleryContent';
import { StylistsContent } from '@/components/dashboard/website-editor/StylistsContent';
import { LocationsContent } from '@/components/dashboard/website-editor/LocationsContent';
import { ServicesContent } from '@/components/dashboard/website-editor/ServicesContent';
import { AnnouncementBarContent } from '@/components/dashboard/website-editor/AnnouncementBarContent';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DEFAULT_SOCIAL_LINKS: WebsiteSocialLinksSettings = {
  instagram: '',
  facebook: '',
  twitter: '',
  youtube: '',
  linkedin: '',
  tiktok: '',
};

const SOCIAL_FIELDS = [
  { key: 'instagram' as const, icon: Instagram, label: 'Instagram', placeholder: 'https://instagram.com/yoursalon' },
  { key: 'facebook' as const, icon: Facebook, label: 'Facebook', placeholder: 'https://facebook.com/yoursalon' },
  { key: 'twitter' as const, icon: Twitter, label: 'X / Twitter', placeholder: 'https://x.com/yoursalon' },
  { key: 'youtube' as const, icon: Youtube, label: 'YouTube', placeholder: 'https://youtube.com/@yoursalon' },
  { key: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yoursalon' },
];

// ─── General Tab ───
function GeneralTab() {
  const { effectiveOrganization } = useOrganizationContext();
  const { toast } = useToast();

  // Announcement bar
  const { data: announcementSettings, isLoading: annLoading } = useAnnouncementBarSettings();
  const updateAnnouncement = useUpdateAnnouncementBarSettings();
  const [annLocal, setAnnLocal] = useState<AnnouncementBarSettings>({
    enabled: true,
    message_prefix: '',
    message_highlight: '',
    message_suffix: '',
    cta_text: '',
    cta_url: '',
    open_in_new_tab: true,
  });

  useEffect(() => {
    if (announcementSettings) setAnnLocal(announcementSettings);
  }, [announcementSettings]);

  const annHasChanges = announcementSettings && JSON.stringify(annLocal) !== JSON.stringify(announcementSettings);

  const handleSaveAnnouncement = () => {
    updateAnnouncement.mutate(annLocal, {
      onSuccess: () => toast({ title: 'Saved', description: 'Announcement banner updated.' }),
      onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to save announcement.' }),
    });
  };

  // Social links
  const { data: socialSettings, isLoading: socialLoading } = useWebsiteSocialLinksSettings();
  const updateSocial = useUpdateWebsiteSocialLinksSettings();
  const [socialLocal, setSocialLocal] = useState<WebsiteSocialLinksSettings>(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    if (socialSettings) setSocialLocal(socialSettings);
  }, [socialSettings]);

  const socialHasChanges = socialSettings && JSON.stringify(socialLocal) !== JSON.stringify(socialSettings);

  const handleSaveSocial = () => {
    updateSocial.mutate(
      { key: 'website_social_links', value: socialLocal },
      {
        onSuccess: () => toast({ title: 'Saved', description: 'Social links updated.' }),
        onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to save social links.' }),
      }
    );
  };

  const isLoading = annLoading || socialLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <DomainConfigCard organizationId={effectiveOrganization?.id} />

      {/* Announcement Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">ANNOUNCEMENT BANNER</CardTitle>
          <CardDescription>Control the banner displayed at the top of your public website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show announcement banner</p>
              <p className="text-xs text-muted-foreground">Displays a dismissable banner at the top of every page</p>
            </div>
            <Switch
              checked={annLocal.enabled}
              onCheckedChange={(v) => setAnnLocal(prev => ({ ...prev, enabled: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Message prefix</Label>
            <Input
              placeholder="Are you a salon"
              value={annLocal.message_prefix}
              onChange={(e) => setAnnLocal(prev => ({ ...prev, message_prefix: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Highlighted text</Label>
            <Input
              placeholder="professional"
              value={annLocal.message_highlight}
              onChange={(e) => setAnnLocal(prev => ({ ...prev, message_highlight: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Message suffix</Label>
            <Input
              placeholder="looking for our extensions?"
              value={annLocal.message_suffix}
              onChange={(e) => setAnnLocal(prev => ({ ...prev, message_suffix: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CTA button text</Label>
              <Input
                placeholder="Shop Now"
                value={annLocal.cta_text}
                onChange={(e) => setAnnLocal(prev => ({ ...prev, cta_text: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA link URL</Label>
              <Input
                placeholder="https://..."
                value={annLocal.cta_url}
                onChange={(e) => setAnnLocal(prev => ({ ...prev, cta_url: e.target.value }))}
                autoCapitalize="off"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Open link in new tab</p>
            <Switch
              checked={annLocal.open_in_new_tab}
              onCheckedChange={(v) => setAnnLocal(prev => ({ ...prev, open_in_new_tab: v }))}
            />
          </div>
          {annHasChanges && (
            <Button onClick={handleSaveAnnouncement} disabled={updateAnnouncement.isPending} className="w-full">
              {updateAnnouncement.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Announcement
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">SOCIAL LINKS</CardTitle>
          <CardDescription>Social media URLs shown in website footer and contact sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOCIAL_FIELDS.map(({ key, icon: Icon, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                placeholder={placeholder}
                autoCapitalize="off"
                className="flex-1"
                value={socialLocal[key] || ''}
                onChange={(e) => setSocialLocal(prev => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          {socialHasChanges && (
            <Button onClick={handleSaveSocial} disabled={updateSocial.isPending} className="w-full mt-2">
              {updateSocial.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Social Links
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard/admin/website-sections">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Full Website Editor
            </a>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.open('/', '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Website
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Editor component map (same as WebsiteSectionsHub)
const EDITOR_COMPONENTS: Record<string, React.ComponentType> = {
  'services': ServicesContent,
  'testimonials': TestimonialsContent,
  'gallery': GalleryContent,
  'stylists': StylistsContent,
  'locations': LocationsContent,
  'banner': AnnouncementBarContent,
  'hero': HeroEditor,
  'brand': BrandStatementEditor,
  'testimonials-section': TestimonialsEditor,
  'services-preview': ServicesContent,
  'popular-services': ServicesContent,
  'gallery-section': GalleryContent,
  'new-client': NewClientEditor,
  'stylists-section': StylistsContent,
  'locations-section': LocationsContent,
  'extensions': ExtensionsEditor,
  'faq': FAQEditor,
  'brands': BrandsManager,
  'drinks': DrinksManager,
  'footer-cta': FooterCTAEditor,
};

const TAB_LABELS: Record<string, string> = {
  'services': 'Services Manager',
  'testimonials': 'Testimonials Manager',
  'gallery': 'Gallery Manager',
  'stylists': 'Stylists Manager',
  'locations': 'Locations Manager',
  'banner': 'Announcement Banner',
  'hero': 'Hero Section',
  'brand': 'Brand Statement',
  'testimonials-section': 'Testimonials Display',
  'services-preview': 'Services Preview',
  'popular-services': 'Popular Services',
  'gallery-section': 'Gallery Display',
  'new-client': 'New Client CTA',
  'stylists-section': 'Stylists Display',
  'locations-section': 'Locations Display',
  'extensions': 'Extensions Spotlight',
  'faq': 'FAQ',
  'brands': 'Partner Brands',
  'drinks': 'Drink Menu',
  'footer-cta': 'Footer CTA',
};

// ─── Theme Tab (Full Theme Management System) ───
function ThemeTab() {
  const { data: themes, isLoading: themesLoading } = useWebsiteThemes();
  const { data: activeThemeSetting, isLoading: activeLoading } = useActiveTheme();
  const activateTheme = useActivateTheme();
  const { setColorTheme } = useColorTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Editor state
  const [mode, setMode] = useState<'overview' | 'editor'>('overview');
  const [editorTab, setEditorTab] = useState('hero');
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const activeThemeId = activeThemeSetting?.theme_id || 'cream_classic';
  const activeTheme = themes?.find((t) => t.id === activeThemeId);

  const handleActivate = async (themeId: string) => {
    const theme = themes?.find((t) => t.id === themeId);
    if (!theme) return;

    try {
      await activateTheme.mutateAsync(themeId);
      // Apply color scheme
      const validSchemes = ['cream', 'rose', 'sage', 'ocean'];
      if (validSchemes.includes(theme.color_scheme)) {
        setColorTheme(theme.color_scheme as ColorTheme);
      }
      toast({ title: 'Theme activated', description: `"${theme.name}" is now your active theme.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to activate theme.' });
    }
  };

  const handlePreview = (themeId?: string) => {
    window.open('/', '_blank');
  };

  const isLoading = themesLoading || activeLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Editor Mode ──
  if (mode === 'editor') {
    const EditorComponent = EDITOR_COMPONENTS[editorTab];

    return (
      <div className="space-y-0 -mx-1">
        {/* Editor header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setMode('overview')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Themes
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {TAB_LABELS[editorTab] || 'Website Editor'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <><PanelRightClose className="h-4 w-4 mr-1" />Hide Preview</>
              ) : (
                <><PanelRightOpen className="h-4 w-4 mr-1" />Preview</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Open Site
            </Button>
          </div>
        </div>

        {/* Editor content with sidebar + preview */}
        <div className="border rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 20rem)' }}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar */}
            {showSidebar && !isMobile && (
              <>
                <ResizablePanel defaultSize={22} minSize={15} maxSize={30}>
                  <WebsiteEditorSidebar
                    activeTab={editorTab}
                    onTabChange={setEditorTab}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* Main editor */}
            <ResizablePanel defaultSize={showPreview ? 48 : 78} minSize={30}>
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
                  {!isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} className="h-7 w-7">
                      {showSidebar ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Editing: {activeTheme?.name ?? 'Theme'}
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  {EditorComponent ? <EditorComponent /> : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Select a section from the sidebar
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            {/* Preview panel */}
            {showPreview && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <LivePreviewPanel onClose={() => setShowPreview(false)} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    );
  }

  // ── Overview Mode ──
  return (
    <div className="space-y-6">
      {/* Active Theme */}
      {activeTheme && (
        <ActiveThemeCard
          theme={activeTheme}
          onCustomize={() => setMode('editor')}
          onPreview={() => handlePreview()}
        />
      )}

      {/* Theme Library */}
      {themes && themes.length > 0 && (
        <ThemeLibraryGrid
          themes={themes}
          activeThemeId={activeThemeId}
          onActivate={handleActivate}
          onPreview={(id) => handlePreview(id)}
          isActivating={activateTheme.isPending}
        />
      )}
    </div>
  );
}

// ─── Booking Tab ───
function BookingTab() {
  const { data: settings, isLoading } = useWebsiteBookingSettings();
  const updateBooking = useUpdateWebsiteBookingSettings();
  const { toast } = useToast();
  const [local, setLocal] = useState<WebsiteBookingSettings>({
    enabled: false,
    require_deposit: false,
    buffer_minutes: 15,
    new_client_mode: 'both',
  });

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  const hasChanges = settings && JSON.stringify(local) !== JSON.stringify(settings);

  const handleSave = () => {
    updateBooking.mutate(
      { key: 'website_booking', value: local },
      {
        onSuccess: () => toast({ title: 'Saved', description: 'Online booking settings updated.' }),
        onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to save.' }),
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">ONLINE BOOKING</CardTitle>
          <CardDescription>Allow clients to book appointments directly from your website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable online booking</p>
              <p className="text-xs text-muted-foreground">Show the booking widget on your public website</p>
            </div>
            <Switch checked={local.enabled} onCheckedChange={(v) => setLocal(prev => ({ ...prev, enabled: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Require deposit</p>
              <p className="text-xs text-muted-foreground">Clients must pay a deposit to confirm their booking</p>
            </div>
            <Switch checked={local.require_deposit} onCheckedChange={(v) => setLocal(prev => ({ ...prev, require_deposit: v }))} />
          </div>

          <div className="space-y-2">
            <Label>Buffer time between appointments (minutes)</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={local.buffer_minutes}
              onChange={(e) => setLocal(prev => ({ ...prev, buffer_minutes: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Client booking mode</Label>
            <Select value={local.new_client_mode} onValueChange={(v: WebsiteBookingSettings['new_client_mode']) => setLocal(prev => ({ ...prev, new_client_mode: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">New & existing clients</SelectItem>
                <SelectItem value="new_only">New clients only</SelectItem>
                <SelectItem value="existing_only">Existing clients only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasChanges && (
            <Button onClick={handleSave} disabled={updateBooking.isPending} className="w-full">
              {updateBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Booking Settings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stylist & Service visibility stubs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">STYLIST & SERVICE VISIBILITY</CardTitle>
              <CardDescription>Control which stylists and services appear on your booking widget.</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fine-grained controls for showing or hiding specific stylists and services on your public booking page will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Retail Tab ───
function RetailTab() {
  const { data: settings, isLoading } = useWebsiteRetailSettings();
  const updateRetail = useUpdateWebsiteRetailSettings();
  const { toast } = useToast();
  const [local, setLocal] = useState<WebsiteRetailSettings>({
    enabled: false,
    pickup: true,
    delivery: false,
    shipping: false,
    featured_products: true,
  });

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  const hasChanges = settings && JSON.stringify(local) !== JSON.stringify(settings);

  const handleSave = () => {
    updateRetail.mutate(
      { key: 'website_retail', value: local },
      {
        onSuccess: () => toast({ title: 'Saved', description: 'Retail settings updated.' }),
        onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to save.' }),
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">ONLINE SHOP</CardTitle>
              <CardDescription>Sell retail products directly from your website.</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable online shop</p>
              <p className="text-xs text-muted-foreground">Allow clients to browse and purchase retail products</p>
            </div>
            <Switch checked={local.enabled} onCheckedChange={(v) => setLocal(prev => ({ ...prev, enabled: v }))} />
          </div>

          <div className="space-y-3 pl-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fulfillment Options</p>
            {[
              { key: 'pickup' as const, label: 'In-store pickup', desc: 'Clients collect orders at your location' },
              { key: 'delivery' as const, label: 'Local delivery', desc: 'Deliver within a set radius' },
              { key: 'shipping' as const, label: 'Shipping', desc: 'Ship products to any address' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={local[key]} onCheckedChange={(v) => setLocal(prev => ({ ...prev, [key]: v }))} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Featured products on homepage</p>
              <p className="text-xs text-muted-foreground">Showcase selected products on the homepage</p>
            </div>
            <Switch checked={local.featured_products} onCheckedChange={(v) => setLocal(prev => ({ ...prev, featured_products: v }))} />
          </div>

          {hasChanges && (
            <Button onClick={handleSave} disabled={updateRetail.isPending} className="w-full">
              {updateRetail.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Retail Settings
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SEO & Legal Tab ───
function SeoLegalTab() {
  const { data: settings, isLoading } = useWebsiteSeoLegalSettings();
  const updateSeo = useUpdateWebsiteSeoLegalSettings();
  const { toast } = useToast();
  const [local, setLocal] = useState<WebsiteSeoLegalSettings>({
    ga_id: '',
    gtm_id: '',
    meta_pixel_id: '',
    tiktok_pixel_id: '',
    cookie_consent_enabled: false,
    privacy_url: '',
    terms_url: '',
  });

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  const hasChanges = settings && JSON.stringify(local) !== JSON.stringify(settings);

  const handleSave = () => {
    updateSeo.mutate(
      { key: 'website_seo_legal', value: local },
      {
        onSuccess: () => toast({ title: 'Saved', description: 'SEO & legal settings updated.' }),
        onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to save.' }),
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">ANALYTICS & TRACKING</CardTitle>
          <CardDescription>Connect your analytics and advertising platforms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Analytics ID</Label>
            <Input 
              placeholder="G-XXXXXXXXXX" 
              value={local.ga_id} 
              onChange={(e) => setLocal(prev => ({ ...prev, ga_id: e.target.value }))}
              autoCapitalize="off"
            />
          </div>
          <div className="space-y-2">
            <Label>Google Tag Manager ID</Label>
            <Input 
              placeholder="GTM-XXXXXXX" 
              value={local.gtm_id} 
              onChange={(e) => setLocal(prev => ({ ...prev, gtm_id: e.target.value }))}
              autoCapitalize="off"
            />
          </div>
          <div className="space-y-2">
            <Label>Meta Pixel ID</Label>
            <Input 
              placeholder="1234567890" 
              value={local.meta_pixel_id} 
              onChange={(e) => setLocal(prev => ({ ...prev, meta_pixel_id: e.target.value }))}
              autoCapitalize="off"
            />
          </div>
          <div className="space-y-2">
            <Label>TikTok Pixel ID</Label>
            <Input 
              placeholder="CXXXXXXXXXXXXXXXXX" 
              value={local.tiktok_pixel_id} 
              onChange={(e) => setLocal(prev => ({ ...prev, tiktok_pixel_id: e.target.value }))}
              autoCapitalize="off"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">COOKIE CONSENT</CardTitle>
          <CardDescription>Show a cookie consent banner to comply with privacy regulations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show cookie consent banner</p>
              <p className="text-xs text-muted-foreground">Displays a consent banner for analytics cookies on first visit</p>
            </div>
            <Switch
              checked={local.cookie_consent_enabled}
              onCheckedChange={(v) => setLocal(prev => ({ ...prev, cookie_consent_enabled: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">LEGAL PAGES</CardTitle>
          <CardDescription>Links to your legal documents displayed in the website footer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Privacy Policy URL</Label>
            <Input 
              placeholder="https://yoursalon.com/privacy" 
              value={local.privacy_url} 
              onChange={(e) => setLocal(prev => ({ ...prev, privacy_url: e.target.value }))}
              autoCapitalize="off"
            />
          </div>
          <div className="space-y-2">
            <Label>Terms of Service URL</Label>
            <Input 
              placeholder="https://yoursalon.com/terms" 
              value={local.terms_url} 
              onChange={(e) => setLocal(prev => ({ ...prev, terms_url: e.target.value }))}
              autoCapitalize="off"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Don't have legal pages yet? Free generators like{' '}
            <a href="https://www.termsfeed.com" target="_blank" rel="noopener noreferrer" className="underline">TermsFeed</a>{' '}
            or{' '}
            <a href="https://www.freeprivacypolicy.com" target="_blank" rel="noopener noreferrer" className="underline">FreePrivacyPolicy</a>{' '}
            can help you create them.
          </p>
        </CardContent>
      </Card>

      {hasChanges && (
        <Button onClick={handleSave} disabled={updateSeo.isPending} className="w-full">
          {updateSeo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save SEO & Legal Settings
        </Button>
      )}
    </div>
  );
}

// ─── Main Export ───
export function WebsiteSettingsContent() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general" className="gap-1.5">
          <Globe className="w-4 h-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="theme" className="gap-1.5">
          <Palette className="w-4 h-4" />
          Theme
        </TabsTrigger>
        <TabsTrigger value="booking" className="gap-1.5">
          <Calendar className="w-4 h-4" />
          Booking
        </TabsTrigger>
        <TabsTrigger value="retail" className="gap-1.5">
          <ShoppingBag className="w-4 h-4" />
          Retail
        </TabsTrigger>
        <TabsTrigger value="seo" className="gap-1.5">
          <Scale className="w-4 h-4" />
          SEO & Legal
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general"><GeneralTab /></TabsContent>
      <TabsContent value="theme"><ThemeTab /></TabsContent>
      <TabsContent value="booking"><BookingTab /></TabsContent>
      <TabsContent value="retail"><RetailTab /></TabsContent>
      <TabsContent value="seo"><SeoLegalTab /></TabsContent>
    </Tabs>
  );
}
