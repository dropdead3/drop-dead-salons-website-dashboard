import { useState, useEffect } from 'react';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useColorTheme, colorThemes } from '@/hooks/useColorTheme';
import { cn } from '@/lib/utils';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'stylist', label: 'Stylist' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'assistant', label: 'Assistant' },
];

type SettingsCategory = 'email' | 'users' | 'onboarding' | 'integrations' | 'system' | 'program' | 'levels' | 'handbooks' | 'visibility' | null;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorTheme, setColorTheme, mounted: colorMounted } = useColorTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(null);
  const [mounted, setMounted] = useState(false);

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

  const categories = [
    {
      id: 'email' as const,
      label: 'Email',
      description: 'Templates, variables & signatures',
      icon: Mail,
    },
    {
      id: 'users' as const,
      label: 'Users',
      description: 'Team members & roles',
      icon: Users,
    },
    {
      id: 'onboarding' as const,
      label: 'Onboarding',
      description: 'Tasks & leaderboard scoring',
      icon: Rocket,
    },
    {
      id: 'integrations' as const,
      label: 'Integrations',
      description: 'Third-party connections',
      icon: Plug,
    },
    {
      id: 'system' as const,
      label: 'System',
      description: 'Appearance, notifications & security',
      icon: Cog,
    },
    {
      id: 'program' as const,
      label: 'Program Editor',
      description: 'Client Engine course configuration',
      icon: GraduationCap,
    },
    {
      id: 'levels' as const,
      label: 'Stylist Levels',
      description: 'Experience tiers & pricing',
      icon: Layers,
    },
    {
      id: 'handbooks' as const,
      label: 'Handbooks',
      description: 'Team documents & training',
      icon: BookOpen,
    },
    {
      id: 'visibility' as const,
      label: 'Visibility Console',
      description: 'Control dashboard element visibility by role',
      icon: LayoutDashboard,
    },
  ];

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
              {categories.find(c => c.id === activeCategory)?.label.toUpperCase()}
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
                  <div className="space-y-3">
                    {users.map(u => (
                      <div key={u.user_id} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border">
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
                            <SelectContent>
                              {roleOptions.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeUser(u.user_id)}
                            disabled={u.user_id === user?.id}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
        </div>
      </DashboardLayout>
    );
  }

  // Main settings grid view
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">SETTINGS</h1>
          <p className="text-muted-foreground font-sans">
            Manage system configuration, users, and communications.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className="cursor-pointer hover:border-primary/50 transition-all group"
                onClick={() => setActiveCategory(category.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="font-display text-lg mb-1">{category.label}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
