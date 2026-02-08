-- Add is_multi_location column to organizations
ALTER TABLE public.organizations 
ADD COLUMN is_multi_location BOOLEAN DEFAULT false;

-- Backfill: Set true for orgs with more than 1 active location
UPDATE public.organizations o
SET is_multi_location = true
WHERE (
  SELECT COUNT(*) FROM public.locations l 
  WHERE l.organization_id = o.id AND l.is_active = true
) > 1;

-- Create function to sync multi-location flag when locations change
CREATE OR REPLACE FUNCTION public.sync_multi_location_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Count active locations for the org
  UPDATE public.organizations
  SET is_multi_location = (
    SELECT COUNT(*) > 1 FROM public.locations
    WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update flag when locations are added/removed/updated
CREATE TRIGGER update_multi_location_flag
AFTER INSERT OR UPDATE OR DELETE ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.sync_multi_location_flag();