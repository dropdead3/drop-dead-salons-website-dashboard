-- Add 'salon_lead' to the lead_source enum
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'salon_lead';