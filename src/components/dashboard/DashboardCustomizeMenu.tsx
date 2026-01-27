import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
  DollarSign,
  Trophy,
  PieChart,
  Users,
  TrendingUp,
  Gauge,
  UserPlus,
  LineChart,
  Briefcase,
  CalendarPlus,
} from 'lucide-react';
import { 
  useDashboardLayout, 
  useResetToDefault, 
  useSaveDashboardLayout,
} from '@/hooks/useDashboardLayout';
import { Link } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  arrayMove 
} from '@dnd-kit/sortable';
import { SortableSectionItem } from './SortableSectionItem';
import { SortableWidgetItem } from './SortableWidgetItem';
import { SortablePinnedCardItem } from './SortablePinnedCardItem';
import { useDashboardVisibility, useToggleDashboardVisibility } from '@/hooks/useDashboardVisibility';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface RoleContext {
  isLeadership: boolean;
  hasStylistRole: boolean;
  isFrontDesk: boolean;
  isReceptionist: boolean;
}

interface SectionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  isVisible?: (ctx: RoleContext) => boolean;
}

const getSections = (): SectionConfig[] => [
  { 
    id: 'quick_actions', 
    label: 'Quick Actions', 
    icon: <Sparkles className="w-4 h-4" />, 
    description: 'Shortcuts to common tasks',
    isVisible: (ctx) => ctx.hasStylistRole || !ctx.isLeadership,
  },
  { 
    id: 'command_center', 
    label: 'Command Center', 
    icon: <BarChart3 className="w-4 h-4" />, 
    description: 'Pinned analytics cards',
    isVisible: (ctx) => ctx.isLeadership,
  },
  { 
    id: 'operations_stats', 
    label: 'Operations Stats', 
    icon: <LayoutDashboard className="w-4 h-4" />, 
    description: 'Today\'s operations overview',
    isVisible: (ctx) => ctx.isReceptionist || ctx.isLeadership,
  },
  { 
    id: 'todays_queue', 
    label: "Today's Queue", 
    icon: <Calendar className="w-4 h-4" />, 
    description: 'Appointment queue',
    isVisible: (ctx) => ctx.isFrontDesk,
  },
  { 
    id: 'quick_stats', 
    label: 'Quick Stats', 
    icon: <LayoutDashboard className="w-4 h-4" />, 
    description: 'Today\'s performance overview',
    isVisible: (ctx) => ctx.hasStylistRole,
  },
  { 
    id: 'schedule_tasks', 
    label: 'Schedule & Tasks', 
    icon: <Calendar className="w-4 h-4" />, 
    description: 'Daily schedule and to-dos',
  },
  { 
    id: 'announcements', 
    label: 'Announcements', 
    icon: <Megaphone className="w-4 h-4" />, 
    description: 'Team updates and news',
  },
  { 
    id: 'client_engine', 
    label: 'Client Engine', 
    icon: <Target className="w-4 h-4" />, 
    description: 'Drop Dead 75 program',
    isVisible: (ctx) => ctx.hasStylistRole,
  },
  { 
    id: 'widgets', 
    label: 'Widgets', 
    icon: <Armchair className="w-4 h-4" />, 
    description: 'Birthdays, anniversaries, etc.',
  },
];

const WIDGETS = [
  { id: 'changelog', label: "What's New", icon: <Sparkles className="w-4 h-4" /> },
  { id: 'birthdays', label: 'Team Birthdays', icon: <Bell className="w-4 h-4" /> },
  { id: 'anniversaries', label: 'Work Anniversaries', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'schedule', label: 'My Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 'dayrate', label: 'Day Rate Bookings', icon: <Armchair className="w-4 h-4" /> },
];

// All analytics cards that can be pinned to Command Center
const PINNABLE_CARDS = [
  { id: 'sales_dashboard_bento', label: 'Sales Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'sales_overview', label: 'Sales Overview', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'top_performers', label: 'Top Performers', icon: <Trophy className="w-4 h-4" /> },
  { id: 'revenue_breakdown', label: 'Revenue Breakdown', icon: <PieChart className="w-4 h-4" /> },
  { id: 'client_funnel', label: 'Client Funnel', icon: <Users className="w-4 h-4" /> },
  { id: 'team_goals', label: 'Team Goals', icon: <Target className="w-4 h-4" /> },
  { id: 'new_bookings', label: 'New Bookings', icon: <CalendarPlus className="w-4 h-4" /> },
  { id: 'week_ahead_forecast', label: 'Week Ahead Forecast', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'capacity_utilization', label: 'Capacity Utilization', icon: <Gauge className="w-4 h-4" /> },
  { id: 'hiring_capacity', label: 'Hiring Capacity', icon: <UserPlus className="w-4 h-4" /> },
  { id: 'staffing_trends', label: 'Staffing Trends', icon: <LineChart className="w-4 h-4" /> },
  { id: 'stylist_workload', label: 'Stylist Workload', icon: <Briefcase className="w-4 h-4" /> },
];

interface DashboardCustomizeMenuProps {
  variant?: 'icon' | 'button';
  roleContext?: RoleContext;
}

export function DashboardCustomizeMenu({ variant = 'icon', roleContext }: DashboardCustomizeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get sections filtered by role
  const SECTIONS = useMemo(() => {
    const allSections = getSections();
    if (!roleContext) return allSections;
    return allSections.filter(section => {
      if (!section.isVisible) return true;
      return section.isVisible(roleContext);
    });
  }, [roleContext]);
  const { layout, isLoading, roleTemplate } = useDashboardLayout();
  const resetToDefault = useResetToDefault();
  const saveLayout = useSaveDashboardLayout();
  const { can } = usePermission();
  const canManageVisibility = can('manage_visibility_console');
  
  // Visibility data for pinned analytics
  const { data: visibilityData, isLoading: isLoadingVisibility } = useDashboardVisibility();
  const toggleVisibility = useToggleDashboardVisibility();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Compute ordered sections - use sectionOrder if available, otherwise derive from sections
  const orderedSections = useMemo(() => {
    const savedOrder = layout.sectionOrder || layout.sections || [];
    const allIds = SECTIONS.map(s => s.id);
    
    // Start with saved order (for sections that exist in SECTIONS)
    const fromSavedOrder = savedOrder.filter(id => allIds.includes(id));
    
    // Add any new sections not in saved order
    const notInOrder = allIds.filter(id => !savedOrder.includes(id));
    
    return [...fromSavedOrder, ...notInOrder];
  }, [layout.sectionOrder, layout.sections, SECTIONS]);

  // Compute ordered widgets
  const orderedWidgets = useMemo(() => {
    const savedOrder = layout.widgets || [];
    const allIds = WIDGETS.map(w => w.id);
    
    // Enabled widgets in saved order
    const enabled = savedOrder.filter(id => allIds.includes(id));
    
    // Disabled widgets
    const disabled = allIds.filter(id => !enabled.includes(id));
    
    return [...enabled, ...disabled];
  }, [layout.widgets]);
  
  // Check if a card is pinned (visible for all leadership roles)
  const leadershipRoles: AppRole[] = ['super_admin', 'admin', 'manager'];
  
  const isCardPinned = (cardId: string): boolean => {
    if (!visibilityData) return false;
    return leadershipRoles.every(role => 
      visibilityData.find(v => v.element_key === cardId && v.role === role)?.is_visible ?? false
    );
  };
  
  // Compute ordered pinned cards
  const orderedPinnedCards = useMemo(() => {
    const savedOrder = layout.pinnedCards || [];
    const allIds = PINNABLE_CARDS.map(c => c.id);
    
    // Get pinned cards
    const pinnedIds = allIds.filter(id => isCardPinned(id));
    
    // Order pinned cards by saved order, then add any not in order
    const fromSavedOrder = savedOrder.filter(id => pinnedIds.includes(id));
    const notInOrder = pinnedIds.filter(id => !savedOrder.includes(id));
    
    // Add unpinned cards at the end
    const unpinnedIds = allIds.filter(id => !pinnedIds.includes(id));
    
    return [...fromSavedOrder, ...notInOrder, ...unpinnedIds];
  }, [layout.pinnedCards, visibilityData]);
  
  // Check if there are any pinned cards
  const hasPinnedCards = useMemo(() => {
    return PINNABLE_CARDS.some(card => isCardPinned(card.id));
  }, [visibilityData]);

  const handleToggleSection = (sectionId: string) => {
    const sections = layout.sections.includes(sectionId)
      ? layout.sections.filter(s => s !== sectionId)
      : [...layout.sections, sectionId];
    
    // Preserve current order (don't remove from sectionOrder)
    saveLayout.mutate({ ...layout, sections, sectionOrder: orderedSections });
  };

  const handleToggleWidget = (widgetId: string) => {
    const widgets = layout.widgets.includes(widgetId)
      ? layout.widgets.filter(w => w !== widgetId)
      : [...layout.widgets, widgetId];
    
    saveLayout.mutate({ ...layout, widgets });
  };
  
  const handleTogglePinnedCard = async (cardId: string) => {
    const isPinned = isCardPinned(cardId);
    const newIsVisible = !isPinned;
    
    // Toggle visibility for all leadership roles
    for (const role of leadershipRoles) {
      await toggleVisibility.mutateAsync({
        elementKey: cardId,
        role,
        isVisible: newIsVisible,
      });
    }
    
    // Update pinnedCards order if pinning
    if (newIsVisible) {
      const newPinnedCards = [...(layout.pinnedCards || []), cardId];
      saveLayout.mutate({ ...layout, pinnedCards: newPinnedCards });
    } else {
      // Remove from pinnedCards order
      const newPinnedCards = (layout.pinnedCards || []).filter(id => id !== cardId);
      saveLayout.mutate({ ...layout, pinnedCards: newPinnedCards });
    }
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = orderedSections.indexOf(active.id as string);
    const newIndex = orderedSections.indexOf(over.id as string);
    const newOrder = arrayMove(orderedSections, oldIndex, newIndex);
    
    // Save full order AND enabled sections
    const enabledSections = newOrder.filter(id => layout.sections.includes(id));
    saveLayout.mutate({ ...layout, sections: enabledSections, sectionOrder: newOrder });
  };

  const handleWidgetDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = orderedWidgets.indexOf(active.id as string);
    const newIndex = orderedWidgets.indexOf(over.id as string);
    const newOrder = arrayMove(orderedWidgets, oldIndex, newIndex);
    
    // Keep only enabled widgets in the layout, but respect new order
    const enabledWidgets = newOrder.filter(id => layout.widgets.includes(id));
    saveLayout.mutate({ ...layout, widgets: enabledWidgets });
  };
  
  const handlePinnedCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Only allow reordering pinned cards
    const pinnedIds = orderedPinnedCards.filter(id => isCardPinned(id));
    if (!pinnedIds.includes(active.id as string) || !pinnedIds.includes(over.id as string)) return;
    
    const oldIndex = pinnedIds.indexOf(active.id as string);
    const newIndex = pinnedIds.indexOf(over.id as string);
    const newOrder = arrayMove(pinnedIds, oldIndex, newIndex);
    
    saveLayout.mutate({ ...layout, pinnedCards: newOrder });
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
            Drag to reorder, toggle to show/hide sections
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Sections */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">SECTIONS</h3>
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext 
                items={orderedSections} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {orderedSections.map(sectionId => {
                    const section = SECTIONS.find(s => s.id === sectionId);
                    if (!section) return null;
                    return (
                      <SortableSectionItem
                        key={section.id}
                        id={section.id}
                        label={section.label}
                        description={section.description}
                        icon={section.icon}
                        isEnabled={layout.sections.includes(section.id)}
                        onToggle={() => handleToggleSection(section.id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Separator />

          {/* Widgets */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">WIDGETS</h3>
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleWidgetDragEnd}
            >
              <SortableContext 
                items={orderedWidgets} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {orderedWidgets.map(widgetId => {
                    const widget = WIDGETS.find(w => w.id === widgetId);
                    if (!widget) return null;
                    return (
                      <SortableWidgetItem
                        key={widget.id}
                        id={widget.id}
                        label={widget.label}
                        icon={widget.icon}
                        isEnabled={layout.widgets.includes(widget.id)}
                        onToggle={() => handleToggleWidget(widget.id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Separator />

          {/* Pinned Analytics Section - Leadership only */}
          {roleContext?.isLeadership && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">PINNED ANALYTICS</h3>
                {!isLoadingVisibility && (
                  <>
                    {hasPinnedCards ? (
                      <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handlePinnedCardDragEnd}
                      >
                        <SortableContext 
                          items={orderedPinnedCards} 
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1 mb-4">
                            {orderedPinnedCards.map(cardId => {
                              const card = PINNABLE_CARDS.find(c => c.id === cardId);
                              if (!card) return null;
                              const isPinned = isCardPinned(cardId);
                              return (
                                <SortablePinnedCardItem
                                  key={card.id}
                                  id={card.id}
                                  label={card.label}
                                  icon={card.icon}
                                  isPinned={isPinned}
                                  onToggle={() => handleTogglePinnedCard(card.id)}
                                  isLoading={toggleVisibility.isPending}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-4">
                        No analytics cards pinned yet. Pin cards from the Analytics Hub.
                      </p>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" className="w-full gap-2" asChild>
                  <Link to="/dashboard/admin/analytics" onClick={() => setIsOpen(false)}>
                    <BarChart3 className="w-4 h-4" />
                    {hasPinnedCards ? 'Pin More Cards' : 'Open Analytics Hub'}
                  </Link>
                </Button>
              </div>

              <Separator />
            </>
          )}

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
