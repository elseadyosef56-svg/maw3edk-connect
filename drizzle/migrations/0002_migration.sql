CREATE OR REPLACE FUNCTION public.is_slug_available(_slug text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.businesses WHERE slug = _slug);
$$;
GRANT EXECUTE ON FUNCTION public.is_slug_available(text) TO authenticated;