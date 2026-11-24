DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
CREATE POLICY "Owner can view own business" ON public.businesses FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='user_id') THEN
    EXECUTE 'CREATE POLICY "Staff can view their business" ON public.businesses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.business_id = businesses.id AND e.user_id = auth.uid()))';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_business(_slug text)
RETURNS TABLE (id uuid, name text, slug text, category text, phone text, whatsapp_number text, address text, description text, instagram text, logo_url text, cover_url text, working_hours jsonb, status text, latitude double precision, longitude double precision, deposit_enabled boolean, deposit_percent numeric, bank_info text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.name, b.slug, b.category::text, b.phone, b.whatsapp_number, b.address, b.description, b.instagram, b.logo_url, b.cover_url, b.working_hours::jsonb, b.status::text, b.latitude::double precision, b.longitude::double precision, b.deposit_enabled, b.deposit_percent::numeric, b.bank_info::text
  FROM public.businesses b WHERE b.slug = _slug LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_business(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Upload payment proofs into a business folder" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','heic','pdf')
  AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id::text = (storage.foldername(name))[1] AND b.deposit_enabled = true)
);