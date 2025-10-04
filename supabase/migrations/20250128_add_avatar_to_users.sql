-- Add avatar column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(20) DEFAULT 'avatar1';

-- Add comment
COMMENT ON COLUMN public.users.avatar IS 'User avatar identifier for pre-defined avatars';
