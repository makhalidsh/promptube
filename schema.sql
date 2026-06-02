-- SQL Schema for Promptube User History & Vault Synchronization
-- Run this in your Supabase Project's SQL Editor

-- 1. Create table for storing structured knowledge history
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
    
    -- Ensure unique videos per user to prevent duplicate history records
    UNIQUE (user_id, video_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- 3. Create policies so users can only access their own history data
CREATE POLICY "Users can view their own history" ON public.user_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" ON public.user_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history" ON public.user_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" ON public.user_history
    FOR DELETE USING (auth.uid() = user_id);
