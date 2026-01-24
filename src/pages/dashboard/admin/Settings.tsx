import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Users, 
  Bell, 
  Shield,
  Loader2,
  Trash2,
  Mail,
  Cog,
  Rocket,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Plug,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Layers,
  LayoutDashboard,
  GripVertical,
  Pencil,
  X,
  Save,
  RotateCcw,
  Building2,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailTemplatesManager } from '@/components/dashboard/EmailTemplatesManager';
import { EmailVariablesManager } from '@/components/dashboard/EmailVariablesManager';
import { SignaturePresetsManager } from '@/components/dashboard/SignaturePresetsManager';
import { OnboardingTasksManager } from '@/components/dashboard/OnboardingTasksManager';
import { LeaderboardWeightsManager } from '@/components/dashboard/LeaderboardWeightsManager';
import { IntegrationsTab } from '@/components/dashboard/IntegrationsTab';
import { StylistLevelsContent } from '@/components/dashboard/settings/StylistLevelsContent';
import { HandbooksContent } from '@/components/dashboard/settings/HandbooksContent';
import { CommandCenterContent } from '@/components/dashboard/settings/CommandCenterContent';
import { BusinessSettingsDialog } from '@/components/dashboard/settings/BusinessSettingsDialog';
import { ScheduleSettingsContent } from '@/components/dashboard/settings/ScheduleSettingsContent';
import { LocationsSettingsContent } from '@/components/dashboard/settings/LocationsSettingsContent';
import { useColorTheme, colorThemes } from '@/hooks/useColorTheme';
import { useRoleUtils } from '@/hooks/useRoleUtils';
import { useSettingsLayout, useUpdateSettingsLayout, DEFAULT_ICON_COLORS, DEFAULT_ORDER } from '@/hooks/useSettingsLayout';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}


type SettingsCategory = 'business' | 'email' | 'users' | 'onboarding' | 'integrations' | 'system' | 'program' | 'levels' | 'handbooks' | 'visibility' | 'schedule' | 'locations' | null;

// Preset colors for icon customization
const PRESET_COLORS = [
  '#8B5CF6', '#7C3AED', '#6366F1', '#4F46E5', // Purples
  '#3B82F6', '#2563EB', '#0EA5E9', '#06B6D4', // Blues
  '#14B8A6', '#10B981', '#22C55E', '#84CC16', // Greens
  '#EAB308', '#F59E0B', '#F97316', '#EF4444', // Warm
  '#EC4899', '#D946EF', '#A855F7', '#6B7280', // Pinks/Gray
];

interface SortableCardProps {
  category: {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  };
  isEditMode: boolean;
  iconColor: string;
  onColorChange: (color: string) => void;
  onClick: () => void;
}

function SortableCard({ category, isEditMode, iconColor, onColorChange, onClick }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = category.icon;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all group relative",
        isDragging && "opacity-50 ring-2 ring-primary",
        !isEditMode && "cursor-pointer hover:border-primary/50"
      )}
      onClick={!isEditMode ? onClick : undefined}
    >
      {isEditMode && (
        <div 
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-muted hover:bg-muted/80 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            {isEditMode && (
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: iconColor }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Icon Color</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "w-7 h-7 rounded-full transition-all hover:scale-110",
                            iconColor === color && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onColorChange(color);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          {!isEditMode && (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="font-display text-lg mb-1">{category.label}</CardTitle>
        <CardDescription>{category.description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// User card component for team members list
function UserCard({ 
  u, 
  updatingUser, 
  updateUserRole, 
  removeUser, 
  currentUserId, 
  dynamicRoleOptions 
}: { 
  u: UserWithRole; 
  updatingUser: string | null; 
  updateUserRole: (userId: string, role: string) => void;
  removeUser: (userId: string) => void;
  currentUserId?: string;
  dynamicRoleOptions: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-display text-sm">
          {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-sans font-medium">{u.full_name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={u.role}
          onValueChange={(value) => updateUserRole(u.user_id, value)}
          disabled={updatingUser === u.user_id}
        >
          <SelectTrigger className="w-32">
            {updatingUser === u.user_id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leadership</SelectLabel>
              {dynamicRoleOptions
                .filter(role => ['super_admin', 'admin', 'manager', 'general_manager', 'assistant_manager'].includes(role.value))
                .map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operations</SelectLabel>
              {dynamicRoleOptions
                .filter(role => ['director_of_operations', 'operations_assistant', 'receptionist', 'front_desk'].includes(role.value))
                .map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stylists</SelectLabel>
              {dynamicRoleOptions
                .filter(role => ['stylist', 'stylist_assistant'].includes(role.value))
                .map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
            </SelectGroup>
            {/* Other roles not in the 3 main categories */}
            {(() => {
              const categorizedRoles = ['super_admin', 'admin', 'manager', 'general_manager', 'assistant_manager', 'director_of_operations', 'operations_assistant', 'receptionist', 'front_desk', 'stylist', 'stylist_assistant'];
              const otherRoles = dynamicRoleOptions.filter(role => !categorizedRoles.includes(role.value));
              if (otherRoles.length === 0) return null;
              return (
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other</SelectLabel>
                  {otherRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })()}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeUser(u.user_id)}
          disabled={u.user_id === currentUserId}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorTheme, setColorTheme, mounted: colorMounted } = useColorTheme();
  const { roleOptions: dynamicRoleOptions, isLoading: rolesLoading } = useRoleUtils();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(null);
  const [mounted, setMounted] = useState(false);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  
  // Layout editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: layoutPrefs } = useSettingsLayout();
  const updateLayout = useUpdateSettingsLayout();
  const [localOrder, setLocalOrder] = useState<string[]>(DEFAULT_ORDER);
  const [localColors, setLocalColors] = useState<Record<string, string>>(DEFAULT_ICON_COLORS);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with stored preferences
  useEffect(() => {
    if (layoutPrefs) {
      setLocalOrder(layoutPrefs.order);
      setLocalColors(layoutPrefs.iconColors);
    }
  }, [layoutPrefs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('employee_profiles')
      .select('user_id, email, full_name')
      .eq('is_active', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      return {
        user_id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        role: userRole?.role || 'stylist',
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);

    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let error;
    if (existingRole) {
      const result = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);
      error = result.error;
    } else {
      const result = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update role.',
      });
    } else {
      setUsers(prev =>
        prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u)
      );
      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole}.`,
      });
    }

    setUpdatingUser(null);
  };

  const removeUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: "You can't remove yourself.",
      });
      return;
    }

    if (!confirm('Are you sure you want to deactivate this user?')) return;

    const { error } = await supabase
      .from('employee_profiles')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (!error) {
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast({
        title: 'User Deactivated',
        description: 'User has been removed from active staff.',
      });
    }
  };

  const categoriesMap: Record<string, { id: string; label: string; description: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
    business: {
      id: 'business',
      label: 'Business',
      description: 'Name, logo, address & EIN',
      icon: Building2,
    },
    email: {
      id: 'email',
      label: 'Email',
      description: 'Templates, variables & signatures',
      icon: Mail,
    },
    users: {
      id: 'users',
      label: 'Users',
      description: 'Team members & roles',
      icon: Users,
    },
    onboarding: {
      id: 'onboarding',
      label: 'Onboarding',
      description: 'Tasks & leaderboard scoring',
      icon: Rocket,
    },
    integrations: {
      id: 'integrations',
      label: 'Integrations',
      description: 'Third-party connections',
      icon: Plug,
    },
    system: {
      id: 'system',
      label: 'System',
      description: 'Appearance, notifications & security',
      icon: Cog,
    },
    program: {
      id: 'program',
      label: 'Program Editor',
      description: 'Client Engine course configuration',
      icon: GraduationCap,
    },
    levels: {
      id: 'levels',
      label: 'Stylist Levels',
      description: 'Experience tiers & pricing',
      icon: Layers,
    },
    handbooks: {
      id: 'handbooks',
      label: 'Handbooks',
      description: 'Team documents & training',
      icon: BookOpen,
    },
    visibility: {
      id: 'visibility',
      label: 'Visibility Console',
      description: 'Control dashboard element visibility by role',
      icon: LayoutDashboard,
    },
    schedule: {
      id: 'schedule',
      label: 'Schedule',
      description: 'Calendar colors & preferences',
      icon: CalendarDays,
    },
    locations: {
      id: 'locations',
      label: 'Locations',
      description: 'Salon addresses, hours & holidays',
      icon: MapPin,
    },
  };

  const orderedCategories = useMemo(() => {
    return localOrder.map(id => categoriesMap[id]).filter(Boolean);
  }, [localOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleColorChange = (categoryId: string, color: string) => {
    setLocalColors(prev => ({ ...prev, [categoryId]: color }));
    setHasChanges(true);
  };

  const handleSaveLayout = () => {
    updateLayout.mutate(
      { order: localOrder, iconColors: localColors },
      {
        onSuccess: () => {
          toast({ title: 'Layout saved', description: 'Your settings layout has been saved.' });
          setIsEditMode(false);
          setHasChanges(false);
        },
        onError: () => {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to save layout.' });
        },
      }
    );
  };

  const handleResetLayout = () => {
    setLocalOrder(DEFAULT_ORDER);
    setLocalColors(DEFAULT_ICON_COLORS);
    setHasChanges(true);
  };

  const handleCancelEdit = () => {
    if (layoutPrefs) {
      setLocalOrder(layoutPrefs.order);
      setLocalColors(layoutPrefs.iconColors);
    }
    setIsEditMode(false);
    setHasChanges(false);
  };

  // If a category is selected, show detailed view
  if (activeCategory) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          {/* Back button and header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => setActiveCategory(null)}
            >
              ← Back to Settings
            </Button>
            <h1 className="font-display text-2xl lg:text-3xl">
              {categoriesMap[activeCategory]?.label.toUpperCase()}
            </h1>
          </div>

          {/* Category Content */}
          {activeCategory === 'email' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">EMAIL TEMPLATES</CardTitle>
                  <CardDescription>Customize email templates for automated notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailTemplatesManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">EMAIL VARIABLES</CardTitle>
                  <CardDescription>Manage available template variables.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailVariablesManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">SIGNATURE PRESETS</CardTitle>
                  <CardDescription>Reusable email signature blocks.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SignaturePresetsManager />
                </CardContent>
              </Card>
            </div>
          )}

          {activeCategory === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">TEAM MEMBERS</CardTitle>
                <CardDescription>Manage team members and their access levels.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No active users found.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Leadership Section */}
                    {(() => {
                      const leadershipUsers = users.filter(u => 
                        ['super_admin', 'admin', 'manager', 'general_manager', 'assistant_manager'].includes(u.role)
                      );
                      if (leadershipUsers.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <Shield className="w-4 h-4 text-primary" />
                            <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Leadership</h3>
                            <span className="text-xs text-muted-foreground">({leadershipUsers.length})</span>
                          </div>
                          {leadershipUsers.map(u => (
                            <UserCard 
                              key={u.user_id} 
                              u={u} 
                              updatingUser={updatingUser}
                              updateUserRole={updateUserRole}
                              removeUser={removeUser}
                              currentUserId={user?.id}
                              dynamicRoleOptions={dynamicRoleOptions}
                            />
                          ))}
                        </div>
                      );
                    })()}

                    {/* Operations Section */}
                    {(() => {
                      const operationsUsers = users.filter(u => 
                        ['director_of_operations', 'operations_assistant', 'receptionist', 'front_desk'].includes(u.role)
                      );
                      if (operationsUsers.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <Cog className="w-4 h-4 text-primary" />
                            <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Operations</h3>
                            <span className="text-xs text-muted-foreground">({operationsUsers.length})</span>
                          </div>
                          {operationsUsers.map(u => (
                            <UserCard 
                              key={u.user_id} 
                              u={u} 
                              updatingUser={updatingUser}
                              updateUserRole={updateUserRole}
                              removeUser={removeUser}
                              currentUserId={user?.id}
                              dynamicRoleOptions={dynamicRoleOptions}
                            />
                          ))}
                        </div>
                      );
                    })()}

                    {/* Stylists Section */}
                    {(() => {
                      const stylistUsers = users.filter(u => 
                        ['stylist', 'stylist_assistant'].includes(u.role)
                      );
                      if (stylistUsers.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <Users className="w-4 h-4 text-primary" />
                            <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Stylists</h3>
                            <span className="text-xs text-muted-foreground">({stylistUsers.length})</span>
                          </div>
                          {stylistUsers.map(u => (
                            <UserCard 
                              key={u.user_id} 
                              u={u} 
                              updatingUser={updatingUser}
                              updateUserRole={updateUserRole}
                              removeUser={removeUser}
                              currentUserId={user?.id}
                              dynamicRoleOptions={dynamicRoleOptions}
                            />
                          ))}
                        </div>
                      );
                    })()}

                    {/* Uncategorized Section */}
                    {(() => {
                      const uncategorizedUsers = users.filter(u => 
                        !['super_admin', 'admin', 'manager', 'general_manager', 'assistant_manager', 'director_of_operations', 'operations_assistant', 'receptionist', 'front_desk', 'stylist', 'stylist_assistant'].includes(u.role)
                      );
                      if (uncategorizedUsers.length === 0) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Other Roles</h3>
                            <span className="text-xs text-muted-foreground">({uncategorizedUsers.length})</span>
                          </div>
                          {uncategorizedUsers.map(u => (
                            <UserCard 
                              key={u.user_id} 
                              u={u} 
                              updatingUser={updatingUser}
                              updateUserRole={updateUserRole}
                              removeUser={removeUser}
                              currentUserId={user?.id}
                              dynamicRoleOptions={dynamicRoleOptions}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeCategory === 'onboarding' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">ONBOARDING TASKS</CardTitle>
                  <CardDescription>Configure onboarding checklist items by role.</CardDescription>
                </CardHeader>
                <CardContent>
                  <OnboardingTasksManager />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">LEADERBOARD SCORING</CardTitle>
                  <CardDescription>Adjust weight distribution for performance metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaderboardWeightsManager />
                </CardContent>
              </Card>
            </div>
          )}

          {activeCategory === 'integrations' && (
            <IntegrationsTab />
          )}

          {activeCategory === 'system' && (
            <div className="space-y-6">
              {/* Appearance */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    <CardTitle className="font-display text-lg">APPEARANCE</CardTitle>
                  </div>
                  <CardDescription>Customize the dashboard appearance. Only affects the backend dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Color Theme Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Color Theme</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {colorThemes.map((themeOption) => {
                        const isSelected = colorMounted && colorTheme === themeOption.id;
                        const isDark = resolvedTheme === 'dark';
                        const preview = isDark ? themeOption.darkPreview : themeOption.lightPreview;
                        
                        return (
                          <button
                            key={themeOption.id}
                            onClick={() => setColorTheme(themeOption.id)}
                            className={cn(
                              "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                              isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-1.5 w-full">
                              <div 
                                className="w-8 h-8 rounded-lg border border-border"
                                style={{ backgroundColor: preview.bg }}
                              />
                              <div 
                                className="w-8 h-8 rounded-lg border border-border"
                                style={{ backgroundColor: preview.accent }}
                              />
                              <div 
                                className="w-8 h-8 rounded-lg border border-border"
                                style={{ backgroundColor: preview.primary }}
                              />
                            </div>
                            
                            <div className="space-y-0.5">
                              <span className="text-sm font-medium">{themeOption.name}</span>
                              <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Theme Mode Toggle */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Theme Mode</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setTheme('light')}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          mounted && theme === 'light'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                          <Sun className="w-5 h-5 text-foreground" />
                        </div>
                        <span className="text-sm font-medium">Light</span>
                        {mounted && theme === 'light' && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setTheme('dark')}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          mounted && theme === 'dark'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-foreground border border-border flex items-center justify-center">
                          <Moon className="w-5 h-5 text-background" />
                        </div>
                        <span className="text-sm font-medium">Dark</span>
                        {mounted && theme === 'dark' && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setTheme('system')}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          mounted && theme === 'system'
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-foreground border border-border flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">System</span>
                        {mounted && theme === 'system' && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="font-display text-lg">NOTIFICATIONS</CardTitle>
                  </div>
                  <CardDescription>Configure email reminders and notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">Daily Check-in Reminders</p>
                      <p className="text-xs text-muted-foreground">Send reminder emails at 10 AM and 9 PM AZ time</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">Weekly Wins Reminders</p>
                      <p className="text-xs text-muted-foreground">Remind stylists to submit weekly wins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">Birthday Reminders</p>
                      <p className="text-xs text-muted-foreground">Email leadership team 3 days before</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <CardTitle className="font-display text-lg">SECURITY</CardTitle>
                  </div>
                  <CardDescription>Security and access settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">Require Email Verification</p>
                      <p className="text-xs text-muted-foreground">New users must verify email</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">Restrict Sign-ups</p>
                      <p className="text-xs text-muted-foreground">Only approved email domains</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeCategory === 'program' && (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  The Program Editor is a complex configuration tool.
                </p>
                <Button onClick={() => window.location.href = '/dashboard/admin/program-editor'}>
                  Open Program Editor
                </Button>
              </div>
            </Card>
          )}

          {activeCategory === 'levels' && <StylistLevelsContent />}

          {activeCategory === 'handbooks' && <HandbooksContent />}

          {activeCategory === 'visibility' && <CommandCenterContent />}

          {activeCategory === 'schedule' && <ScheduleSettingsContent />}

          {activeCategory === 'locations' && <LocationsSettingsContent />}
        </div>
      </DashboardLayout>
    );
  }

  // Main settings grid view
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">SETTINGS</h1>
            <p className="text-muted-foreground font-sans">
              Manage system configuration, users, and communications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetLayout}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={!hasChanges || updateLayout.isPending}
                  className="gap-1.5"
                >
                  {updateLayout.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Layout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="gap-1.5"
              >
                <Pencil className="w-4 h-4" />
                Edit Layout
              </Button>
            )}
          </div>
        </div>

        {isEditMode && (
          <div className="mb-4 p-3 bg-muted/50 border rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
            <GripVertical className="w-4 h-4" />
            <span>Drag cards to reorder. Click the color dot next to each icon to change its color.</span>
          </div>
        )}

        {/* Category Cards Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={localOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orderedCategories.map((category) => (
                <SortableCard
                  key={category.id}
                  category={category}
                  isEditMode={isEditMode}
                  iconColor={localColors[category.id] || DEFAULT_ICON_COLORS[category.id]}
                  onColorChange={(color) => handleColorChange(category.id, color)}
                  onClick={() => {
                    if (category.id === 'business') {
                      setBusinessDialogOpen(true);
                    } else {
                      setActiveCategory(category.id as SettingsCategory);
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Business Settings Dialog */}
        <BusinessSettingsDialog 
          open={businessDialogOpen} 
          onOpenChange={setBusinessDialogOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
