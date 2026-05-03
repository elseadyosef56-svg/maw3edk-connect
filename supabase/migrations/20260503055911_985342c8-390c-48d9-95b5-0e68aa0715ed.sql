
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS deposit_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_percent integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS bank_info text;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric,
  ADD COLUMN IF NOT EXISTS payment_proof_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Public can read payment proofs') THEN
    CREATE POLICY "Public can read payment proofs" ON storage.objects
      FOR SELECT USING (bucket_id = 'payment-proofs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='Anyone can upload payment proofs') THEN
    CREATE POLICY "Anyone can upload payment proofs" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
  END IF;
END $$;
