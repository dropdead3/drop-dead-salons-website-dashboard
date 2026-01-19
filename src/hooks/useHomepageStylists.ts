import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageStylist {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
  instagram: string | null;
  tiktok: string | null;
  stylist_level: string | null;
  specialties: string[] | null;
  highlighted_services: string[] | null;
  location_id: string | null;
  is_booking: boolean | null;
  bio: string | null;
}

export function useHomepageStylists() {
  return useQuery({
    queryKey: ['homepage-stylists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, instagram, tiktok, stylist_level, specialties, highlighted_services, location_id, is_booking, bio')
        .eq('is_active', true)
        .eq('homepage_visible', true)
        .order('stylist_level', { ascending: false });

      if (error) throw error;
      return data as HomepageStylist[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// For admin: get stylists requesting homepage visibility
export function useHomepageRequests() {
  return useQuery({
    queryKey: ['homepage-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('homepage_requested', true)
        .eq('homepage_visible', false)
        .order('homepage_requested_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
