-- Add region column to user_onboarding table
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS region VARCHAR(5) DEFAULT 'PL';

-- Add comment
COMMENT ON COLUMN public.user_onboarding.region IS 'User region/country code for localized portion sizes (PL, IE, US, DE, etc.)';

-- Add constraint for valid region codes
ALTER TABLE public.user_onboarding 
ADD CONSTRAINT user_onboarding_region_check 
CHECK (region IN ('PL', 'IE', 'US', 'DE', 'FR', 'IT', 'ES', 'GB', 'SV', 'NO', 'DA', 'FI', 'CA', 'AU', 'NZ'));
