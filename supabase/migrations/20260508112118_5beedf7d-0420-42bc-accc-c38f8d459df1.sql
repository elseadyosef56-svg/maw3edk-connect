UPDATE auth.users
SET encrypted_password = crypt('0088552212', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE lower(email) = 'elseadyosef56@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users WHERE lower(email)='elseadyosef56@gmail.com'
ON CONFLICT DO NOTHING;