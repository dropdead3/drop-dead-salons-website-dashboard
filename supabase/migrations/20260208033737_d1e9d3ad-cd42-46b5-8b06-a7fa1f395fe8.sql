-- Add review gating columns to client_feedback_responses
ALTER TABLE public.client_feedback_responses 
ADD COLUMN IF NOT EXISTS passed_review_gate BOOLEAN,
ADD COLUMN IF NOT EXISTS external_review_clicked TEXT,
ADD COLUMN IF NOT EXISTS external_review_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manager_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manager_notified_at TIMESTAMPTZ;

-- Insert default review threshold settings
INSERT INTO public.site_settings (id, value, updated_by)
VALUES (
  'review_threshold_settings',
  '{
    "minimumOverallRating": 4,
    "minimumNPSScore": 8,
    "requireBothToPass": false,
    "googleReviewUrl": "",
    "appleReviewUrl": "",
    "yelpReviewUrl": "",
    "facebookReviewUrl": "",
    "publicReviewPromptTitle": "We''re Thrilled You Loved Your Visit!",
    "publicReviewPromptMessage": "Would you mind taking a moment to share your experience?",
    "privateFollowUpEnabled": true,
    "privateFollowUpThreshold": 3
  }'::jsonb,
  NULL
)
ON CONFLICT (id) DO NOTHING;