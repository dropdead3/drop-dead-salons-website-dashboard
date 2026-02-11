
CREATE TABLE public.platform_favorite_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

ALTER TABLE public.platform_favorite_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON public.platform_favorite_organizations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.platform_favorite_organizations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.platform_favorite_organizations
FOR DELETE USING (auth.uid() = user_id);
