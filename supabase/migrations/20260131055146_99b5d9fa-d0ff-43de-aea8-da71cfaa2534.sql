-- Create products table for retail inventory
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT REFERENCES locations(id),
  
  -- Core product info
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  brand TEXT,
  description TEXT,
  
  -- Pricing
  retail_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Inventory
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_level INTEGER,
  
  -- Import tracking
  external_id TEXT,
  import_source TEXT,
  imported_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create imported_staff staging table for staff data that doesn't require auth.users
CREATE TABLE public.imported_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT REFERENCES locations(id),
  
  -- Staff info
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hire_date DATE,
  stylist_level TEXT,
  specialties TEXT[],
  bio TEXT,
  
  -- Import tracking
  external_id TEXT,
  import_source TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  
  -- Link to actual employee (once manually onboarded)
  linked_user_id UUID,
  linked_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, linked, skipped
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Platform users can manage all products
CREATE POLICY "Platform users can manage products"
ON public.products
FOR ALL
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Org admins can manage their own products
CREATE POLICY "Org admins can manage their products"
ON public.products
FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Enable RLS on imported_staff
ALTER TABLE public.imported_staff ENABLE ROW LEVEL SECURITY;

-- Platform users can manage imported staff
CREATE POLICY "Platform users can manage imported staff"
ON public.imported_staff
FOR ALL
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Org admins can manage their own imported staff
CREATE POLICY "Org admins can manage imported staff"
ON public.imported_staff
FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imported_staff_updated_at
  BEFORE UPDATE ON public.imported_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default import templates for new categories
INSERT INTO import_templates (name, description, source_type, entity_type, is_system_template, column_mappings) VALUES
-- Generic Staff
('Generic Staff CSV', 'Import staff from any CSV', 'generic', 'staff', true, '[
  {"source": "name", "target": "full_name", "required": true},
  {"source": "email", "target": "email", "required": false},
  {"source": "phone", "target": "phone", "required": false},
  {"source": "hire_date", "target": "hire_date", "required": false, "transform": "date"}
]'::JSONB),

-- Generic Locations
('Generic Locations CSV', 'Import locations from any CSV', 'generic', 'locations', true, '[
  {"source": "name", "target": "name", "required": true},
  {"source": "address", "target": "address", "required": true},
  {"source": "city", "target": "city", "required": true},
  {"source": "phone", "target": "phone", "required": true}
]'::JSONB),

-- Generic Products
('Generic Products CSV', 'Import products from any CSV', 'generic', 'products', true, '[
  {"source": "name", "target": "name", "required": true},
  {"source": "sku", "target": "sku", "required": false},
  {"source": "category", "target": "category", "required": false},
  {"source": "price", "target": "retail_price", "required": false, "transform": "decimal"},
  {"source": "quantity", "target": "quantity_on_hand", "required": false, "transform": "integer"}
]'::JSONB);