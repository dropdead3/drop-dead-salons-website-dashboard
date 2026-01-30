import { useState } from 'react';
import { useAddPlatformRole, type PlatformRole } from '@/hooks/usePlatformRoles';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Shield, Headphones, Code } from 'lucide-react';
import { PlatformButton } from './ui/PlatformButton';
import { PlatformInput } from './ui/PlatformInput';
import { PlatformLabel } from './ui/PlatformLabel';

interface InvitePlatformUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions: { value: PlatformRole; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'platform_admin', label: 'Platform Admin', description: 'Full platform access, user management', icon: Shield },
  { value: 'platform_support', label: 'Platform Support', description: 'View all orgs, perform migrations', icon: Headphones },
  { value: 'platform_developer', label: 'Platform Developer', description: 'View access, testing, debugging', icon: Code },
];

export function InvitePlatformUserDialog({ open, onOpenChange }: InvitePlatformUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('platform_support');
  const [loading, setLoading] = useState(false);
  const addRoleMutation = useAddPlatformRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find user by email in employee_profiles
      const { data: profiles, error: profileError } = await supabase
        .from('employee_profiles')
        .select('user_id, email, full_name')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (profileError) {
        throw new Error('Failed to search for user');
      }

      if (!profiles || profiles.length === 0) {
        toast({
          title: 'User not found',
          description: 'No user found with that email. They must have an account first.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const userId = profiles[0].user_id;

      // Check if user already has this role
      const { data: existingRoles } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', role);

      if (existingRoles && existingRoles.length > 0) {
        toast({
          title: 'Already assigned',
          description: 'This user already has the selected platform role.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Add the platform role
      await addRoleMutation.mutateAsync({ userId, role });

      toast({
        title: 'Team member added',
        description: `${profiles[0].full_name || email} has been granted ${role.replace('platform_', '')} access.`,
      });

      setEmail('');
      setRole('platform_support');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add Platform Team Member</DialogTitle>
          <DialogDescription className="text-slate-400">
            Grant platform access to an existing user. They must already have an account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <PlatformLabel htmlFor="email">Email Address</PlatformLabel>
            <PlatformInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team@company.com"
              required
              autoCapitalize="none"
            />
          </div>

          <div className="space-y-2">
            <PlatformLabel htmlFor="role">Platform Role</PlatformLabel>
            <Select value={role} onValueChange={(v) => setRole(v as PlatformRole)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 focus:ring-violet-500/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem 
                      key={opt.value} 
                      value={opt.value}
                      className="text-slate-300 focus:bg-slate-700 focus:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-violet-400" />
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-slate-500 text-xs ml-2">
                            {opt.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <PlatformButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </PlatformButton>
            <PlatformButton type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Member
            </PlatformButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
