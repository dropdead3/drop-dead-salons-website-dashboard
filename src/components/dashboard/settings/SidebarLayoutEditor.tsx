import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Save,
  Loader2,
  LayoutDashboard,
  Target,
  Trophy,
  Video,
  BarChart3,
  Users,
  FileText,
  Settings,
  Bell,
  CalendarClock,
  Contact,
  Globe,
  UserPlus,
  Shield,
  Quote,
  Images,
  Layers,
  MapPin,
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
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  FolderPlus,
} from 'lucide-react';
import {
  useSidebarLayout,
  useUpdateSidebarLayout,
  DEFAULT_SECTION_ORDER,
  DEFAULT_LINK_ORDER,
  SECTION_LABELS,
  isBuiltInSection,
  type SidebarLayoutConfig,
  type CustomSectionConfig,
} from '@/hooks/useSidebarLayout';
import { SidebarPreview } from './SidebarPreview';

// Map hrefs to their labels and icons
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
  '/dashboard/leaderboard': { label: 'Leaderboard', icon: Trophy },
  '/dashboard/admin/sales': { label: 'Sales Dashboard', icon: DollarSign },
  '/dashboard/admin/operational-analytics': { label: 'Operational Analytics', icon: BarChart3 },
  '/dashboard/admin/staff-utilization': { label: 'Staff Utilization', icon: Users },
  '/dashboard/assistant-schedule': { label: 'Assistant Schedule', icon: Users },
  '/dashboard/schedule-meeting': { label: 'Schedule 1:1 Meeting', icon: CalendarClock },
  '/dashboard/onboarding': { label: 'Onboarding', icon: Users },
  '/dashboard/handbooks': { label: 'Handbooks', icon: FileText },
  '/dashboard/admin/birthdays': { label: 'Birthdays & Anniversaries', icon: Cake },
  '/dashboard/admin/onboarding-tracker': { label: 'Onboarding Tracker', icon: Layers },
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
};

// Sortable Link Component
function SortableLink({ 
  href, 
  isHidden,
  onToggleVisibility,
}: { 
  href: string;
  isHidden: boolean;
  onToggleVisibility: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: href });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = LINK_CONFIG[href];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border/50",
        isDragging && "opacity-50 ring-2 ring-primary",
        isHidden && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
      >
        {isHidden ? (
          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </Button>
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className={cn("text-sm flex-1", isHidden && "line-through text-muted-foreground")}>
        {config.label}
      </span>
      {isHidden && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Hidden
        </Badge>
      )}
    </div>
  );
}

// Static Link Display for DragOverlay
function LinkOverlay({ href }: { href: string }) {
  const config = LINK_CONFIG[href];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-primary shadow-lg">
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}

// Sortable Section Component
function SortableSection({
  sectionId,
  sectionName,
  links,
  isExpanded,
  onToggle,
  onLinksReorder,
  isHidden,
  hiddenLinks,
  onToggleSectionVisibility,
  onToggleLinkVisibility,
  isCustom,
  onRename,
  onDelete,
  onMoveLinkToSection,
}: {
  sectionId: string;
  sectionName: string;
  links: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onLinksReorder: (sectionId: string, links: string[]) => void;
  isHidden: boolean;
  hiddenLinks: string[];
  onToggleSectionVisibility: () => void;
  onToggleLinkVisibility: (href: string) => void;
  isCustom: boolean;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  onMoveLinkToSection: (href: string, fromSection: string, toSection: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sectionName);
  const [activeLink, setActiveLink] = useState<string | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLinkDragStart = (event: DragStartEvent) => {
    setActiveLink(event.active.id as string);
  };

  const handleLinkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLink(null);
    
    if (!over || active.id === over.id) return;

    const oldIndex = links.indexOf(active.id as string);
    const newIndex = links.indexOf(over.id as string);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newLinks = arrayMove(links, oldIndex, newIndex);
      onLinksReorder(sectionId, newLinks);
    }
  };

  const handleSaveRename = () => {
    if (editName.trim() && onRename) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(sectionName);
    setIsEditing(false);
  };

  const visibleLinksCount = links.filter(l => !hiddenLinks.includes(l)).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-border rounded-lg overflow-hidden",
        isDragging && "opacity-50 ring-2 ring-primary",
        isHidden && "opacity-60",
        isCustom && "border-primary/30"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 cursor-pointer transition-colors",
            isHidden && "bg-muted/30",
            isCustom && "bg-primary/5"
          )}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSectionVisibility();
                }}
              >
                {isHidden ? (
                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
              
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm font-display uppercase"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename();
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveRename}>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelRename}>
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className={cn(
                    "font-display text-sm uppercase tracking-wider truncate",
                    isHidden && "line-through text-muted-foreground"
                  )}>
                    {sectionName}
                  </span>
                  {isCustom && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary shrink-0">
                      Custom
                    </Badge>
                  )}
                </>
              )}
              
              <Badge variant="secondary" className="text-xs shrink-0">
                {visibleLinksCount}/{links.length}
              </Badge>
              {isHidden && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/50 shrink-0">
                  Hidden
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {isCustom && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 bg-muted/30 border-t border-border space-y-2">
            {links.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No links in this section. Drag links here from other sections.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleLinkDragStart}
                onDragEnd={handleLinkDragEnd}
              >
                <SortableContext items={links} strategy={verticalListSortingStrategy}>
                  {links.map((href) => (
                    <SortableLink 
                      key={href} 
                      href={href}
                      isHidden={hiddenLinks.includes(href)}
                      onToggleVisibility={() => onToggleLinkVisibility(href)}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeLink ? <LinkOverlay href={activeLink} /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function SidebarLayoutEditor() {
  const { data: layout, isLoading } = useSidebarLayout();
  const updateLayout = useUpdateSidebarLayout();

  // Local state for editing
  const [localSectionOrder, setLocalSectionOrder] = useState<string[]>([]);
  const [localLinkOrder, setLocalLinkOrder] = useState<Record<string, string[]>>({});
  const [localHiddenSections, setLocalHiddenSections] = useState<string[]>([]);
  const [localHiddenLinks, setLocalHiddenLinks] = useState<Record<string, string[]>>({});
  const [localCustomSections, setLocalCustomSections] = useState<Record<string, CustomSectionConfig>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Initialize local state when layout loads
  useMemo(() => {
    if (layout && localSectionOrder.length === 0) {
      setLocalSectionOrder(layout.sectionOrder);
      setLocalLinkOrder(layout.linkOrder);
      setLocalHiddenSections(layout.hiddenSections || []);
      setLocalHiddenLinks(layout.hiddenLinks || {});
      setLocalCustomSections(layout.customSections || {});
    }
  }, [layout, localSectionOrder.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get section name (from SECTION_LABELS for built-in, from customSections for custom)
  const getSectionName = (sectionId: string): string => {
    if (isBuiltInSection(sectionId)) {
      return SECTION_LABELS[sectionId] || sectionId;
    }
    return localCustomSections[sectionId]?.name || sectionId;
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSectionOrder.indexOf(active.id as string);
    const newIndex = localSectionOrder.indexOf(over.id as string);
    setLocalSectionOrder(arrayMove(localSectionOrder, oldIndex, newIndex));
    setHasChanges(true);
  };

  const handleLinksReorder = (sectionId: string, newLinks: string[]) => {
    setLocalLinkOrder((prev) => ({
      ...prev,
      [sectionId]: newLinks,
    }));
    setHasChanges(true);
  };

  const handleToggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleToggleSectionVisibility = (sectionId: string) => {
    setLocalHiddenSections((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter(s => s !== sectionId);
      }
      return [...prev, sectionId];
    });
    setHasChanges(true);
  };

  const handleToggleLinkVisibility = (sectionId: string, href: string) => {
    setLocalHiddenLinks((prev) => {
      const sectionLinks = prev[sectionId] || [];
      if (sectionLinks.includes(href)) {
        return {
          ...prev,
          [sectionId]: sectionLinks.filter(l => l !== href),
        };
      }
      return {
        ...prev,
        [sectionId]: [...sectionLinks, href],
      };
    });
    setHasChanges(true);
  };

  const handleAddCustomSection = () => {
    if (!newSectionName.trim()) return;
    
    const sectionId = `custom-${Date.now()}`;
    setLocalCustomSections((prev) => ({
      ...prev,
      [sectionId]: { name: newSectionName.trim() },
    }));
    setLocalSectionOrder((prev) => [...prev, sectionId]);
    setLocalLinkOrder((prev) => ({
      ...prev,
      [sectionId]: [],
    }));
    setNewSectionName('');
    setIsAddingSection(false);
    setHasChanges(true);
    // Auto-expand the new section
    setExpandedSections((prev) => new Set([...prev, sectionId]));
  };

  const handleRenameSection = (sectionId: string, newName: string) => {
    setLocalCustomSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], name: newName },
    }));
    setHasChanges(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    // Move links back to their original sections or hide them
    const linksToRedistribute = localLinkOrder[sectionId] || [];
    
    // Remove section from order
    setLocalSectionOrder((prev) => prev.filter(id => id !== sectionId));
    
    // Remove from custom sections
    setLocalCustomSections((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    
    // Remove link order for this section
    setLocalLinkOrder((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      
      // Return links to their default sections
      linksToRedistribute.forEach((href) => {
        // Find original section for this link
        const originalSection = Object.entries(DEFAULT_LINK_ORDER).find(([, links]) => 
          links.includes(href)
        )?.[0];
        
        if (originalSection && next[originalSection]) {
          if (!next[originalSection].includes(href)) {
            next[originalSection] = [...next[originalSection], href];
          }
        }
      });
      
      return next;
    });
    
    // Remove from hidden sections
    setLocalHiddenSections((prev) => prev.filter(id => id !== sectionId));
    
    // Remove hidden links for this section
    setLocalHiddenLinks((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    
    setHasChanges(true);
  };

  const handleMoveLinkToSection = (href: string, fromSection: string, toSection: string) => {
    if (fromSection === toSection) return;
    
    setLocalLinkOrder((prev) => {
      const next = { ...prev };
      // Remove from source section
      next[fromSection] = (next[fromSection] || []).filter(l => l !== href);
      // Add to target section
      next[toSection] = [...(next[toSection] || []), href];
      return next;
    });
    
    // Also move hidden status
    setLocalHiddenLinks((prev) => {
      const next = { ...prev };
      const wasHidden = (next[fromSection] || []).includes(href);
      if (wasHidden) {
        next[fromSection] = (next[fromSection] || []).filter(l => l !== href);
        next[toSection] = [...(next[toSection] || []), href];
      }
      return next;
    });
    
    setHasChanges(true);
  };

  const handleSave = () => {
    updateLayout.mutate({
      sectionOrder: localSectionOrder,
      linkOrder: localLinkOrder,
      hiddenSections: localHiddenSections,
      hiddenLinks: localHiddenLinks,
      customSections: localCustomSections,
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSectionOrder(DEFAULT_SECTION_ORDER);
    setLocalLinkOrder(DEFAULT_LINK_ORDER);
    setLocalHiddenSections([]);
    setLocalHiddenLinks({});
    setLocalCustomSections({});
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg">SIDEBAR NAVIGATION</CardTitle>
            <CardDescription>
              Drag to reorder sections and links. Click the eye icon to show/hide items. Create custom sections to organize links.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={updateLayout.isPending}
              className="gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateLayout.isPending}
              className="gap-1.5"
            >
              {updateLayout.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Editor
              </p>
              {!isAddingSection ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingSection(true)}
                  className="gap-1.5 text-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Add Section
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section name..."
                    className="h-7 w-32 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustomSection();
                      if (e.key === 'Escape') {
                        setIsAddingSection(false);
                        setNewSectionName('');
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleAddCustomSection}
                    disabled={!newSectionName.trim()}
                  >
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setIsAddingSection(false);
                      setNewSectionName('');
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext items={localSectionOrder} strategy={verticalListSortingStrategy}>
                {localSectionOrder.map((sectionId) => (
                  <SortableSection
                    key={sectionId}
                    sectionId={sectionId}
                    sectionName={getSectionName(sectionId)}
                    links={localLinkOrder[sectionId] || []}
                    isExpanded={expandedSections.has(sectionId)}
                    onToggle={() => handleToggleSection(sectionId)}
                    onLinksReorder={handleLinksReorder}
                    isHidden={localHiddenSections.includes(sectionId)}
                    hiddenLinks={localHiddenLinks[sectionId] || []}
                    onToggleSectionVisibility={() => handleToggleSectionVisibility(sectionId)}
                    onToggleLinkVisibility={(href) => handleToggleLinkVisibility(sectionId, href)}
                    isCustom={!isBuiltInSection(sectionId)}
                    onRename={!isBuiltInSection(sectionId) ? (name) => handleRenameSection(sectionId, name) : undefined}
                    onDelete={!isBuiltInSection(sectionId) ? () => handleDeleteSection(sectionId) : undefined}
                    onMoveLinkToSection={handleMoveLinkToSection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Preview Panel */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Live Preview
            </p>
            <SidebarPreview
              sectionOrder={localSectionOrder}
              linkOrder={localLinkOrder}
              hiddenSections={localHiddenSections}
              hiddenLinks={localHiddenLinks}
              customSections={localCustomSections}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
