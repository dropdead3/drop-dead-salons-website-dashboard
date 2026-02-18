
-- Allow anonymous/public users to view products that are available online
CREATE POLICY "Public can view online products"
ON public.products FOR SELECT
USING (is_active = true AND available_online = true);
