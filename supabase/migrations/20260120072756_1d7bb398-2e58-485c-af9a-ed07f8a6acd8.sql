-- Update the email-assets bucket to allow larger files (10MB)
UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'email-assets';

-- Also ensure there's no restrictive policy limiting file sizes
-- Drop and recreate upload policy with proper size limits
DROP POLICY IF EXISTS "Allow authenticated uploads to email-assets" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to email-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets' 
  AND (storage.foldername(name))[1] IN ('logos', 'images', 'signature-images')
);