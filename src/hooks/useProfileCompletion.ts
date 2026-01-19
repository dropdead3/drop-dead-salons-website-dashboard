import { useMemo } from 'react';
import { useEmployeeProfile } from './useEmployeeProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveUserId } from './useEffectiveUser';
import { useUserRoles } from './useAdminProfile';
import { useViewAs } from '@/contexts/ViewAsContext';

export function useProfileCompletion() {
  const { roles: actualRoles } = useAuth();
  const { isViewingAsUser, viewAsRole } = useViewAs();
  const effectiveUserId = useEffectiveUserId();
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile();
  
  // Fetch the impersonated user's roles when viewing as a specific user
  const { data: impersonatedRoles, isLoading: rolesLoading } = useUserRoles(
    isViewingAsUser ? effectiveUserId : undefined
  );

  // Determine effective roles: impersonated user's roles, viewAs role, or actual roles
  const effectiveRoles = useMemo(() => {
    if (isViewingAsUser && impersonatedRoles) {
      return impersonatedRoles;
    }
    if (viewAsRole) {
      return [viewAsRole];
    }
    return actualRoles;
  }, [isViewingAsUser, impersonatedRoles, viewAsRole, actualRoles]);

  const { percentage, missingCount } = useMemo(() => {
    if (!profile) return { percentage: 0, missingCount: 0 };

    const isStylist = effectiveRoles.includes('stylist');
    
    const fields = [
      { filled: !!profile.photo_url },
      { filled: !!profile.full_name },
      { filled: !!profile.display_name },
      { filled: !!profile.email },
      { filled: !!profile.phone },
      { filled: !!profile.instagram },
      { filled: (profile.location_ids?.length || 0) > 0 || !!profile.location_id },
      { filled: !!profile.emergency_contact },
      { filled: !!profile.emergency_phone },
    ];

    if (isStylist) {
      fields.push(
        { filled: !!profile.stylist_level },
        { filled: (profile.specialties?.length || 0) > 0 }
      );
    }

    const filledCount = fields.filter(f => f.filled).length;
    const percentage = Math.round((filledCount / fields.length) * 100);
    const missingCount = fields.length - filledCount;

    return { percentage, missingCount };
  }, [profile, effectiveRoles]);

  return { percentage, missingCount, isLoading: profileLoading || rolesLoading };
}
