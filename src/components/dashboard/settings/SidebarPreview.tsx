import { cn } from '@/lib/utils';
import { SECTION_LABELS, isBuiltInSection, type CustomSectionConfig } from '@/hooks/useSidebarLayout';

// Map hrefs to their labels and icons for the preview
const LINK_CONFIG: Record<string, { label: string }> = {
  '/dashboard': { label: 'Command Center' },
  '/dashboard/schedule': { label: 'Schedule' },
  '/dashboard/directory': { label: 'Team Directory' },
  '/dashboard/training': { label: 'Training' },
  '/dashboard/program': { label: 'New-Client Engine Program' },
  '/dashboard/admin/team': { label: 'Program Team Overview' },
  '/dashboard/ring-the-bell': { label: 'Ring the Bell' },
  '/dashboard/my-graduation': { label: 'My Graduation' },
  '/dashboard/stats': { label: 'My Stats' },
  '/dashboard/my-clients': { label: 'My Clients' },
  '/dashboard/admin/sales': { label: 'Sales Dashboard' },
  '/dashboard/admin/operational-analytics': { label: 'Operational Analytics' },
  
  '/dashboard/assistant-schedule': { label: 'Assistant Schedule' },
  '/dashboard/schedule-meeting': { label: 'Schedule 1:1 Meeting' },
  '/dashboard/onboarding': { label: 'Onboarding' },
  '/dashboard/handbooks': { label: 'Handbooks' },
  '/dashboard/admin/birthdays': { label: 'Birthdays & Anniversaries' },
  '/dashboard/admin/onboarding-tracker': { label: 'Onboarding Hub' },
  '/dashboard/admin/client-engine-tracker': { label: 'Client Engine Tracker' },
  '/dashboard/admin/recruiting': { label: 'Recruiting Pipeline' },
  '/dashboard/admin/graduation-tracker': { label: 'Graduation Tracker' },
  '/dashboard/admin/assistant-requests': { label: 'Assistant Requests' },
  '/dashboard/admin/strikes': { label: 'Staff Strikes' },
  '/dashboard/admin/business-cards': { label: 'Business Cards' },
  '/dashboard/admin/headshots': { label: 'Headshots' },
  '/dashboard/admin/announcements': { label: 'Create Announcement' },
  '/dashboard/admin/homepage-stylists': { label: 'Homepage Stylists' },
  '/dashboard/admin/testimonials': { label: 'Testimonials' },
  '/dashboard/admin/gallery': { label: 'Gallery' },
  '/dashboard/admin/services': { label: 'Services' },
  '/dashboard/admin/locations': { label: 'Locations' },
  '/dashboard/admin/accounts': { label: 'Invitations & Approvals' },
  '/dashboard/admin/roles': { label: 'Manage Users & Roles' },
  '/dashboard/admin/settings': { label: 'Settings' },
};

interface SidebarPreviewProps {
  sectionOrder: string[];
  linkOrder: Record<string, string[]>;
  hiddenSections: string[];
  hiddenLinks: Record<string, string[]>;
  customSections: Record<string, CustomSectionConfig>;
}

export function SidebarPreview({
  sectionOrder,
  linkOrder,
  hiddenSections,
  hiddenLinks,
  customSections,
}: SidebarPreviewProps) {
  // Filter out hidden sections
  const visibleSections = sectionOrder.filter(s => !hiddenSections.includes(s));

  // Get section name
  const getSectionName = (sectionId: string): string => {
    if (isBuiltInSection(sectionId)) {
      return SECTION_LABELS[sectionId] || sectionId;
    }
    return customSections[sectionId]?.name || sectionId;
  };

  return (
    <div className="border rounded-lg bg-sidebar h-[500px] overflow-y-auto">
      {/* Logo area */}
      <div className="p-4 border-b border-border">
        <span className="font-display text-sm uppercase tracking-wider text-foreground">
          DROP DEAD
        </span>
        <p className="text-xs text-muted-foreground mt-1">Staff Dashboard</p>
      </div>

      {/* Navigation preview */}
      <div className="py-3">
        {visibleSections.map((sectionId, index) => {
          const links = linkOrder[sectionId] || [];
          const sectionHiddenLinks = hiddenLinks[sectionId] || [];
          const visibleLinks = links.filter(href => !sectionHiddenLinks.includes(href));

          if (visibleLinks.length === 0) return null;

          const isCustom = !isBuiltInSection(sectionId);

          return (
            <div key={sectionId}>
              {/* Divider for all sections except the first */}
              {index > 0 && (
                <div className="px-3 my-3">
                  <div className="h-px bg-border" />
                </div>
              )}
              
              {/* Section label - skip for 'main' to match actual sidebar */}
              {sectionId !== 'main' && (
                <p className={cn(
                  "px-3 mb-1.5 text-[10px] uppercase tracking-wider font-display font-medium",
                  isCustom ? "text-primary" : "text-foreground"
                )}>
                  {getSectionName(sectionId)}
                </p>
              )}
              
              {/* Links */}
              {visibleLinks.map((href) => {
                const config = LINK_CONFIG[href];
                if (!config) return null;
                
                return (
                  <div
                    key={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground",
                      "hover:bg-muted/50 transition-colors cursor-default"
                    )}
                  >
                    <div className="w-3 h-3 rounded bg-muted" />
                    <span className="truncate">{config.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
