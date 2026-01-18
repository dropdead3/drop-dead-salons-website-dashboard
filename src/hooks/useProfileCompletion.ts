import { useMemo } from 'react';
import { useEmployeeProfile } from './useEmployeeProfile';
import { useAuth } from '@/contexts/AuthContext';

export function useProfileCompletion() {
  const { roles } = useAuth();
  const { data: profile, isLoading } = useEmployeeProfile();

  const { percentage, missingCount } = useMemo(() => {
    if (!profile) return { percentage: 0, missingCount: 0 };

    const isStylist = roles.includes('stylist');
    
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
  }, [profile, roles]);

  return { percentage, missingCount, isLoading };
}
