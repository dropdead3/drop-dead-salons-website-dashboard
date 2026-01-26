-- Add day_rate_enabled column to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS day_rate_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS day_rate_default_price numeric DEFAULT 150.00,
ADD COLUMN IF NOT EXISTS day_rate_blackout_dates date[] DEFAULT '{}';

-- Create day_rate_chairs table (using text for location_id to match locations.id)
CREATE TABLE public.day_rate_chairs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id text REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    chair_number integer NOT NULL,
    name text,
    is_available boolean DEFAULT true,
    daily_rate numeric DEFAULT 150.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(location_id, chair_number)
);

-- Create booking status enum
CREATE TYPE public.day_rate_booking_status AS ENUM (
    'pending',
    'confirmed',
    'checked_in',
    'completed',
    'cancelled',
    'no_show'
);

-- Create day_rate_bookings table
CREATE TABLE public.day_rate_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chair_id uuid REFERENCES public.day_rate_chairs(id) ON DELETE SET NULL,
    location_id text REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    booking_date date NOT NULL,
    stylist_name text NOT NULL,
    stylist_email text NOT NULL,
    stylist_phone text NOT NULL,
    license_number text NOT NULL,
    license_state text NOT NULL,
    business_name text,
    instagram_handle text,
    amount_paid numeric,
    stripe_payment_id text,
    agreement_signed_at timestamp with time zone,
    agreement_version text,
    status public.day_rate_booking_status DEFAULT 'pending' NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create day_rate_agreements table
CREATE TABLE public.day_rate_agreements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.day_rate_chairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_rate_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_rate_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for day_rate_chairs
CREATE POLICY "Public can view available chairs"
ON public.day_rate_chairs FOR SELECT
USING (true);

CREATE POLICY "Admins can manage chairs"
ON public.day_rate_chairs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for day_rate_bookings
CREATE POLICY "Public can create bookings"
ON public.day_rate_bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view own bookings by email"
ON public.day_rate_bookings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all bookings"
ON public.day_rate_bookings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for day_rate_agreements
CREATE POLICY "Public can view active agreements"
ON public.day_rate_agreements FOR SELECT
USING (true);

CREATE POLICY "Admins can manage agreements"
ON public.day_rate_agreements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create updated_at triggers
CREATE TRIGGER update_day_rate_chairs_updated_at
    BEFORE UPDATE ON public.day_rate_chairs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_day_rate_bookings_updated_at
    BEFORE UPDATE ON public.day_rate_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster booking queries
CREATE INDEX idx_day_rate_bookings_date ON public.day_rate_bookings(booking_date);
CREATE INDEX idx_day_rate_bookings_location ON public.day_rate_bookings(location_id);
CREATE INDEX idx_day_rate_bookings_status ON public.day_rate_bookings(status);

-- Insert a default agreement template
INSERT INTO public.day_rate_agreements (version, title, content, is_active)
VALUES (
    'v1.0',
    'Day Rate Chair Rental Agreement',
    '# Day Rate Chair Rental Agreement

## Terms and Conditions

By booking a day rate chair rental, you agree to the following terms:

### 1. License Requirements
- You must hold a valid cosmetology license in your state
- You must provide your license number at the time of booking
- Your license must be current and in good standing

### 2. Booking Terms
- Your booking is for a single day (operating hours only)
- You must arrive within 30 minutes of the location opening time
- Late arrivals may result in forfeiture of your booking

### 3. Equipment & Supplies
- Basic station equipment is provided (chair, mirror, electrical outlets)
- You must bring your own tools, products, and supplies
- The salon is not responsible for lost or stolen items

### 4. Conduct
- You agree to maintain a professional environment
- You must follow all salon policies and procedures
- Disruptive behavior may result in immediate termination of your booking

### 5. Cancellation Policy
- Cancellations made 48+ hours in advance: Full refund
- Cancellations made 24-48 hours in advance: 50% refund
- Cancellations made less than 24 hours: No refund

### 6. Liability
- You are responsible for your own clients and services
- You must carry your own liability insurance
- The salon is not liable for any claims arising from your services

### 7. Payment
- Full payment is required at the time of booking
- No refunds for unused time or early departure

By proceeding with this booking, you acknowledge that you have read, understood, and agree to these terms and conditions.',
    true
);