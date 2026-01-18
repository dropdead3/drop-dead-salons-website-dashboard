import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { 
  Settings as SettingsIcon, 
  Users, 
  Bell, 
  Shield,
  Loader2,
  Save,
  UserCog,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

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
            Manage users, roles, and system settings.
          </p>
        </div>

        <Accordion type="single" collapsible defaultValue="users" className="space-y-4">
          {/* User Management */}
          <AccordionItem value="users" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span className="font-display text-sm tracking-wide">USER MANAGEMENT</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground font-sans mb-4">
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
                      <Card key={u.user_id} className="p-4">
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

          {/* Program Settings */}
          <AccordionItem value="program" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5" />
                <span className="font-display text-sm tracking-wide">PROGRAM SETTINGS</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-4 space-y-6">
                <p className="text-sm text-muted-foreground font-sans">
                  Configure the 75-day program parameters.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider">Program Duration</Label>
                    <Input type="number" defaultValue={75} disabled />
                    <p className="text-xs text-muted-foreground">Days in the program</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider">Weekly Wins Due Day</Label>
                    <Select defaultValue="5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="0">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">When weekly reports are due</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans font-medium text-sm">Auto-Restart on Miss</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically restart progress if a day is missed
                    </p>
                  </div>
                  <Switch />
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
      </div>
    </DashboardLayout>
  );
}