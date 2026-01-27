import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Settings2, 
  LayoutDashboard, 
  RotateCcw,
  Sparkles,
  Bell,
  BarChart3,
  Calendar,
  CheckSquare,
  Megaphone,
  Target,
  Armchair,
} from 'lucide-react';
import { 
  useDashboardLayout, 
  useResetToDefault, 
  useSaveDashboardLayout,
  DashboardLayout,
} from '@/hooks/useDashboardLayout';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';

interface SectionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'quick_actions', label: 'Quick Actions', icon: <Sparkles className="w-4 h-4" />, description: 'Shortcuts to common tasks' },
  { id: 'command_center', label: 'Command Center', icon: <BarChart3 className="w-4 h-4" />, description: 'Pinned analytics cards' },
  { id: 'quick_stats', label: 'Quick Stats', icon: <LayoutDashboard className="w-4 h-4" />, description: 'Today\'s performance overview' },
  { id: 'schedule_tasks', label: 'Schedule & Tasks', icon: <Calendar className="w-4 h-4" />, description: 'Daily schedule and to-dos' },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" />, description: 'Team updates and news' },
  { id: 'client_engine', label: 'Client Engine', icon: <Target className="w-4 h-4" />, description: 'Drop Dead 75 program' },
  { id: 'widgets', label: 'Widgets', icon: <Armchair className="w-4 h-4" />, description: 'Birthdays, anniversaries, etc.' },
];

const WIDGETS = [
  { id: 'changelog', label: "What's New", icon: <Sparkles className="w-4 h-4" /> },
  { id: 'birthdays', label: 'Team Birthdays', icon: <Bell className="w-4 h-4" /> },
  { id: 'anniversaries', label: 'Work Anniversaries', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'schedule', label: 'My Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 'dayrate', label: 'Day Rate Bookings', icon: <Armchair className="w-4 h-4" /> },
];

interface DashboardCustomizeMenuProps {
  variant?: 'icon' | 'button';
}

export function DashboardCustomizeMenu({ variant = 'icon' }: DashboardCustomizeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { layout, isLoading, roleTemplate } = useDashboardLayout();
  const resetToDefault = useResetToDefault();
  const saveLayout = useSaveDashboardLayout();
  const { can } = usePermission();
  const canManageVisibility = can('manage_visibility_console');

  const handleToggleSection = (sectionId: string) => {
    const sections = layout.sections.includes(sectionId)
      ? layout.sections.filter(s => s !== sectionId)
      : [...layout.sections, sectionId];
    
    saveLayout.mutate({ ...layout, sections });
  };

  const handleToggleWidget = (widgetId: string) => {
    const widgets = layout.widgets.includes(widgetId)
      ? layout.widgets.filter(w => w !== widgetId)
      : [...layout.widgets, widgetId];
    
    saveLayout.mutate({ ...layout, widgets });
  };

  const handleResetToDefault = () => {
    resetToDefault.mutate();
  };

  if (isLoading) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Settings2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Customize
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display tracking-wide flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            CUSTOMIZE DASHBOARD
          </SheetTitle>
          <SheetDescription>
            Toggle sections and widgets to personalize your view
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Sections */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">SECTIONS</h3>
            <div className="space-y-3">
              {SECTIONS.map((section) => (
                <div 
                  key={section.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg transition-colors',
                    layout.sections.includes(section.id) 
                      ? 'bg-muted/50' 
                      : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      {section.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{section.label}</p>
                      {section.description && (
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={layout.sections.includes(section.id)}
                    onCheckedChange={() => handleToggleSection(section.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Widgets */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">WIDGETS</h3>
            <div className="space-y-3">
              {WIDGETS.map((widget) => (
                <div 
                  key={widget.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg transition-colors',
                    layout.widgets.includes(widget.id) 
                      ? 'bg-muted/50' 
                      : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      {widget.icon}
                    </div>
                    <p className="text-sm font-medium">{widget.label}</p>
                  </div>
                  <Switch
                    checked={layout.widgets.includes(widget.id)}
                    onCheckedChange={() => handleToggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleResetToDefault}
              disabled={resetToDefault.isPending}
            >
              <RotateCcw className="w-4 h-4" />
              {resetToDefault.isPending ? 'Resetting...' : 'Reset to Default'}
            </Button>

            {canManageVisibility && (
              <Button 
                variant="ghost" 
                className="w-full gap-2 text-muted-foreground"
                asChild
              >
                <Link to="/dashboard/admin/visibility" onClick={() => setIsOpen(false)}>
                  <Settings2 className="w-4 h-4" />
                  Open Visibility Console
                </Link>
              </Button>
            )}
          </div>

          {/* Template Info */}
          {roleTemplate && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              Default template: {roleTemplate.display_name}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
