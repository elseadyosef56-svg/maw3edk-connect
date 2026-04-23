-- Enums
CREATE TYPE public.business_status AS ENUM ('trial', 'active', 'expired', 'suspended');
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro', 'premium');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'pending');
CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'admin');

-- Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  phone TEXT,
  logo_url TEXT,
  cover_url TEXT,
  working_hours JSONB DEFAULT '{}'::jsonb,
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '3 days'),
  status public.business_status NOT NULL DEFAULT 'trial',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table — never on profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id, role)
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'basic',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '3 days'),
  status public.subscription_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Security definer: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer: get user's business
CREATE OR REPLACE FUNCTION public.get_user_business(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies
-- Businesses: public can read by slug (for booking page), owner manages
CREATE POLICY "Anyone can view businesses"
  ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owner can update own business"
  ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert business"
  ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Profiles
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: read own
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: owner of business reads
CREATE POLICY "Owner views subscriptions"
  ON public.subscriptions FOR SELECT
  USING (business_id = public.get_user_business(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + business + trial subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_business_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- generate slug from email prefix
  base_slug := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]+', '-', 'g');
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'business';
  END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.businesses (owner_id, name, slug)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'منشأتي'), final_slug)
  RETURNING id INTO new_business_id;

  INSERT INTO public.profiles (user_id, business_id, email, full_name)
  VALUES (NEW.id, new_business_id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.user_roles (user_id, business_id, role)
  VALUES (NEW.id, new_business_id, 'owner');

  INSERT INTO public.subscriptions (business_id, plan, status)
  VALUES (new_business_id, 'basic', 'trial');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();