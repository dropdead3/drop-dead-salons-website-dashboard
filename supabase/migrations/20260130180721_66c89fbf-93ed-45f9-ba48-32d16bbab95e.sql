-- Create kb_categories table
CREATE TABLE public.kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create kb_articles table
CREATE TABLE public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  author_id UUID NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create kb_article_reads table for analytics
CREATE TABLE public.kb_article_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_kb_articles_category ON public.kb_articles(category_id);
CREATE INDEX idx_kb_articles_status ON public.kb_articles(status);
CREATE INDEX idx_kb_articles_slug ON public.kb_articles(slug);
CREATE INDEX idx_kb_article_reads_article ON public.kb_article_reads(article_id);
CREATE INDEX idx_kb_article_reads_user ON public.kb_article_reads(user_id);

-- Enable RLS
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_article_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kb_categories
CREATE POLICY "Anyone authenticated can view active categories"
ON public.kb_categories FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Platform users can manage categories"
ON public.kb_categories FOR ALL
TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- RLS Policies for kb_articles
CREATE POLICY "Anyone authenticated can view published articles"
ON public.kb_articles FOR SELECT
TO authenticated
USING (status = 'published' OR public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can manage articles"
ON public.kb_articles FOR ALL
TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- RLS Policies for kb_article_reads
CREATE POLICY "Users can view their own reads"
ON public.kb_article_reads FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_platform_user(auth.uid()));

CREATE POLICY "Users can insert their own reads"
ON public.kb_article_reads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_kb_categories_updated_at
  BEFORE UPDATE ON public.kb_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_kb_updated_at();

CREATE TRIGGER update_kb_articles_updated_at
  BEFORE UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_kb_updated_at();

-- Seed default categories
INSERT INTO public.kb_categories (name, slug, description, icon, display_order) VALUES
  ('Getting Started', 'getting-started', 'Essential guides for new users', 'Rocket', 1),
  ('Account & Billing', 'account-billing', 'Manage your account settings', 'CreditCard', 2),
  ('Team Management', 'team-management', 'Add and manage team members', 'Users', 3),
  ('Analytics & Reports', 'analytics-reports', 'Understand your data', 'BarChart3', 4),
  ('Integrations', 'integrations', 'Connect third-party services', 'Plug', 5),
  ('Troubleshooting', 'troubleshooting', 'Common issues and solutions', 'HelpCircle', 6);