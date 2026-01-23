-- Add phorest_staff_id to performance metrics table
ALTER TABLE phorest_performance_metrics 
ADD COLUMN IF NOT EXISTS phorest_staff_id text;

-- Add phorest_staff_id to daily sales summary table
ALTER TABLE phorest_daily_sales_summary 
ADD COLUMN IF NOT EXISTS phorest_staff_id text;

-- Make user_id nullable on both tables (it was likely already nullable but ensuring)
ALTER TABLE phorest_performance_metrics 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE phorest_daily_sales_summary 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop old unique constraints if they exist
ALTER TABLE phorest_performance_metrics
DROP CONSTRAINT IF EXISTS phorest_performance_metrics_user_id_week_start_key;

ALTER TABLE phorest_daily_sales_summary
DROP CONSTRAINT IF EXISTS phorest_daily_sales_summary_user_id_location_id_summary_dat_key;

-- Add new unique constraints based on phorest_staff_id
-- Performance metrics: unique by staff + week
CREATE UNIQUE INDEX IF NOT EXISTS phorest_perf_staff_week_idx 
ON phorest_performance_metrics (phorest_staff_id, week_start) 
WHERE phorest_staff_id IS NOT NULL;

-- Daily sales summary: unique by staff + location + date
CREATE UNIQUE INDEX IF NOT EXISTS phorest_sales_staff_loc_date_idx 
ON phorest_daily_sales_summary (phorest_staff_id, location_id, summary_date) 
WHERE phorest_staff_id IS NOT NULL;

-- Add index for fast lookups by phorest_staff_id
CREATE INDEX IF NOT EXISTS idx_perf_phorest_staff ON phorest_performance_metrics(phorest_staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_phorest_staff ON phorest_daily_sales_summary(phorest_staff_id);