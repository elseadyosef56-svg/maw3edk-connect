-- ========== 1. STAFF role + email gate for super_admin ==========
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';

-- Owner email gate function
CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'elseadyosef56@gmail.com'
  )
$$;

-- ========== 2. WALLET system ==========
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own wallet" ON public.wallets FOR SELECT
  USING (business_id = get_user_business(auth.uid()));
CREATE POLICY "Super admin views all wallets" ON public.wallets FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages wallets - update" ON public.wallets FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages wallets - insert" ON public.wallets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet transactions
CREATE TYPE wallet_tx_type AS ENUM ('topup', 'commission', 'refund', 'adjustment');
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  type wallet_tx_type NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  reference text,
  booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own wallet tx" ON public.wallet_transactions FOR SELECT
  USING (business_id = get_user_business(auth.uid()));
CREATE POLICY "Super admin views all wallet tx" ON public.wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin inserts wallet tx" ON public.wallet_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Auto-create wallet for new businesses
CREATE OR REPLACE FUNCTION public.create_wallet_for_business()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (business_id, balance) VALUES (NEW.id, 0)
  ON CONFLICT (business_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER businesses_create_wallet AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_business();

-- Backfill wallets for existing businesses
INSERT INTO public.wallets (business_id, balance)
SELECT id, 0 FROM public.businesses
ON CONFLICT (business_id) DO NOTHING;

-- Commission deduction on booking confirmation
CREATE OR REPLACE FUNCTION public.deduct_booking_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  commission numeric;
  cur_balance numeric;
  new_balance numeric;
BEGIN
  IF NEW.status NOT IN ('confirmed', 'completed') OR NEW.price_snapshot IS NULL OR NEW.price_snapshot <= 0 THEN
    RETURN NEW;
  END IF;
  commission := round((NEW.price_snapshot * 0.05)::numeric, 2);
  SELECT balance INTO cur_balance FROM public.wallets WHERE business_id = NEW.business_id FOR UPDATE;
  IF cur_balance IS NULL THEN
    INSERT INTO public.wallets (business_id, balance) VALUES (NEW.business_id, 0);
    cur_balance := 0;
  END IF;
  IF cur_balance < commission THEN
    RAISE EXCEPTION 'رصيد المحفظة غير كافٍ لاستقبال هذا الحجز. يرجى شحن المحفظة.';
  END IF;
  new_balance := cur_balance - commission;
  UPDATE public.wallets SET balance = new_balance, updated_at = now() WHERE business_id = NEW.business_id;
  INSERT INTO public.wallet_transactions (business_id, type, amount, balance_after, reference, booking_id)
  VALUES (NEW.business_id, 'commission', -commission, new_balance, 'عمولة 5% على حجز', NEW.id);
  RETURN NEW;
END $$;

CREATE TRIGGER bookings_deduct_commission AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.deduct_booking_commission();

-- ========== 3. PROMOTIONS ==========
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  service_id uuid,
  title text NOT NULL,
  description text,
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active promos" ON public.promotions FOR SELECT
  USING (is_active = true AND ends_at > now());
CREATE POLICY "Owner manages promos - select" ON public.promotions FOR SELECT
  USING (business_id = get_user_business(auth.uid()));
CREATE POLICY "Owner manages promos - insert" ON public.promotions FOR INSERT
  WITH CHECK (business_id = get_user_business(auth.uid()));
CREATE POLICY "Owner manages promos - update" ON public.promotions FOR UPDATE
  USING (business_id = get_user_business(auth.uid()));
CREATE POLICY "Owner manages promos - delete" ON public.promotions FOR DELETE
  USING (business_id = get_user_business(auth.uid()));

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== 4. GPS location on businesses ==========
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- ========== 5. STAFF self-view: link employee to user ==========
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE OR REPLACE FUNCTION public.is_employee_for_business(_user_id uuid, _business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE user_id = _user_id AND business_id = _business_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_employee_id_for_user(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.employees WHERE user_id = _user_id AND is_active = true LIMIT 1
$$;

-- Staff sees only their own bookings
CREATE POLICY "Staff views own bookings" ON public.bookings FOR SELECT
  USING (employee_id = public.get_employee_id_for_user(auth.uid()));
