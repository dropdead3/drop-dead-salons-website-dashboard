import { ReactNode } from 'react';
import { usePublicOrg } from '@/contexts/PublicOrgContext';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';

interface ShopLayoutProps {
  children: ReactNode;
  fullWebsiteEnabled?: boolean;
}

/**
 * Minimal standalone layout for the shop page when the full website is not enabled.
 * When fullWebsiteEnabled is true, the shop renders inside the full Layout via the parent page.
 */
export function ShopLayout({ children, fullWebsiteEnabled }: ShopLayoutProps) {
  const { organization, orgPath } = usePublicOrg();

  // If full website is enabled, just render children — the parent Shop page wraps with Layout
  if (fullWebsiteEnabled) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ colorScheme: 'light' }}>
      {/* Minimal header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to={orgPath()} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-8 w-auto object-contain" />
            ) : (
              <Store className="w-6 h-6 text-primary" />
            )}
            <span className="font-display text-lg font-semibold text-foreground">{organization.name}</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/50 bg-card/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {organization.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
