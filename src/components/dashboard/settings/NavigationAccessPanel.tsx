import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  EyeOff,
  LayoutDashboard,
  Target,
  Video,
  BarChart3,
  Users,
  FileText,
  Settings,
  Bell,
  CalendarClock,
  Contact,
  Layers,
  Cake,
  AlertTriangle,
  CreditCard,
  Camera,
  Briefcase,
  GraduationCap,
  HandHelping,
  CalendarDays,
  DollarSign,
  Scissors,
  Globe,
  UserPlus,
  Shield,
  Quote,
  Images,
  MapPin,
  Loader2,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarLayout, useUpdateSidebarLayout, DEFAULT_SECTION_ORDER, SECTION_LABELS } from '@/hooks/useSidebarLayout';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface NavigationAccessPanelProps {
  role: AppRole;
  roleColor: string;
}

// Map of link hrefs to their display config
const LINK_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  '/dashboard': { label: 'Command Center', icon: LayoutDashboard },
  '/dashboard/schedule': { label: 'Schedule', icon: CalendarDays },
  '/dashboard/directory': { label: 'Team Directory', icon: Contact },
  '/dashboard/training': { label: 'Training', icon: Video },
  '/dashboard/program': { label: 'New-Client Engine Program', icon: Target },
  '/dashboard/admin/team': { label: 'Program Team Overview', icon: Users },
  '/dashboard/ring-the-bell': { label: 'Ring the Bell', icon: Bell },
  '/dashboard/my-graduation': { label: 'My Graduation', icon: GraduationCap },
  '/dashboard/stats': { label: 'My Stats', icon: BarChart3 },
  '/dashboard/my-clients': { label: 'My Clients', icon: Users },
  '/dashboard/admin/sales': { label: 'Sales Dashboard', icon: DollarSign },
  '/dashboard/admin/operational-analytics': { label: 'Operational Analytics', icon: BarChart3 },
  '/dashboard/assistant-schedule': { label: 'Assistant Schedule', icon: Users },
  '/dashboard/schedule-meeting': { label: 'Schedule 1:1 Meeting', icon: CalendarClock },
  '/dashboard/onboarding': { label: 'Onboarding', icon: Users },
  '/dashboard/handbooks': { label: 'Handbooks', icon: FileText },
  '/dashboard/admin/birthdays': { label: 'Birthdays & Anniversaries', icon: Cake },
  '/dashboard/admin/onboarding-tracker': { label: 'Onboarding Hub', icon: Layers },
  '/dashboard/admin/client-engine-tracker': { label: 'Client Engine Tracker', icon: Target },
  '/dashboard/admin/recruiting': { label: 'Recruiting Pipeline', icon: Briefcase },
  '/dashboard/admin/graduation-tracker': { label: 'Graduation Tracker', icon: GraduationCap },
  '/dashboard/admin/assistant-requests': { label: 'Assistant Requests', icon: HandHelping },
  '/dashboard/admin/strikes': { label: 'Staff Strikes', icon: AlertTriangle },
  '/dashboard/admin/business-cards': { label: 'Business Cards', icon: CreditCard },
  '/dashboard/admin/headshots': { label: 'Headshots', icon: Camera },
  '/dashboard/admin/announcements': { label: 'Create Announcement', icon: Bell },
  '/dashboard/admin/homepage-stylists': { label: 'Homepage Stylists', icon: Globe },
  '/dashboard/admin/testimonials': { label: 'Testimonials', icon: Quote },
  '/dashboard/admin/gallery': { label: 'Gallery', icon: Images },
  '/dashboard/admin/services': { label: 'Services', icon: Scissors },
  '/dashboard/admin/locations': { label: 'Locations', icon: MapPin },
  '/dashboard/admin/accounts': { label: 'Invitations & Approvals', icon: UserPlus },
  '/dashboard/admin/roles': { label: 'Manage Users & Roles', icon: Shield },
  '/dashboard/admin/settings': { label: 'Settings', icon: Settings },
  '/dashboard/admin/feature-flags': { label: 'Feature Flags', icon: Flag },
};

// Default links per section
const DEFAULT_SECTION_LINKS: Record<string, string[]> = {
  home: ['/dashboard', '/dashboard/schedule', '/dashboard/directory'],
  training: ['/dashboard/training', '/dashboard/program', '/dashboard/admin/team'],
  personal: ['/dashboard/ring-the-bell', '/dashboard/my-graduation', '/dashboard/stats', '/dashboard/my-clients'],
  analytics: ['/dashboard/admin/sales', '/dashboard/admin/operational-analytics'],
  assistants: ['/dashboard/assistant-schedule', '/dashboard/schedule-meeting'],
  resources: ['/dashboard/onboarding', '/dashboard/handbooks'],
  leadership: [
    '/dashboard/admin/birthdays',
    '/dashboard/admin/onboarding-tracker',
    '/dashboard/admin/client-engine-tracker',
    '/dashboard/admin/recruiting',
    '/dashboard/admin/graduation-tracker',
    '/dashboard/admin/assistant-requests',
    '/dashboard/admin/strikes',
    '/dashboard/admin/business-cards',
    '/dashboard/admin/headshots',
  ],
  website: [
    '/dashboard/admin/announcements',
    '/dashboard/admin/homepage-stylists',
    '/dashboard/admin/testimonials',
    '/dashboard/admin/gallery',
    '/dashboard/admin/services',
    '/dashboard/admin/locations',
  ],
  admin: [
    '/dashboard/admin/accounts',
    '/dashboard/admin/roles',
    '/dashboard/admin/settings',
    '/dashboard/admin/feature-flags',
  ],
};

export function NavigationAccessPanel({ role, roleColor }: NavigationAccessPanelProps) {
  const { data: layout, isLoading } = useSidebarLayout();
  const updateLayout = useUpdateSidebarLayout();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['home']));
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  // Get role visibility from layout
  const roleVisibility = layout?.roleVisibility?.[role] || { hiddenSections: [], hiddenLinks: {} };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Check if a section is hidden for this role
  const isSectionHidden = (sectionId: string) => {
    return roleVisibility.hiddenSections?.includes(sectionId) || false;
  };

  // Check if a link is hidden for this role
  const isLinkHidden = (sectionId: string, href: string) => {
    const sectionLinks = roleVisibility.hiddenLinks?.[sectionId] || [];
    return sectionLinks.includes(href);
  };

  // Toggle section visibility
  const handleToggleSection = async (sectionId: string) => {
    if (!layout) return;

    const newRoleVisibility = { ...(layout.roleVisibility || {}) };
    const currentRole = newRoleVisibility[role] || { hiddenSections: [], hiddenLinks: {} };
    
    const isCurrentlyHidden = currentRole.hiddenSections?.includes(sectionId);
    
    if (isCurrentlyHidden) {
      currentRole.hiddenSections = (currentRole.hiddenSections || []).filter(s => s !== sectionId);
    } else {
      currentRole.hiddenSections = [...(currentRole.hiddenSections || []), sectionId];
    }

    newRoleVisibility[role] = currentRole;

    await updateLayout.mutateAsync({
      ...layout,
      roleVisibility: newRoleVisibility,
    });
  };

  // Toggle link visibility
  const handleToggleLink = async (sectionId: string, href: string) => {
    if (!layout) return;

    const newRoleVisibility = { ...(layout.roleVisibility || {}) };
    const currentRole = { ...(newRoleVisibility[role] || { hiddenSections: [], hiddenLinks: {} }) };
    const currentLinks = { ...(currentRole.hiddenLinks || {}) };
    
    const sectionLinks = currentLinks[sectionId] || [];
    const isCurrentlyHidden = sectionLinks.includes(href);
    
    if (isCurrentlyHidden) {
      currentLinks[sectionId] = sectionLinks.filter(l => l !== href);
    } else {
      currentLinks[sectionId] = [...sectionLinks, href];
    }

    currentRole.hiddenLinks = currentLinks;
    newRoleVisibility[role] = currentRole;

    await updateLayout.mutateAsync({
      ...layout,
      roleVisibility: newRoleVisibility,
    });
  };

  // Bulk toggle all links in a section
  const handleBulkToggle = async (sectionId: string, showAll: boolean) => {
    if (!layout) return;

    const sectionLinks = DEFAULT_SECTION_LINKS[sectionId] || [];
    
    const newRoleVisibility = { ...(layout.roleVisibility || {}) };
    const currentRole = { ...(newRoleVisibility[role] || { hiddenSections: [], hiddenLinks: {} }) };
    const currentLinks = { ...(currentRole.hiddenLinks || {}) };
    
    if (showAll) {
      // Remove all hidden links for this section
      currentLinks[sectionId] = [];
    } else {
      // Hide all links for this section
      currentLinks[sectionId] = [...sectionLinks];
    }

    currentRole.hiddenLinks = currentLinks;
    newRoleVisibility[role] = currentRole;

    await updateLayout.mutateAsync({
      ...layout,
      roleVisibility: newRoleVisibility,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Control which sidebar navigation sections and links are visible for this role.
      </p>
      
      {DEFAULT_SECTION_ORDER.map((sectionId) => {
        const links = DEFAULT_SECTION_LINKS[sectionId] || [];
        const sectionHidden = isSectionHidden(sectionId);
        const visibleLinks = links.filter(l => !isLinkHidden(sectionId, l));
        const isExpanded = expandedSections.has(sectionId);

        return (
          <Collapsible 
            key={sectionId} 
            open={isExpanded} 
            onOpenChange={() => toggleSection(sectionId)}
          >
            <div className={cn(
              "border rounded-lg overflow-hidden",
              sectionHidden && "opacity-60"
            )}>
              <CollapsibleTrigger asChild>
                <div className={cn(
                  "flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                )}>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!sectionHidden}
                      onCheckedChange={() => handleToggleSection(sectionId)}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className={cn(
                      "font-display text-sm uppercase tracking-wider",
                      sectionHidden && "line-through text-muted-foreground"
                    )}>
                      {SECTION_LABELS[sectionId] || sectionId}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {visibleLinks.length}/{links.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-3 bg-muted/30 border-t space-y-2">
                  {/* Bulk actions */}
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Quick:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => handleBulkToggle(sectionId, true)}
                      disabled={visibleLinks.length === links.length}
                    >
                      <Eye className="w-3 h-3" />
                      Show All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => handleBulkToggle(sectionId, false)}
                      disabled={visibleLinks.length === 0}
                    >
                      <EyeOff className="w-3 h-3" />
                      Hide All
                    </Button>
                  </div>

                  {/* Links */}
                  {links.map((href) => {
                    const config = LINK_CONFIG[href];
                    if (!config) return null;
                    
                    const Icon = config.icon;
                    const isHidden = isLinkHidden(sectionId, href);

                    return (
                      <div
                        key={href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md bg-background/50 border border-border/50",
                          isHidden && "opacity-50"
                        )}
                      >
                        <Switch
                          checked={!isHidden}
                          onCheckedChange={() => handleToggleLink(sectionId, href)}
                          className="data-[state=checked]:bg-primary"
                          style={{ 
                            '--tw-ring-color': roleColor,
                          } as React.CSSProperties}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className={cn(
                          "text-sm flex-1",
                          isHidden && "line-through text-muted-foreground"
                        )}>
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
