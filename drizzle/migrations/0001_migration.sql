CREATE OR REPLACE FUNCTION public.business_accepts_proofs(_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id::text = _id AND b.deposit_enabled = true);
$$;
GRANT EXECUTE ON FUNCTION public.business_accepts_proofs(text) TO anon, authenticated;
DROP POLICY IF EXISTS "Upload payment proofs into a business folder" ON storage.objects;
CREATE POLICY "Upload payment proofs into a business folder" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','heic','pdf')
  AND public.business_accepts_proofs((storage.foldername(name))[1])
);