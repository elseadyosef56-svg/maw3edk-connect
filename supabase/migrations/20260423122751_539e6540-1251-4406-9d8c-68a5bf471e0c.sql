
-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 30,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_business ON public.services(business_id);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active services"
  ON public.services FOR SELECT
  USING (is_active = true OR business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner manages services - insert"
  ON public.services FOR INSERT
  WITH CHECK (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner manages services - update"
  ON public.services FOR UPDATE
  USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner manages services - delete"
  ON public.services FOR DELETE
  USING (business_id = public.get_user_business(auth.uid()));

CREATE TRIGGER trg_services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EMPLOYEES ============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  image_url TEXT,
  working_hours JSONB DEFAULT '{}'::jsonb,
  service_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_business ON public.employees(business_id);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active employees"
  ON public.employees FOR SELECT
  USING (is_active = true OR business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner manages employees - insert"
  ON public.employees FOR INSERT
  WITH CHECK (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner manages employees - update"
  ON public.employees FOR UPDATE
  USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner manages employees - delete"
  ON public.employees FOR DELETE
  USING (business_id = public.get_user_business(auth.uid()));

CREATE TRIGGER trg_employees_updated
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOKINGS ============
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  qr_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  price_snapshot NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_business_time ON public.bookings(business_id, start_time);
CREATE INDEX idx_bookings_employee_time ON public.bookings(employee_id, start_time);
CREATE UNIQUE INDEX idx_bookings_qr ON public.bookings(qr_token);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views bookings"
  ON public.bookings FOR SELECT
  USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Anyone can create booking"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner updates bookings"
  ON public.bookings FOR UPDATE
  USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner deletes bookings"
  ON public.bookings FOR DELETE
  USING (business_id = public.get_user_business(auth.uid()));

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conflict prevention trigger
CREATE OR REPLACE FUNCTION public.prevent_booking_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'no_show') THEN
    RETURN NEW;
  END IF;
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'وقت النهاية يجب أن يكون بعد وقت البداية';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.employee_id = NEW.employee_id
      AND b.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND b.status NOT IN ('cancelled', 'no_show')
      AND b.start_time < NEW.end_time
      AND b.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'هذا الوقت غير متاح';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_no_conflict
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_conflict();

-- ============ PAYMENT REQUESTS ============
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  method public.payment_method NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views payment requests"
  ON public.payment_requests FOR SELECT
  USING (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Owner creates payment requests"
  ON public.payment_requests FOR INSERT
  WITH CHECK (business_id = public.get_user_business(auth.uid()));

CREATE POLICY "Admin manages payment requests"
  ON public.payment_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true);

CREATE POLICY "Public reads business assets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('business-assets', 'service-images'));

CREATE POLICY "Auth uploads business assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('business-assets', 'service-images')
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth updates own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('business-assets', 'service-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Auth deletes own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('business-assets', 'service-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
