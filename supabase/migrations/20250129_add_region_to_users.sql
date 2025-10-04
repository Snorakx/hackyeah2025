-- Add region column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS region VARCHAR(5) DEFAULT 'PL';

-- Add comment
COMMENT ON COLUMN public.users.region IS 'User region/country code for localized portion sizes (PL, IE, US, DE, etc.)';

-- Add constraint for valid region codes
ALTER TABLE public.users 
ADD CONSTRAINT users_region_check 
CHECK (region IN ('PL', 'IE', 'US', 'DE', 'FR', 'IT', 'ES', 'GB', 'SV', 'NO', 'DA', 'FI', 'CA', 'AU', 'NZ'));
