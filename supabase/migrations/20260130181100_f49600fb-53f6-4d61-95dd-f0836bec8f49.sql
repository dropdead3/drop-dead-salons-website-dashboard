-- Create function to increment article views
CREATE OR REPLACE FUNCTION public.increment_kb_article_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kb_articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$;