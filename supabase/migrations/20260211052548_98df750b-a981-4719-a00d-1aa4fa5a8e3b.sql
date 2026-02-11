
-- Create enum types for Zura configuration
CREATE TYPE public.zura_tone AS ENUM ('professional', 'friendly', 'motivational', 'luxury', 'casual');
CREATE TYPE public.zura_response_length AS ENUM ('concise', 'moderate', 'detailed');
CREATE TYPE public.zura_knowledge_category AS ENUM ('salon_policy', 'product_info', 'pricing', 'brand_guidelines', 'service_info', 'faq', 'custom');
CREATE TYPE public.zura_guardrail_type AS ENUM ('topic_block', 'data_boundary', 'behavior_rule', 'compliance');
CREATE TYPE public.zura_guardrail_severity AS ENUM ('soft_warn', 'hard_block');

-- 1. Personality Configuration (one per org)
CREATE TABLE public.zura_personality_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Zura',
  tone zura_tone NOT NULL DEFAULT 'friendly',
  formality_level INTEGER NOT NULL DEFAULT 3 CHECK (formality_level >= 1 AND formality_level <= 5),
  emoji_usage BOOLEAN NOT NULL DEFAULT false,
  custom_greeting TEXT,
  custom_sign_off TEXT,
  brand_voice_notes TEXT,
  prohibited_phrases TEXT[] DEFAULT '{}',
  encouraged_phrases TEXT[] DEFAULT '{}',
  response_length_preference zura_response_length NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(organization_id)
);

-- 2. Knowledge Entries (many per org)
CREATE TABLE public.zura_knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category zura_knowledge_category NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to_functions TEXT[] NOT NULL DEFAULT '{all}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- 3. Role Rules (per-role speaking rules)
CREATE TABLE public.zura_role_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_role app_role NOT NULL,
  tone_override zura_tone,
  custom_instructions TEXT,
  data_boundaries TEXT,
  suggested_cta_style TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, target_role)
);

-- 4. Guardrails (safety rules)
CREATE TABLE public.zura_guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_type zura_guardrail_type NOT NULL,
  rule_description TEXT NOT NULL,
  severity zura_guardrail_severity NOT NULL DEFAULT 'soft_warn',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.zura_personality_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zura_knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zura_role_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zura_guardrails ENABLE ROW LEVEL SECURITY;

-- RLS: Org members can read their own org's config
CREATE POLICY "Org members can read personality config"
  ON public.zura_personality_config FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can read knowledge entries"
  ON public.zura_knowledge_entries FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can read role rules"
  ON public.zura_role_rules FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can read guardrails"
  ON public.zura_guardrails FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- RLS: Only admins/super_admins can write
CREATE POLICY "Admins can manage personality config"
  ON public.zura_personality_config FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Admins can manage knowledge entries"
  ON public.zura_knowledge_entries FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Admins can manage role rules"
  ON public.zura_role_rules FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Admins can manage guardrails"
  ON public.zura_guardrails FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Triggers for updated_at
CREATE TRIGGER update_zura_personality_config_updated_at
  BEFORE UPDATE ON public.zura_personality_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zura_knowledge_entries_updated_at
  BEFORE UPDATE ON public.zura_knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zura_role_rules_updated_at
  BEFORE UPDATE ON public.zura_role_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zura_guardrails_updated_at
  BEFORE UPDATE ON public.zura_guardrails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for knowledge entries priority queries
CREATE INDEX idx_zura_knowledge_entries_org_priority 
  ON public.zura_knowledge_entries(organization_id, priority DESC) 
  WHERE is_active = true;

-- Index for role rules lookups
CREATE INDEX idx_zura_role_rules_org_role 
  ON public.zura_role_rules(organization_id, target_role) 
  WHERE is_active = true;
