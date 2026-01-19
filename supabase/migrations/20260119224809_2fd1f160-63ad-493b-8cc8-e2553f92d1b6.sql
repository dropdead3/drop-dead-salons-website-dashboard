-- Create storage bucket for email template assets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('email-assets', 'email-assets', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to email-assets bucket
CREATE POLICY "Authenticated users can upload email assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-assets' AND auth.role() = 'authenticated');

-- Allow anyone to view email assets (for email rendering)
CREATE POLICY "Email assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete email assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'email-assets' AND auth.role() = 'authenticated');