-- Create locations table for managing salon locations
CREATE TABLE public.locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    booking_url TEXT,
    google_maps_url TEXT,
    hours TEXT DEFAULT 'Tue–Sat: 10am–6pm',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Everyone can read active locations (public data for the website)
CREATE POLICY "Anyone can view active locations"
ON public.locations
FOR SELECT
USING (is_active = true);

-- Only admins/managers can manage locations
CREATE POLICY "Leadership can manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing locations as seed data
INSERT INTO public.locations (id, name, address, city, phone, booking_url, google_maps_url, display_order)
VALUES 
    ('north-mesa', 'North Mesa', '2036 N Gilbert Rd Ste 1', 'Mesa, AZ 85203', '(480) 548-1886', '/booking?location=north-mesa', 'https://maps.google.com/?q=2036+N+Gilbert+Rd+Ste+1+Mesa+AZ+85203', 1),
    ('val-vista-lakes', 'Val Vista Lakes', '3641 E Baseline Rd Suite Q-103', 'Gilbert, AZ 85234', '(480) 548-1886', '/booking?location=val-vista-lakes', 'https://maps.google.com/?q=3641+E+Baseline+Rd+Suite+Q-103+Gilbert+AZ+85234', 2);