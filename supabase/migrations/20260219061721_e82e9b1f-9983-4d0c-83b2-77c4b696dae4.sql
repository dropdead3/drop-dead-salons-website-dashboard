-- Create website-sections storage bucket for media uploads in custom sections
INSERT INTO storage.buckets (id, name, public) VALUES ('website-sections', 'website-sections', true);

-- Anyone can view website section assets
CREATE POLICY "Website section assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-sections');

-- Authenticated users can upload website section assets
CREATE POLICY "Authenticated users can upload website section assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'website-sections' AND auth.role() = 'authenticated');

-- Authenticated users can update their uploaded assets
CREATE POLICY "Authenticated users can update website section assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'website-sections' AND auth.role() = 'authenticated');

-- Authenticated users can delete website section assets
CREATE POLICY "Authenticated users can delete website section assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'website-sections' AND auth.role() = 'authenticated');
