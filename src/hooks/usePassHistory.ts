import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PassUsageRecord {
  id: string;
  enrollment_id: string;
  user_id: string;
  used_at: string;
  day_missed: number;
  current_day_at_use: number;
  restored_at: string | null;
  restored_by: string | null;
  restore_reason: string | null;
  created_at: string;
}

export function usePassHistory(enrollmentId: string | undefined) {
  const [history, setHistory] = useState<PassUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!enrollmentId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pass_usage_history')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('used_at', { ascending: false });

    if (error) {
      console.error('Error fetching pass history:', error);
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  }, [enrollmentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recordPassUsage = async (
    userId: string,
    dayMissed: number,
    currentDayAtUse: number
  ): Promise<boolean> => {
    if (!enrollmentId) return false;

    const { error } = await supabase
      .from('pass_usage_history')
      .insert({
        enrollment_id: enrollmentId,
        user_id: userId,
        day_missed: dayMissed,
        current_day_at_use: currentDayAtUse,
      });

    if (error) {
      console.error('Error recording pass usage:', error);
      return false;
    }

    await fetchHistory();
    return true;
  };

  return {
    history,
    loading,
    recordPassUsage,
    refetch: fetchHistory,
  };
}

export function useAllPassHistory() {
  const [history, setHistory] = useState<(PassUsageRecord & { 
    user_name?: string;
    user_email?: string;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllHistory = useCallback(async () => {
    const { data: passData, error: passError } = await supabase
      .from('pass_usage_history')
      .select('*')
      .order('used_at', { ascending: false });

    if (passError) {
      console.error('Error fetching all pass history:', passError);
      setLoading(false);
      return;
    }

    // Get user profiles for names
    const userIds = [...new Set((passData || []).map(p => p.user_id))];
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profiles || []).map(p => [p.user_id, { name: p.full_name, email: p.email }])
      );

      setHistory(
        (passData || []).map(p => ({
          ...p,
          user_name: profilesMap.get(p.user_id)?.name || 'Unknown',
          user_email: profilesMap.get(p.user_id)?.email || '',
        }))
      );
    } else {
      setHistory([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllHistory();
  }, [fetchAllHistory]);

  const restorePass = async (
    passId: string,
    adminUserId: string,
    reason: string
  ): Promise<boolean> => {
    // Get the pass record
    const { data: passRecord, error: fetchError } = await supabase
      .from('pass_usage_history')
      .select('*, enrollment_id')
      .eq('id', passId)
      .single();

    if (fetchError || !passRecord) {
      toast.error('Could not find pass record');
      return false;
    }

    // Update the pass record
    const { error: updateError } = await supabase
      .from('pass_usage_history')
      .update({
        restored_at: new Date().toISOString(),
        restored_by: adminUserId,
        restore_reason: reason,
      })
      .eq('id', passId);

    if (updateError) {
      console.error('Error updating pass record:', updateError);
      toast.error('Failed to restore pass');
      return false;
    }

    // Restore the credit to the enrollment
    const { data: enrollment } = await supabase
      .from('stylist_program_enrollment')
      .select('forgive_credits_remaining, forgive_credits_used')
      .eq('id', passRecord.enrollment_id)
      .single();

    if (enrollment) {
      await supabase
        .from('stylist_program_enrollment')
        .update({
          forgive_credits_remaining: enrollment.forgive_credits_remaining + 1,
          forgive_credits_used: Math.max(0, enrollment.forgive_credits_used - 1),
        })
        .eq('id', passRecord.enrollment_id);
    }

    toast.success('Life Happens Pass restored successfully');
    await fetchAllHistory();
    return true;
  };

  return {
    history,
    loading,
    restorePass,
    refetch: fetchAllHistory,
  };
}
