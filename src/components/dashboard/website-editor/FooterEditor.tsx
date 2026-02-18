import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, Link2, Instagram, Facebook, Twitter, Youtube, Linkedin, Music2, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FooterLink {
  href: string;
  label: string;
}

interface FooterBottomLink {
  href: string;
  label: string;
}

interface FooterConfig {
  [key: string]: unknown;
  tagline: string;
  copyright_text: string;
  contact_email: string;
  instagram_handle: string;
  instagram_url: string;
  nav_links: FooterLink[];
  bottom_links: FooterBottomLink[];
  powered_by_text: string;
}

const DEFAULT_FOOTER: FooterConfig = {
  tagline: 'Death to bad hair.',
  copyright_text: '© {year} Drop Dead Salon. All rights reserved.',
  contact_email: 'contact@dropdeadsalon.com',
  instagram_handle: '@dropdeadsalon',
  instagram_url: 'https://instagram.com',
  nav_links: [
    { href: '/services', label: 'Services' },
    { href: '/booking', label: 'Book' },
  ],
  bottom_links: [
    { href: '/stylists#careers', label: 'Work at Drop Dead' },
    { href: '/gift-cards', label: 'Buy a gift card' },
  ],
  powered_by_text: 'Powered by Drop Dead Salon Software',
};

export function FooterEditor() {
  const queryClient = useQueryClient();
  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['site-settings', 'website_footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'website_footer')
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return null;
      return data.value as unknown as FooterConfig;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (value: FooterConfig) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('id', 'website_footer')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: value as never, updated_by: user?.id })
          .eq('id', 'website_footer');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ id: 'website_footer', value: value as never, updated_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'website_footer'] });
    },
  });

  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedConfig) {
      setConfig({ ...DEFAULT_FOOTER, ...savedConfig });
    }
  }, [savedConfig]);

  const handleChange = (field: keyof FooterConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(config);
      setIsDirty(false);
      toast.success('Footer settings saved & published');
    } catch {
      toast.error('Failed to save footer settings');
    }
  };

  const addNavLink = () => {
    handleChange('nav_links', [...config.nav_links, { href: '/', label: 'New Link' }]);
  };

  const removeNavLink = (index: number) => {
    handleChange('nav_links', config.nav_links.filter((_, i) => i !== index));
  };

  const updateNavLink = (index: number, field: 'href' | 'label', value: string) => {
    const updated = [...config.nav_links];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('nav_links', updated);
  };

  const addBottomLink = () => {
    handleChange('bottom_links', [...config.bottom_links, { href: '/', label: 'New Link' }]);
  };

  const removeBottomLink = (index: number) => {
    handleChange('bottom_links', config.bottom_links.filter((_, i) => i !== index));
  };

  const updateBottomLink = (index: number, field: 'href' | 'label', value: string) => {
    const updated = [...config.bottom_links];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('bottom_links', updated);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display">Footer Settings</h2>
          <p className="text-sm text-muted-foreground">Manage footer content, links, and social profiles</p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save & Publish Changes'}
        </Button>
      </div>

      {/* Brand & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand & Contact</CardTitle>
          <CardDescription>Tagline, copyright, and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={config.tagline} onChange={e => handleChange('tagline', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Copyright Text</Label>
            <Input value={config.copyright_text} onChange={e => handleChange('copyright_text', e.target.value)} />
            <p className="text-xs text-muted-foreground">{'{year}'} will be replaced with the current year</p>
          </div>
          <div className="space-y-2">
            <Label>Contact Email</Label>
            <Input type="email" value={config.contact_email} onChange={e => handleChange('contact_email', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Powered By Text</Label>
            <Input value={config.powered_by_text} onChange={e => handleChange('powered_by_text', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Social Media
          </CardTitle>
          <CardDescription>Social media links displayed in the footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input value={config.instagram_handle} onChange={e => handleChange('instagram_handle', e.target.value)} placeholder="@yoursalon" />
          </div>
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input value={config.instagram_url} onChange={e => handleChange('instagram_url', e.target.value)} placeholder="https://instagram.com/yoursalon" />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Navigation Links
          </CardTitle>
          <CardDescription>Main footer navigation links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.nav_links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input className="flex-1" placeholder="Label" value={link.label} onChange={e => updateNavLink(index, 'label', e.target.value)} />
              <Input className="flex-1" placeholder="/path" value={link.href} onChange={e => updateNavLink(index, 'href', e.target.value)} />
              <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => removeNavLink(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addNavLink} className="gap-2">
            <Plus className="h-4 w-4" /> Add Link
          </Button>
        </CardContent>
      </Card>

      {/* Bottom Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bottom Bar Links</CardTitle>
          <CardDescription>Links shown at the very bottom of the footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.bottom_links.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input className="flex-1" placeholder="Label" value={link.label} onChange={e => updateBottomLink(index, 'label', e.target.value)} />
              <Input className="flex-1" placeholder="/path" value={link.href} onChange={e => updateBottomLink(index, 'href', e.target.value)} />
              <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => removeBottomLink(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addBottomLink} className="gap-2">
            <Plus className="h-4 w-4" /> Add Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}