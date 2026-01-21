import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PauseRequest {
  id: string;
  enrollment_id: string;
  user_id: string;
  reason: string;
  requested_duration_days: number;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  pause_start_date: string | null;
  pause_end_date: string | null;
}

export function usePauseRequests(enrollmentId: string | undefined) {
  const [pauseRequests, setPauseRequests] = useState<PauseRequest[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PauseRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!enrollmentId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('program_pause_requests')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching pause requests:', error);
    } else {
      setPauseRequests(data as PauseRequest[]);
      const pending = data?.find(r => r.status === 'pending');
      setPendingRequest(pending as PauseRequest || null);
    }
    setLoading(false);
  }, [enrollmentId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const submitPauseRequest = async (
    userId: string,
    reason: string,
    durationDays: number = 7
  ): Promise<boolean> => {
    if (!enrollmentId) return false;

    // Check if there's already a pending request
    if (pendingRequest) {
      toast.error('You already have a pending pause request');
      return false;
    }

    const { error } = await supabase
      .from('program_pause_requests')
      .insert({
        enrollment_id: enrollmentId,
        user_id: userId,
        reason,
        requested_duration_days: durationDays,
      });

    if (error) {
      console.error('Error submitting pause request:', error);
      toast.error('Failed to submit pause request');
      return false;
    }

    toast.success('Pause request submitted. Leadership will review it shortly.');
    await fetchRequests();
    return true;
  };

  return {
    pauseRequests,
    pendingRequest,
    loading,
    submitPauseRequest,
    refetch: fetchRequests,
  };
}

// Hook for leadership to manage all pause requests
export function useAllPauseRequests() {
  const [requests, setRequests] = useState<(PauseRequest & { 
    user_name?: string; 
    user_email?: string;
    current_day?: number;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('program_pause_requests')
      .select(`
        *,
        stylist_program_enrollment!inner(current_day, user_id)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) {
      console.error('Error fetching all pause requests:', error);
      setLoading(false);
      return;
    }

    // Fetch user profiles for the requests
    const userIds = data?.map((r: any) => r.user_id) || [];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const enrichedRequests = data?.map((request: any) => {
        const profile = profiles?.find(p => p.user_id === request.user_id);
        return {
          ...request,
          user_name: profile?.full_name || 'Unknown',
          user_email: profile?.email || '',
          current_day: request.stylist_program_enrollment?.current_day,
        };
      });

      setRequests(enrichedRequests || []);
    } else {
      setRequests([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  const reviewRequest = async (
    requestId: string,
    decision: 'approved' | 'denied',
    reviewerId: string,
    notes?: string,
    pauseDays?: number
  ): Promise<boolean> => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return false;

    const today = new Date();
    const pauseEndDate = new Date(today);
    pauseEndDate.setDate(pauseEndDate.getDate() + (pauseDays || request.requested_duration_days));

    const { error: updateError } = await supabase
      .from('program_pause_requests')
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        reviewer_notes: notes || null,
        pause_start_date: decision === 'approved' ? today.toISOString().split('T')[0] : null,
        pause_end_date: decision === 'approved' ? pauseEndDate.toISOString().split('T')[0] : null,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating pause request:', updateError);
      toast.error('Failed to process request');
      return false;
    }

    // If approved, update enrollment status to paused
    if (decision === 'approved') {
      await supabase
        .from('stylist_program_enrollment')
        .update({ status: 'paused' })
        .eq('id', request.enrollment_id);
    }

    toast.success(`Pause request ${decision}`);
    await fetchAllRequests();
    return true;
  };

  return {
    requests,
    loading,
    reviewRequest,
    refetch: fetchAllRequests,
  };
}
