import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewThresholdSettings {
  minimumOverallRating: number;
  minimumNPSScore: number;
  requireBothToPass: boolean;
  googleReviewUrl: string;
  appleReviewUrl: string;
  yelpReviewUrl: string;
  facebookReviewUrl: string;
  publicReviewPromptTitle: string;
  publicReviewPromptMessage: string;
  privateFollowUpEnabled: boolean;
  privateFollowUpThreshold: number;
}

const DEFAULT_SETTINGS: ReviewThresholdSettings = {
  minimumOverallRating: 4,
  minimumNPSScore: 8,
  requireBothToPass: false,
  googleReviewUrl: '',
  appleReviewUrl: '',
  yelpReviewUrl: '',
  facebookReviewUrl: '',
  publicReviewPromptTitle: "We're Thrilled You Loved Your Visit!",
  publicReviewPromptMessage: 'Would you mind taking a moment to share your experience?',
  privateFollowUpEnabled: true,
  privateFollowUpThreshold: 3,
};

export function useReviewThresholdSettings() {
  return useQuery({
    queryKey: ['site-settings', 'review_threshold_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'review_threshold_settings')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return DEFAULT_SETTINGS;
        throw error;
      }
      
      // Safely merge with defaults to ensure all properties exist
      const value = data?.value as Record<string, unknown> | null;
      if (!value) return DEFAULT_SETTINGS;
      
      return {
        ...DEFAULT_SETTINGS,
        ...value,
      } as ReviewThresholdSettings;
      
    },
  });
}

export function useUpdateReviewThresholdSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: ReviewThresholdSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          id: 'review_threshold_settings',
          value: value as never,
          updated_by: user?.id 
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'review_threshold_settings'] });
    },
  });
}

export function checkPassesReviewGate(
  settings: ReviewThresholdSettings,
  overallRating?: number,
  npsScore?: number | null
): boolean {
  const ratingPasses = overallRating ? overallRating >= settings.minimumOverallRating : false;
  const npsPasses = npsScore !== null && npsScore !== undefined ? npsScore >= settings.minimumNPSScore : false;

  if (settings.requireBothToPass) {
    return ratingPasses && npsPasses;
  }
  return ratingPasses || npsPasses;
}

export function checkBelowFollowUpThreshold(
  settings: ReviewThresholdSettings,
  overallRating?: number
): boolean {
  if (!settings.privateFollowUpEnabled) return false;
  return overallRating ? overallRating <= settings.privateFollowUpThreshold : false;
}

export async function trackExternalReviewClick(
  feedbackToken: string,
  platform: 'google' | 'apple' | 'yelp' | 'facebook' | 'copied'
) {
  const { error } = await supabase
    .from('client_feedback_responses')
    .update({
      external_review_clicked: platform,
      external_review_clicked_at: new Date().toISOString(),
    })
    .eq('token', feedbackToken);

  if (error) {
    console.error('Failed to track review click:', error);
  }
}
