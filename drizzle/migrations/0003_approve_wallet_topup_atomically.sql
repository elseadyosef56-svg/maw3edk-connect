CREATE OR REPLACE FUNCTION public.approve_wallet_topup(_request_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.payment_requests%ROWTYPE;
  new_balance numeric;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'غير مصرح باعتماد شحن المحفظة';
  END IF;
  SELECT * INTO req FROM public.payment_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'طلب الشحن غير موجود'; END IF;
  IF req.status <> 'pending' OR left(coalesce(req.reference, ''), 14) <> '[WALLET TOPUP]' THEN
    RAISE EXCEPTION 'الطلب ليس طلب شحن معلّق';
  END IF;
  IF req.amount IS NULL OR req.amount < 10 OR req.amount::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'مبلغ الشحن غير صحيح';
  END IF;
  INSERT INTO public.wallets (business_id, balance) VALUES (req.business_id, 0)
  ON CONFLICT (business_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + req.amount, updated_at = now()
    WHERE business_id = req.business_id RETURNING balance INTO new_balance;
  INSERT INTO public.wallet_transactions (business_id, type, amount, balance_after, reference)
    VALUES (req.business_id, 'topup', req.amount, new_balance, 'طلب شحن ' || req.id::text);
  UPDATE public.payment_requests SET status = 'approved', approved_at = now() WHERE id = req.id;
  RETURN new_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_wallet_topup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_wallet_topup(uuid) TO authenticated;
