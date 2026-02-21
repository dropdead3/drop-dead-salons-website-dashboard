import { ReactNode, useMemo } from 'react';
import { usePublicOrg } from '@/contexts/PublicOrgContext';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import type { WebsiteRetailThemeSettings } from '@/hooks/useWebsiteSettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { WebsiteSocialLinksSettings } from '@/hooks/useWebsiteSettings';

interface ShopLayoutProps {
  children: ReactNode;
  fullWebsiteEnabled?: boolean;
  theme?: WebsiteRetailThemeSettings | null;
}

const SOCIAL_ICONS = [
  { key: 'instagram' as const, icon: Instagram, label: 'Instagram' },
  { key: 'facebook' as const, icon: Facebook, label: 'Facebook' },
  { key: 'youtube' as const, icon: Youtube, label: 'YouTube' },
  { key: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn' },
];

export function ShopLayout({ children, fullWebsiteEnabled, theme }: ShopLayoutProps) {
  const { organization, orgPath } = usePublicOrg();
  const { data: socialLinks } = useSiteSettings<WebsiteSocialLinksSettings>('website_social_links');

  // Build CSS variable overrides from theme (must be before any returns)
  const themeStyle = useMemo(() => {
    if (!theme?.custom_colors) return undefined;
    const style: Record<string, string> = {};
    const c = theme.custom_colors;
    if (c.primary) style['--primary'] = c.primary;
    if (c.background) style['--background'] = c.background;
    if (c.card) style['--card'] = c.card;
    if (c.foreground) style['--foreground'] = c.foreground;
    if (theme.heading_font) style['--font-display'] = `"${theme.heading_font}", sans-serif`;
    if (theme.body_font) style['--font-sans'] = `"${theme.body_font}", sans-serif`;
    return style;
  }, [theme]);

  const showLogo = theme?.show_logo !== false;

  if (fullWebsiteEnabled) return <>{children}</>;

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ colorScheme: 'light', ...themeStyle } as React.CSSProperties}
    >
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to={orgPath()} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {showLogo && organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-8 w-auto object-contain" />
            ) : (
              <Store className="w-6 h-6 text-primary" />
            )}
            <span className="font-display text-lg font-medium text-foreground">{organization.name}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/50 bg-card/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          {socialLinks && (
            <div className="flex items-center justify-center gap-4">
              {SOCIAL_ICONS.map(({ key, icon: Icon, label }) => {
                const url = socialLinks[key];
                if (!url) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {organization.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
