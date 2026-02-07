-- Add photo_urls column to meeting_notes for handwritten note photos
ALTER TABLE public.meeting_notes 
ADD COLUMN photo_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for meeting note photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-notes', 'meeting-notes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket
CREATE POLICY "Authenticated users can upload meeting note photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-notes');

CREATE POLICY "Authenticated users can view meeting note photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'meeting-notes');

CREATE POLICY "Users can delete their own meeting note photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'meeting-notes' AND auth.uid()::text = (storage.foldername(name))[1]);