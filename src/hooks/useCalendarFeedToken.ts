import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCalendarFeedToken() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('calendar_feed_tokens')
      .select('token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      setToken(data.token);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const generateToken = useCallback(async () => {
    if (!user) return null;
    // Deactivate existing tokens
    await supabase
      .from('calendar_feed_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id);

    const { data, error } = await supabase
      .from('calendar_feed_tokens')
      .insert({ user_id: user.id })
      .select('token')
      .single();

    if (error) {
      toast.error('Failed to generate calendar link');
      return null;
    }
    setToken(data.token);
    toast.success('Calendar feed link generated!');
    return data.token;
  }, [user]);

  const revokeToken = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('calendar_feed_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id);
    setToken(null);
    toast.success('Calendar feed link revoked');
  }, [user]);

  const getFeedUrl = useCallback((t: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/calendar-feed?token=${t}`;
  }, []);

  const getWebcalUrl = useCallback((t: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `webcal://${projectId}.supabase.co/functions/v1/calendar-feed?token=${t}`;
  }, []);

  const getGoogleSubscribeUrl = useCallback((t: string) => {
    const feedUrl = getFeedUrl(t);
    return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`;
  }, [getFeedUrl]);

  return {
    token,
    loading,
    generateToken,
    revokeToken,
    getFeedUrl,
    getWebcalUrl,
    getGoogleSubscribeUrl,
  };
}
