import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEditorSaveAction } from '@/hooks/useEditorSaveAction';
import { toast } from 'sonner';
import type { PageConfig, WebsitePagesConfig } from '@/hooks/useWebsitePages';

const RESERVED_SLUGS = [
  'services', 'extensions', 'about', 'policies', 'booking',
  'careers', 'gallery', 'stylists', 'shop', 'login', 'contact',
  'dashboard', 'admin', 'day-rate',
];

interface PageSettingsEditorProps {
  page: PageConfig;
  allPages?: WebsitePagesConfig;
  onUpdate: (page: PageConfig) => Promise<void>;
}

export function PageSettingsEditor({ page, allPages, onUpdate }: PageSettingsEditorProps) {
  const [local, setLocal] = useState(page);
  const [slugError, setSlugError] = useState('');

  useEffect(() => {
    setLocal(page);
    setSlugError('');
  }, [page]);

  const validateSlug = useCallback((slug: string) => {
    if (!slug) return '';
    if (RESERVED_SLUGS.includes(slug)) {
      return `"${slug}" is reserved. Choose a different slug.`;
    }
    if (allPages) {
      const collision = allPages.pages.find(p => p.slug === slug && p.id !== page.id);
      if (collision) return `"${slug}" is already used by "${collision.title}".`;
    }
    return '';
  }, [allPages, page.id]);

  const update = (key: keyof PageConfig, value: unknown) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    if (key === 'slug') {
      setSlugError(validateSlug(value as string));
    }
    window.dispatchEvent(new CustomEvent('editor-dirty-state', { detail: { dirty: true } }));
  };

  const handleSave = useCallback(async () => {
    if (slugError) {
      toast.error(slugError);
      return;
    }
    try {
      await onUpdate(local);
      toast.success('Page settings saved');
      window.dispatchEvent(new CustomEvent('editor-dirty-state', { detail: { dirty: false } }));
    } catch {
      toast.error('Failed to save page settings');
    }
  }, [local, onUpdate, slugError]);

  useEditorSaveAction(handleSave);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Settings — {page.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input value={local.title} onChange={e => update('title', e.target.value)} />
          </div>

          {page.page_type !== 'home' && (
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">/org/your-salon/</span>
                <Input
                  value={local.slug}
                  onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1"
                />
              </div>
              {slugError && (
                <p className="text-[11px] text-destructive">{slugError}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input
              value={local.seo_title}
              onChange={e => update('seo_title', e.target.value)}
              placeholder={local.title}
            />
            <p className="text-[10px] text-muted-foreground">Appears in browser tab and search results. Under 60 characters.</p>
          </div>

          <div className="space-y-2">
            <Label>SEO Description</Label>
            <Textarea
              value={local.seo_description}
              onChange={e => update('seo_description', e.target.value)}
              placeholder="Describe this page for search engines..."
              rows={2}
            />
            <p className="text-[10px] text-muted-foreground">Under 160 characters.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show in Navigation</Label>
              <p className="text-[10px] text-muted-foreground">Display a link in the header nav</p>
            </div>
            <Switch checked={local.show_in_nav} onCheckedChange={v => update('show_in_nav', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Page Enabled</Label>
              <p className="text-[10px] text-muted-foreground">When disabled, this page returns a 404</p>
            </div>
            <Switch checked={local.enabled} onCheckedChange={v => update('enabled', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
