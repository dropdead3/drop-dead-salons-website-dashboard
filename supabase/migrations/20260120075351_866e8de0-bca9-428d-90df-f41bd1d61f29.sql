-- Create signature presets table
CREATE TABLE public.signature_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signature_presets ENABLE ROW LEVEL SECURITY;

-- Admins can view all presets
CREATE POLICY "Authenticated users can view signature presets"
ON public.signature_presets
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins can create presets
CREATE POLICY "Authenticated users can create signature presets"
ON public.signature_presets
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update presets
CREATE POLICY "Authenticated users can update signature presets"
ON public.signature_presets
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Admins can delete presets
CREATE POLICY "Authenticated users can delete signature presets"
ON public.signature_presets
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add index for faster lookups
CREATE INDEX idx_signature_presets_name ON public.signature_presets(name);

-- Create trigger for updated_at
CREATE TRIGGER update_signature_presets_updated_at
BEFORE UPDATE ON public.signature_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();