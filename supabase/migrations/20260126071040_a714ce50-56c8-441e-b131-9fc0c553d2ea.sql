-- Insert default staff performance threshold setting
INSERT INTO site_settings (id, value, updated_at)
VALUES (
  'staff_performance_threshold',
  '{"minimumRevenue": 3000, "evaluationPeriodDays": 30, "alertsEnabled": true}'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;