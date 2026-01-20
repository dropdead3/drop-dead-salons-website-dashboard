import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HighFive {
  id: string;
  entry_id: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  user_photo?: string | null;
}

interface HighFivesByEntry {
  [entryId: string]: HighFive[];
}

export function useBellHighFives(entryIds: string[]) {
  const { user } = useAuth();
  const [highFives, setHighFives] = useState<HighFivesByEntry>({});
  const [loading, setLoading] = useState(true);

  const fetchHighFives = async () => {
    if (entryIds.length === 0) {
      setHighFives({});
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('bell_entry_high_fives')
      .select(`
        *,
        employee_profiles!bell_entry_high_fives_user_id_fkey(display_name, full_name, photo_url)
      `)
      .in('entry_id', entryIds);

    if (error) {
      console.error('Error fetching high fives:', error);
      // Fallback without join
      const { data: fallbackData } = await supabase
        .from('bell_entry_high_fives')
        .select('*')
        .in('entry_id', entryIds);
      
      const grouped: HighFivesByEntry = {};
      (fallbackData || []).forEach((hf: any) => {
        if (!grouped[hf.entry_id]) grouped[hf.entry_id] = [];
        grouped[hf.entry_id].push(hf);
      });
      setHighFives(grouped);
    } else {
      const grouped: HighFivesByEntry = {};
      (data || []).forEach((hf: any) => {
        if (!grouped[hf.entry_id]) grouped[hf.entry_id] = [];
        grouped[hf.entry_id].push({
          ...hf,
          user_name: hf.employee_profiles?.display_name || hf.employee_profiles?.full_name || 'Team Member',
          user_photo: hf.employee_profiles?.photo_url || null,
        });
      });
      setHighFives(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHighFives();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('bell_high_fives')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bell_entry_high_fives' },
        () => {
          fetchHighFives();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entryIds.join(',')]);

  const toggleHighFive = async (entryId: string) => {
    if (!user) return;

    const currentHighFives = highFives[entryId] || [];
    const existingHighFive = currentHighFives.find(hf => hf.user_id === user.id);

    if (existingHighFive) {
      // Remove high five
      const { error } = await supabase
        .from('bell_entry_high_fives')
        .delete()
        .eq('id', existingHighFive.id);

      if (!error) {
        setHighFives(prev => ({
          ...prev,
          [entryId]: prev[entryId]?.filter(hf => hf.id !== existingHighFive.id) || [],
        }));
      }
    } else {
      // Add high five
      const { data, error } = await supabase
        .from('bell_entry_high_fives')
        .insert({ entry_id: entryId, user_id: user.id })
        .select()
        .single();

      if (!error && data) {
        // Fetch user profile for the new high five
        const { data: profile } = await supabase
          .from('employee_profiles')
          .select('display_name, full_name, photo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        const newHighFive: HighFive = {
          ...data,
          user_name: profile?.display_name || profile?.full_name || 'You',
          user_photo: profile?.photo_url || null,
        };

        setHighFives(prev => ({
          ...prev,
          [entryId]: [...(prev[entryId] || []), newHighFive],
        }));
      }
    }
  };

  const hasUserHighFived = (entryId: string): boolean => {
    if (!user) return false;
    return (highFives[entryId] || []).some(hf => hf.user_id === user.id);
  };

  const getHighFiveCount = (entryId: string): number => {
    return (highFives[entryId] || []).length;
  };

  const getHighFiveUsers = (entryId: string): HighFive[] => {
    return highFives[entryId] || [];
  };

  return {
    highFives,
    loading,
    toggleHighFive,
    hasUserHighFived,
    getHighFiveCount,
    getHighFiveUsers,
    refetch: fetchHighFives,
  };
}
