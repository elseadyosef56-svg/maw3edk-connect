
-- Super admin can view & manage roles
CREATE POLICY "Super admins manage roles - select"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage roles - insert"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage roles - delete"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Businesses
CREATE POLICY "Super admin views all businesses"
ON public.businesses FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin updates businesses"
ON public.businesses FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles
CREATE POLICY "Super admin views all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Subscriptions
CREATE POLICY "Super admin views all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin inserts subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin updates subscriptions"
ON public.subscriptions FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Payment requests
CREATE POLICY "Super admin views all payment requests"
ON public.payment_requests FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin updates payment requests"
ON public.payment_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Bookings, services, employees (read-only oversight)
CREATE POLICY "Super admin views all bookings"
ON public.bookings FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin views all services"
ON public.services FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin views all employees"
ON public.employees FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));
