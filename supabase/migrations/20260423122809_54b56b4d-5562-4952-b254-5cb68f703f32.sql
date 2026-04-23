
-- Validation trigger to ensure service & employee belong to the booking's business
CREATE OR REPLACE FUNCTION public.validate_booking_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  s_biz UUID;
  e_biz UUID;
BEGIN
  SELECT business_id INTO s_biz FROM public.services WHERE id = NEW.service_id AND is_active = true;
  SELECT business_id INTO e_biz FROM public.employees WHERE id = NEW.employee_id AND is_active = true;
  IF s_biz IS NULL OR e_biz IS NULL THEN
    RAISE EXCEPTION 'الخدمة أو الموظف غير متاح';
  END IF;
  IF s_biz <> NEW.business_id OR e_biz <> NEW.business_id THEN
    RAISE EXCEPTION 'بيانات الحجز غير صحيحة';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_validate_tenant
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_tenant();

-- Replace the overly permissive insert policy with a tighter one (still allows public, but trigger validates)
DROP POLICY IF EXISTS "Anyone can create booking" ON public.bookings;

CREATE POLICY "Public can create valid bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    business_id IS NOT NULL
    AND service_id IS NOT NULL
    AND employee_id IS NOT NULL
    AND length(customer_name) BETWEEN 1 AND 100
    AND length(customer_phone) BETWEEN 5 AND 25
    AND end_time > start_time
    AND start_time > now()
  );
