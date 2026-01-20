-- Create table for bell entry high fives
CREATE TABLE public.bell_entry_high_fives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.ring_the_bell_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

-- Enable RLS
ALTER TABLE public.bell_entry_high_fives ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all high fives
CREATE POLICY "Users can view all high fives"
ON public.bell_entry_high_fives
FOR SELECT
USING (true);

-- Policy: Authenticated users can give high fives
CREATE POLICY "Users can give high fives"
ON public.bell_entry_high_fives
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own high fives
CREATE POLICY "Users can remove their own high fives"
ON public.bell_entry_high_fives
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_bell_entry_high_fives_entry_id ON public.bell_entry_high_fives(entry_id);

-- Enable realtime for high fives
ALTER PUBLICATION supabase_realtime ADD TABLE public.bell_entry_high_fives;