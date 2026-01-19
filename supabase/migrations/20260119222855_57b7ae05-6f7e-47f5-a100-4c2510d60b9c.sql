
-- Schedule birthday reminder to run daily at 8:00 AM UTC
SELECT cron.schedule(
  'send-birthday-reminders-daily',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://vciqmwzgfjxtzagaxgnh.supabase.co/functions/v1/send-birthday-reminders',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaXFtd3pnZmp4dHphZ2F4Z25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTU5MjEsImV4cCI6MjA4NDI5MTkyMX0.agRGhYJ9hkdpX1US0DFjmsWlhZeIPfFZEhatrXgqUYA"}'::jsonb,
      body := '{"days_before": 3}'::jsonb
    ) AS request_id;
  $$
);
