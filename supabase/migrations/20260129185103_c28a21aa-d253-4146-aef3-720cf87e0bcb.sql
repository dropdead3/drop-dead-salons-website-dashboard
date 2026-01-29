-- =============================================
-- DATA IMPORT SYSTEM: Tables for migration wizard
-- =============================================

-- 1. IMPORT TEMPLATES - Pre-defined column mappings for each source
CREATE TABLE IF NOT EXISTS public.import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL, -- 'phorest', 'mindbody', 'boulevard', 'vagaro', 'square', 'generic'
  entity_type TEXT NOT NULL, -- 'clients', 'appointments', 'services', 'transactions'
  -- Column mappings (JSON structure)
  column_mappings JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Transformation rules
  transformation_rules JSONB DEFAULT '{}'::JSONB,
  -- Validation rules
  validation_rules JSONB DEFAULT '{}'::JSONB,
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false, -- System templates can't be deleted
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. IMPORT JOBS - Track import progress and results
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Job info
  template_id UUID REFERENCES public.import_templates(id),
  source_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  -- File info
  file_name TEXT,
  file_size INTEGER,
  total_rows INTEGER,
  -- Progress
  status TEXT DEFAULT 'pending', -- 'pending', 'validating', 'processing', 'completed', 'failed', 'cancelled'
  processed_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  -- Results
  errors JSONB DEFAULT '[]'::JSONB,
  warnings JSONB DEFAULT '[]'::JSONB,
  summary JSONB DEFAULT '{}'::JSONB,
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Location scope
  location_id TEXT REFERENCES public.locations(id),
  -- User
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_import_templates_source ON public.import_templates(source_type);
CREATE INDEX IF NOT EXISTS idx_import_templates_entity ON public.import_templates(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs(created_by);

-- 4. ENABLE RLS
ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR IMPORT TEMPLATES
CREATE POLICY "Authenticated users can view templates" ON public.import_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin roles can manage templates" ON public.import_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- 6. RLS POLICIES FOR IMPORT JOBS
CREATE POLICY "Users can view their own import jobs" ON public.import_jobs
  FOR SELECT USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager', 'super_admin')
  ));

CREATE POLICY "Admin roles can manage import jobs" ON public.import_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- 7. UPDATE TRIGGERS
CREATE TRIGGER update_import_templates_updated_at
  BEFORE UPDATE ON public.import_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. INSERT DEFAULT TEMPLATES
INSERT INTO public.import_templates (name, description, source_type, entity_type, is_system_template, column_mappings) VALUES
-- Phorest Clients
('Phorest Clients', 'Import clients from Phorest CSV export', 'phorest', 'clients', true, '[
  {"source": "Client ID", "target": "external_id", "required": true},
  {"source": "First Name", "target": "first_name", "required": true},
  {"source": "Last Name", "target": "last_name", "required": true},
  {"source": "Email", "target": "email", "required": false},
  {"source": "Mobile", "target": "mobile", "required": false},
  {"source": "Phone", "target": "phone", "required": false},
  {"source": "Notes", "target": "notes", "required": false}
]'::JSONB),

-- Phorest Services
('Phorest Services', 'Import services from Phorest CSV export', 'phorest', 'services', true, '[
  {"source": "Service ID", "target": "external_id", "required": true},
  {"source": "Name", "target": "name", "required": true},
  {"source": "Category", "target": "category", "required": false},
  {"source": "Duration", "target": "duration_minutes", "required": true, "transform": "integer"},
  {"source": "Price", "target": "price", "required": false, "transform": "decimal"}
]'::JSONB),

-- Generic Clients
('Generic Clients CSV', 'Import clients from any CSV with flexible mapping', 'generic', 'clients', true, '[
  {"source": "first_name", "target": "first_name", "required": true},
  {"source": "last_name", "target": "last_name", "required": true},
  {"source": "email", "target": "email", "required": false},
  {"source": "phone", "target": "mobile", "required": false}
]'::JSONB),

-- Generic Services
('Generic Services CSV', 'Import services from any CSV with flexible mapping', 'generic', 'services', true, '[
  {"source": "name", "target": "name", "required": true},
  {"source": "category", "target": "category", "required": false},
  {"source": "duration", "target": "duration_minutes", "required": true, "transform": "integer"},
  {"source": "price", "target": "price", "required": false, "transform": "decimal"}
]'::JSONB),

-- Generic Appointments
('Generic Appointments CSV', 'Import appointments from any CSV with flexible mapping', 'generic', 'appointments', true, '[
  {"source": "date", "target": "appointment_date", "required": true, "transform": "date"},
  {"source": "start_time", "target": "start_time", "required": true, "transform": "time"},
  {"source": "end_time", "target": "end_time", "required": true, "transform": "time"},
  {"source": "client_name", "target": "client_name", "required": false},
  {"source": "service_name", "target": "service_name", "required": false},
  {"source": "staff_name", "target": "staff_name", "required": false}
]'::JSONB)
ON CONFLICT DO NOTHING;