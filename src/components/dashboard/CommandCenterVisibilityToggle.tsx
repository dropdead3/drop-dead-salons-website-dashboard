import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useDashboardVisibility, useToggleDashboardVisibility } from '@/hooks/useDashboardVisibility';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface CommandCenterVisibilityToggleProps {
  elementKey: string;
  elementName: string;
}

export function CommandCenterVisibilityToggle({ 
  elementKey, 
  elementName 
}: CommandCenterVisibilityToggleProps) {
  const { data: profile } = useEmployeeProfile();
  const isSuperAdmin = profile?.is_super_admin;
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: visibilityData, isLoading } = useDashboardVisibility();
  const toggleMutation = useToggleDashboardVisibility();

  // Only show for Super Admins
  if (!isSuperAdmin) return null;

  // Get current visibility settings for this element
  const elementVisibility = visibilityData?.filter(
    v => v.element_key === elementKey
  ) || [];

  // Get leadership roles visibility
  const leadershipRoles: AppRole[] = ['super_admin', 'admin', 'manager'];
  const isVisibleToLeadership = leadershipRoles.every(role => 
    elementVisibility.find(v => v.role === role)?.is_visible ?? false
  );

  const handleToggle = async (checked: boolean) => {
    // Toggle visibility for all leadership roles
    for (const role of leadershipRoles) {
      await toggleMutation.mutateAsync({
        elementKey,
        role,
        isVisible: checked,
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Page Settings</h4>
            <p className="text-xs text-muted-foreground">
              Configure visibility on Command Center
            </p>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isVisibleToLeadership ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="visibility-toggle" className="text-sm">
                Show on Command Center
              </Label>
            </div>
            {isLoading || toggleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Switch
                id="visibility-toggle"
                checked={isVisibleToLeadership}
                onCheckedChange={handleToggle}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            When enabled, the {elementName} card will appear on the Command Center dashboard for leadership roles.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
