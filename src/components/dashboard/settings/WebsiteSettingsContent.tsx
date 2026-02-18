import { useState, useEffect } from 'react';
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
  Instagram, Facebook, Twitter, Linkedin, Youtube
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
  type WebsiteBookingSettings,
  type WebsiteRetailSettings,
  type WebsiteSeoLegalSettings,
  type WebsiteThemeSettings,
} from '@/hooks/useWebsiteSettings';
import { cn } from '@/lib/utils';
import { DomainConfigCard } from './DomainConfigCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── General Tab ───
function GeneralTab() {
  const { effectiveOrganization } = useOrganizationContext();
  return (
    <div className="space-y-6">
      <DomainConfigCard organizationId={effectiveOrganization?.id} />
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
            <Switch />
          </div>
          <div className="space-y-2">
            <Label>Banner text</Label>
            <Input placeholder="e.g. Now accepting new clients — Book your first visit today!" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">SOCIAL LINKS</CardTitle>
          <CardDescription>Social media URLs shown in website footer and contact sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: Instagram, label: 'Instagram', placeholder: 'https://instagram.com/yoursalon' },
            { icon: Facebook, label: 'Facebook', placeholder: 'https://facebook.com/yoursalon' },
            { icon: Twitter, label: 'X / Twitter', placeholder: 'https://x.com/yoursalon' },
            { icon: Youtube, label: 'YouTube', placeholder: 'https://youtube.com/@yoursalon' },
            { icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yoursalon' },
          ].map(({ icon: Icon, label, placeholder }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input placeholder={placeholder} autoCapitalize="off" className="flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard/admin/website-sections">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Full Website Editor
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Theme Tab ───
function ThemeTab() {
  const { data: themeSettings, isLoading } = useWebsiteThemeSettings();
  const updateTheme = useUpdateWebsiteThemeSettings();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<string>('cream');

  useEffect(() => {
    if (themeSettings?.color_theme) {
      setSelectedTheme(themeSettings.color_theme);
    }
  }, [themeSettings]);

  const handleSaveTheme = () => {
    updateTheme.mutate(
      { key: 'website_theme', value: { color_theme: selectedTheme } as WebsiteThemeSettings },
      {
        onSuccess: () => toast({ title: 'Theme saved', description: 'Website theme updated successfully.' }),
        onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to save theme.' }),
      }
    );
  };

  const futureThemes = [
    { name: 'Midnight', description: 'Deep navy & gold' },
    { name: 'Terracotta', description: 'Warm earth tones' },
    { name: 'Lavender', description: 'Soft purple pastels' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">COLOR THEME</CardTitle>
          <CardDescription>Choose the color theme for your public-facing website. This applies globally to all visitors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colorThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={cn(
                  "relative rounded-xl border-2 p-3 text-left transition-all hover:shadow-md",
                  selectedTheme === t.id 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex gap-1.5 mb-2">
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: t.lightPreview.bg }} />
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: t.lightPreview.accent }} />
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: t.lightPreview.primary }} />
                </div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                {selectedTheme === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedTheme !== (themeSettings?.color_theme || 'cream') && (
            <Button onClick={handleSaveTheme} disabled={updateTheme.isPending} className="w-full">
              {updateTheme.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Theme
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">UPCOMING THEMES</CardTitle>
          <CardDescription>New themes are in development. Stay tuned!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {futureThemes.map((ft) => (
              <div key={ft.name} className="rounded-xl border border-dashed border-border p-4 opacity-60">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{ft.name}</p>
                  <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ft.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard/admin/website-sections">
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Homepage Sections
            </a>
          </Button>
        </CardContent>
      </Card>
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
