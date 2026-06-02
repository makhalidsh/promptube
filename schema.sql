-- SQL Schema for Promptube User History, Profiles, Usage Logging, and Vault Integration
-- Execute this script in your Supabase Project's SQL Editor

-- 1. Create table for profiles (automatically managed)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free',
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create table for storing YouTube structuring history
CREATE TABLE IF NOT EXISTS public.user_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    channel_name TEXT,
    main_topic TEXT NOT NULL,
    principles TEXT[] NOT NULL DEFAULT '{}',
    lessons TEXT[] NOT NULL DEFAULT '{}',
    warnings TEXT[] NOT NULL DEFAULT '{}',
    examples TEXT[] NOT NULL DEFAULT '{}',
    frameworks TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    transcript_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Prevent duplicate records for the same user & video
    UNIQUE (user_id, video_id)
);

-- 3. Create table for request usage logs
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for public.profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Define RLS Policies for public.user_history
CREATE POLICY "Users can view their own history" ON public.user_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" ON public.user_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history" ON public.user_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" ON public.user_history
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Define RLS Policies for public.usage_logs
CREATE POLICY "Allow users to read their own logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Auth Trigger to auto-create user profile on SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, tier, usage_count, last_used_date)
    VALUES (new.id, 'free', 0, CURRENT_DATE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Secure Vault Credentials Retrying Helper
CREATE OR REPLACE FUNCTION public.get_gemini_key()
RETURNS text AS $$
DECLARE
  v_key text;
BEGIN
  -- Verify caller is logged in
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'GEMINI_API_KEY';
  
  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Stored Procedure to atomically verify limits and log requests
CREATE OR REPLACE FUNCTION public.check_and_log_usage(
  p_user_id UUID,
  p_request_type TEXT,
  p_free_limit INTEGER,
  p_pro_limit INTEGER
)
RETURNS jsonb AS $$
DECLARE
  v_tier text;
  v_count int;
  v_limit int;
  v_success boolean;
  v_message text;
BEGIN
  -- Get user tier with a row lock to prevent concurrency/race conditions
  SELECT tier INTO v_tier FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Determine daily quota
  IF v_tier = 'pro' THEN
    v_limit := p_pro_limit;
  ELSE
    v_limit := p_free_limit;
  END IF;

  -- Count requests made today (UTC)
  SELECT COUNT(*)::int INTO v_count 
  FROM public.usage_logs 
  WHERE user_id = p_user_id 
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  -- Verify quota status
  IF v_count >= v_limit THEN
    v_success := false;
    v_message := 'limit reached';
  ELSE
    -- Log active request
    INSERT INTO public.usage_logs (user_id, request_type, created_at)
    VALUES (p_user_id, p_request_type, now());
    
    -- Sync update on profiles
    UPDATE public.profiles 
    SET 
      usage_count = CASE 
        WHEN last_used_date = CURRENT_DATE THEN usage_count + 1 
        ELSE 1 
      END,
      last_used_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = p_user_id;

    v_success := true;
    v_message := 'allowed';
  END IF;

  RETURN json_build_object(
    'success', v_success,
    'message', v_message,
    'tier', v_tier,
    'usage_count', COALESCE(v_count, 0) + CASE WHEN v_success THEN 1 ELSE 0 END,
    'limit', v_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
