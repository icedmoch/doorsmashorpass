-- Add personal information columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS sex text,
ADD COLUMN IF NOT EXISTS height_cm numeric,
ADD COLUMN IF NOT EXISTS height_unit text DEFAULT 'cm',
ADD COLUMN IF NOT EXISTS weight_kg numeric,
ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS activity_level integer,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add check constraints for valid ranges
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_age CHECK (age > 0 AND age < 150),
ADD CONSTRAINT valid_activity_level CHECK (activity_level >= 1 AND activity_level <= 5),
ADD CONSTRAINT valid_sex CHECK (sex IN ('Male', 'Female', 'Other'));

-- Update RLS policies to allow users to update their onboarding info
-- (existing policies already cover this)