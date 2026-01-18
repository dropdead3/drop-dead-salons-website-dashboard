-- Drop Dead 75: The Client Engine Database Schema

-- =============================================
-- 1. ENUMS
-- =============================================

-- App roles enum (admin can be coach)
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'stylist', 'receptionist', 'assistant');

-- Stylist type for UI labeling (does not affect permissions)
CREATE TYPE public.stylist_type AS ENUM ('independent', 'commission', 'salon_owner');

-- Program status
CREATE TYPE public.program_status AS ENUM ('active', 'paused', 'completed', 'restarted');

-- Touchpoint type
CREATE TYPE public.touchpoint_type AS ENUM ('call', 'text', 'email', 'social', 'in_person');

-- Lead source
CREATE TYPE public.lead_source AS ENUM ('content', 'ads', 'referral', 'google', 'walkin', 'other');

-- =============================================
-- 2. USER ROLES TABLE (Security-first approach)
-- =============================================

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. HELPER FUNCTIONS (Security Definer)
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is admin or manager (coach privileges)
CREATE OR REPLACE FUNCTION public.is_coach_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Convenience function for current user
CREATE OR REPLACE FUNCTION public.current_user_is_coach()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_coach_or_admin(auth.uid())
$$;

-- =============================================
-- 4. EMPLOYEE PROFILES TABLE
-- =============================================

CREATE TABLE public.employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    display_name TEXT,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    instagram TEXT,
    stylist_level TEXT, -- 'LEVEL 1' through 'LEVEL 4'
    specialties TEXT[],
    location_id TEXT, -- 'north-mesa' or 'val-vista-lakes'
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    stylist_type stylist_type DEFAULT 'commission',
    emergency_contact TEXT,
    emergency_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. STYLIST PROGRAM ENROLLMENT
-- =============================================

CREATE TABLE public.stylist_program_enrollment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    current_day INTEGER NOT NULL DEFAULT 1 CHECK (current_day >= 1 AND current_day <= 75),
    streak_count INTEGER NOT NULL DEFAULT 0,
    status program_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_completion_date DATE,
    weekly_wins_due_day INTEGER, -- Day number when next weekly wins is due (7, 14, 21, etc.)
    restart_count INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stylist_program_enrollment ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. DAILY COMPLETIONS
-- =============================================

CREATE TABLE public.daily_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 75),
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Task completion tracking (JSON for flexibility)
    tasks_completed JSONB DEFAULT '{}',
    all_tasks_done BOOLEAN NOT NULL DEFAULT false,
    
    -- Proof of work
    proof_url TEXT,
    proof_type TEXT, -- 'image', 'video', 'link'
    proof_notes TEXT,
    
    -- Status
    metrics_logged BOOLEAN NOT NULL DEFAULT false,
    is_complete BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE (enrollment_id, day_number)
);

ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. DAILY METRICS
-- =============================================

CREATE TABLE public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    completion_id UUID REFERENCES public.daily_completions(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Visibility metrics
    posts_published INTEGER DEFAULT 0,
    reels_published INTEGER DEFAULT 0,
    stories_published INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    profile_visits INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Lead metrics
    dms_received INTEGER DEFAULT 0,
    inquiry_forms INTEGER DEFAULT 0,
    ad_leads INTEGER DEFAULT 0,
    referral_leads INTEGER DEFAULT 0,
    total_leads INTEGER GENERATED ALWAYS AS (dms_received + inquiry_forms + ad_leads + referral_leads) STORED,
    
    -- Booking metrics
    consults_booked INTEGER DEFAULT 0,
    consults_completed INTEGER DEFAULT 0,
    services_booked INTEGER DEFAULT 0,
    revenue_booked DECIMAL(10,2) DEFAULT 0,
    
    -- Conversion metrics (calculated on read)
    new_clients INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. WEEKLY WINS REPORTS
-- =============================================

CREATE TABLE public.weekly_wins_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 11),
    due_day INTEGER NOT NULL, -- Day number (7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 75)
    
    -- Report content
    wins_this_week TEXT,
    what_worked TEXT,
    numbers_snapshot JSONB DEFAULT '{}',
    bottleneck TEXT, -- 'visibility', 'leads', 'conversion', 'followup'
    adjustment_for_next_week TEXT,
    
    -- Status
    submitted_at TIMESTAMPTZ,
    is_submitted BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE (enrollment_id, week_number)
);

ALTER TABLE public.weekly_wins_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. RING THE BELL ENTRIES
-- =============================================

CREATE TABLE public.ring_the_bell_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Booking details
    service_booked TEXT NOT NULL,
    ticket_value DECIMAL(10,2) NOT NULL,
    lead_source lead_source NOT NULL DEFAULT 'other',
    closing_script TEXT,
    screenshot_url TEXT,
    
    -- Coach features
    is_pinned BOOLEAN DEFAULT false,
    coach_note TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ring_the_bell_entries ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 10. COACH NOTES
-- =============================================

CREATE TABLE public.coach_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE NOT NULL,
    coach_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_text TEXT NOT NULL,
    note_type TEXT DEFAULT 'general', -- 'general', 'bottleneck', 'praise', 'concern'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. TRAINING VIDEOS
-- =============================================

CREATE TABLE public.training_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT, -- for embeds (YouTube/Vimeo)
    storage_path TEXT, -- for direct uploads
    thumbnail_url TEXT,
    category TEXT NOT NULL, -- 'onboarding', 'technique', 'product', 'client-service', 'dd75'
    required_for_roles app_role[],
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 12. TRAINING PROGRESS
-- =============================================

CREATE TABLE public.training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES public.training_videos(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMPTZ,
    watch_progress INTEGER DEFAULT 0, -- percentage
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, video_id)
);

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 13. HANDBOOKS
-- =============================================

CREATE TABLE public.handbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT, -- rich text/markdown
    file_url TEXT, -- PDF upload
    category TEXT,
    visible_to_roles app_role[],
    version TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handbooks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 14. RLS POLICIES
-- =============================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_is_coach());

CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.current_user_is_coach())
    WITH CHECK (public.current_user_is_coach());

-- Employee Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.employee_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_is_coach());

CREATE POLICY "Users can update their own profile"
    ON public.employee_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_is_coach())
    WITH CHECK (auth.uid() = user_id OR public.current_user_is_coach());

CREATE POLICY "Coaches can insert profiles"
    ON public.employee_profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_is_coach() OR auth.uid() = user_id);

CREATE POLICY "Coaches can delete profiles"
    ON public.employee_profiles FOR DELETE
    TO authenticated
    USING (public.current_user_is_coach());

-- Stylist Program Enrollment Policies
CREATE POLICY "Stylists can view own enrollment"
    ON public.stylist_program_enrollment FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_is_coach());

CREATE POLICY "Stylists can create own enrollment"
    ON public.stylist_program_enrollment FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stylists can update own enrollment"
    ON public.stylist_program_enrollment FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_is_coach())
    WITH CHECK (auth.uid() = user_id OR public.current_user_is_coach());

-- Daily Completions Policies
CREATE POLICY "View own daily completions"
    ON public.daily_completions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stylist_program_enrollment spe
            WHERE spe.id = daily_completions.enrollment_id
            AND (spe.user_id = auth.uid() OR public.current_user_is_coach())
        )
    );

CREATE POLICY "Insert own daily completions"
    ON public.daily_completions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stylist_program_enrollment spe
            WHERE spe.id = enrollment_id
            AND spe.user_id = auth.uid()
        )
    );

CREATE POLICY "Update own daily completions"
    ON public.daily_completions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stylist_program_enrollment spe
            WHERE spe.id = daily_completions.enrollment_id
            AND (spe.user_id = auth.uid() OR public.current_user_is_coach())
        )
    );

-- Daily Metrics Policies
CREATE POLICY "View own daily metrics"
    ON public.daily_metrics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_completions dc
            JOIN public.stylist_program_enrollment spe ON dc.enrollment_id = spe.id
            WHERE dc.id = daily_metrics.completion_id
            AND (spe.user_id = auth.uid() OR public.current_user_is_coach())
        )
    );

CREATE POLICY "Insert own daily metrics"
    ON public.daily_metrics FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_completions dc
            JOIN public.stylist_program_enrollment spe ON dc.enrollment_id = spe.id
            WHERE dc.id = completion_id
            AND spe.user_id = auth.uid()
        )
    );

CREATE POLICY "Update own daily metrics"
    ON public.daily_metrics FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_completions dc
            JOIN public.stylist_program_enrollment spe ON dc.enrollment_id = spe.id
            WHERE dc.id = daily_metrics.completion_id
            AND (spe.user_id = auth.uid() OR public.current_user_is_coach())
        )
    );

-- Weekly Wins Reports Policies
CREATE POLICY "View own weekly wins"
    ON public.weekly_wins_reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stylist_program_enrollment spe
            WHERE spe.id = weekly_wins_reports.enrollment_id
            AND (spe.user_id = auth.uid() OR public.current_user_is_coach())
        )
    );

CREATE POLICY "Insert own weekly wins"
    ON public.weekly_wins_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stylist_program_enrollment spe
            WHERE spe.id = enrollment_id
            AND spe.user_id = auth.uid()
        )
    );

CREATE POLICY "Update own weekly wins"
    ON public.weekly_wins_reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stylist_program_enrollment spe
            WHERE spe.id = weekly_wins_reports.enrollment_id
            AND (spe.user_id = auth.uid() OR public.current_user_is_coach())
        )
    );

-- Ring the Bell Policies
CREATE POLICY "Everyone can view ring the bell"
    ON public.ring_the_bell_entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Stylists can create own entries"
    ON public.ring_the_bell_entries FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update entries"
    ON public.ring_the_bell_entries FOR UPDATE
    TO authenticated
    USING (public.current_user_is_coach());

-- Coach Notes Policies
CREATE POLICY "Coaches can view all notes"
    ON public.coach_notes FOR SELECT
    TO authenticated
    USING (public.current_user_is_coach());

CREATE POLICY "Coaches can create notes"
    ON public.coach_notes FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_is_coach() AND auth.uid() = coach_user_id);

CREATE POLICY "Coaches can update own notes"
    ON public.coach_notes FOR UPDATE
    TO authenticated
    USING (public.current_user_is_coach() AND auth.uid() = coach_user_id);

CREATE POLICY "Coaches can delete own notes"
    ON public.coach_notes FOR DELETE
    TO authenticated
    USING (public.current_user_is_coach() AND auth.uid() = coach_user_id);

-- Training Videos Policies
CREATE POLICY "Authenticated users can view active videos"
    ON public.training_videos FOR SELECT
    TO authenticated
    USING (is_active = true OR public.current_user_is_coach());

CREATE POLICY "Coaches can manage videos"
    ON public.training_videos FOR ALL
    TO authenticated
    USING (public.current_user_is_coach())
    WITH CHECK (public.current_user_is_coach());

-- Training Progress Policies
CREATE POLICY "Users can view own progress"
    ON public.training_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_is_coach());

CREATE POLICY "Users can track own progress"
    ON public.training_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON public.training_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Handbooks Policies
CREATE POLICY "Authenticated users can view handbooks"
    ON public.handbooks FOR SELECT
    TO authenticated
    USING (is_active = true OR public.current_user_is_coach());

CREATE POLICY "Coaches can manage handbooks"
    ON public.handbooks FOR ALL
    TO authenticated
    USING (public.current_user_is_coach())
    WITH CHECK (public.current_user_is_coach());

-- =============================================
-- 15. TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON public.employee_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stylist_program_enrollment_updated_at
    BEFORE UPDATE ON public.stylist_program_enrollment
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_completions_updated_at
    BEFORE UPDATE ON public.daily_completions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON public.daily_metrics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_wins_reports_updated_at
    BEFORE UPDATE ON public.weekly_wins_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_notes_updated_at
    BEFORE UPDATE ON public.coach_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_handbooks_updated_at
    BEFORE UPDATE ON public.handbooks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 16. STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('proof-uploads', 'proof-uploads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('training-videos', 'training-videos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('handbooks', 'handbooks', false);

-- Storage Policies for proof-uploads
CREATE POLICY "Users can upload their own proof"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'proof-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view proof"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'proof-uploads');

CREATE POLICY "Users can delete their own proof"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'proof-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies for employee-photos
CREATE POLICY "Users can upload their own photo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'employee-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view employee photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'employee-photos');

CREATE POLICY "Users can update their own photo"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'employee-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies for training-videos (coaches only)
CREATE POLICY "Coaches can upload training videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'training-videos' AND public.current_user_is_coach());

CREATE POLICY "Authenticated users can view training videos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'training-videos');

-- Storage Policies for handbooks (coaches only)
CREATE POLICY "Coaches can upload handbooks"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'handbooks' AND public.current_user_is_coach());

CREATE POLICY "Authenticated users can view handbooks"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'handbooks');

-- =============================================
-- 17. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_employee_profiles_user_id ON public.employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_location ON public.employee_profiles(location_id);
CREATE INDEX idx_stylist_enrollment_user_id ON public.stylist_program_enrollment(user_id);
CREATE INDEX idx_stylist_enrollment_status ON public.stylist_program_enrollment(status);
CREATE INDEX idx_daily_completions_enrollment ON public.daily_completions(enrollment_id);
CREATE INDEX idx_daily_completions_date ON public.daily_completions(completion_date);
CREATE INDEX idx_ring_the_bell_created ON public.ring_the_bell_entries(created_at DESC);
CREATE INDEX idx_ring_the_bell_user ON public.ring_the_bell_entries(user_id);
CREATE INDEX idx_training_progress_user ON public.training_progress(user_id);

-- =============================================
-- 18. AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.employee_profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    
    -- Default to stylist role (admin can change later)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'stylist');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();