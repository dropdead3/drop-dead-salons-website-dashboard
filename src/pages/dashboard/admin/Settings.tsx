import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Users, 
  Bell, 
  Shield,
  Loader2,
  Save,
  UserCog,
  Trash2,
  Mail,
  Variable,
  PenTool,
  FileText,
  Cog,
  ClipboardCheck,
  Trophy,
  Rocket,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailTemplatesManager } from '@/components/dashboard/EmailTemplatesManager';
import { EmailVariablesManager } from '@/components/dashboard/EmailVariablesManager';
import { SignaturePresetsManager } from '@/components/dashboard/SignaturePresetsManager';
import { OnboardingTasksManager } from '@/components/dashboard/OnboardingTasksManager';
import { LeaderboardWeightsManager } from '@/components/dashboard/LeaderboardWeightsManager';
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

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('email');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Get all employee profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('employee_profiles')
      .select('user_id, email, full_name')
      .eq('is_active', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Get all roles
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

    // Check if user has a role entry
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let error;
    if (existingRole) {
      // Update existing role
      const result = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);
      error = result.error;
    } else {
      // Insert new role
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

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2">
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Onboarding</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Cog className="w-4 h-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          {/* Email Category */}
          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl tracking-wide">EMAIL SETTINGS</h2>
            </div>
            
            <Accordion type="single" collapsible defaultValue="email-templates" className="space-y-4">
              {/* Email Templates */}
              <AccordionItem value="email-templates" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">EMAIL TEMPLATES</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <EmailTemplatesManager />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Email Variables */}
              <AccordionItem value="email-variables" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Variable className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">EMAIL VARIABLES</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground font-sans mb-4">
                      Manage available template variables. New variables will automatically appear in the email editor.
                    </p>
                    <EmailVariablesManager />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Signature Presets */}
              <AccordionItem value="signature-presets" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <PenTool className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">SIGNATURE PRESETS</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <SignaturePresetsManager />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Users Category */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl tracking-wide">USER MANAGEMENT</h2>
            </div>

            <Accordion type="single" collapsible defaultValue="team-members" className="space-y-4">
              {/* Team Members */}
              <AccordionItem value="team-members" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">TEAM MEMBERS</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground font-sans mb-6">
                      Manage team members and their access levels.
                    </p>

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
                          <Card key={u.user_id} className="p-4 bg-muted/30">
                            <div className="flex items-center justify-between gap-4">
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
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </TabsContent>

          {/* Onboarding Category */}
          <TabsContent value="onboarding" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl tracking-wide">ONBOARDING SETTINGS</h2>
            </div>

            <Accordion type="single" collapsible defaultValue="onboarding-tasks" className="space-y-4">
              {/* Onboarding Tasks */}
              <AccordionItem value="onboarding-tasks" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">ONBOARDING TASKS</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground font-sans mb-4">
                      Configure onboarding checklist items. Tasks are shown based on user roles.
                    </p>
                    <OnboardingTasksManager />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Leaderboard Weights */}
              <AccordionItem value="leaderboard-weights" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">LEADERBOARD SCORING</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <LeaderboardWeightsManager />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* System Category */}
          <TabsContent value="system" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Cog className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl tracking-wide">SYSTEM SETTINGS</h2>
            </div>

            <Accordion type="single" collapsible defaultValue="appearance" className="space-y-4">
              {/* Appearance Settings */}
              <AccordionItem value="appearance" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">APPEARANCE</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 space-y-6">
                    <p className="text-sm text-muted-foreground font-sans">
                      Customize the dashboard appearance. These settings only affect the backend dashboard, not the public website.
                    </p>

                    {/* Theme Mode Toggle */}
                    <div className="space-y-3">
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
                          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                            <Sun className="w-5 h-5 text-amber-600" />
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
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                            <Moon className="w-5 h-5 text-slate-300" />
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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-50 to-slate-900 border border-border flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium">System</span>
                          {mounted && theme === 'system' && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Theme Info */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Theme preferences are saved to your browser and will persist across sessions. 
                        The public-facing website always uses the light theme.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Notification Settings */}
              <AccordionItem value="notifications" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">NOTIFICATIONS</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 space-y-6">
                    <p className="text-sm text-muted-foreground font-sans">
                      Configure email reminders and notifications.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-sans font-medium text-sm">Daily Check-in Reminders</p>
                          <p className="text-xs text-muted-foreground">
                            Send reminder emails at 10 AM and 9 PM AZ time
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-sans font-medium text-sm">Weekly Wins Reminders</p>
                          <p className="text-xs text-muted-foreground">
                            Remind stylists to submit weekly wins
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-sans font-medium text-sm">Birthday Reminders (3 days before)</p>
                          <p className="text-xs text-muted-foreground">
                            Email leadership team about upcoming birthdays
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-sans font-medium text-sm">Ring the Bell Notifications</p>
                          <p className="text-xs text-muted-foreground">
                            Email coaches when someone rings the bell
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Security */}
              <AccordionItem value="security" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span className="font-display text-sm tracking-wide">SECURITY</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-4 space-y-6">
                    <p className="text-sm text-muted-foreground font-sans">
                      Security and access settings.
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-sans font-medium text-sm">Require Email Verification</p>
                        <p className="text-xs text-muted-foreground">
                          New users must verify email before accessing dashboard
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-sans font-medium text-sm">Restrict Sign-ups</p>
                        <p className="text-xs text-muted-foreground">
                          Only allow sign-ups from approved email domains
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
