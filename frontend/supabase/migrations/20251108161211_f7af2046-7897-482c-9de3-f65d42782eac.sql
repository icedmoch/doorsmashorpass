-- Drop the text-based activity_level column and constraints
ALTER TABLE profiles DROP COLUMN IF EXISTS activity_level CASCADE;

-- Add activity_level as INTEGER with proper constraints
ALTER TABLE profiles 
ADD COLUMN activity_level INTEGER CHECK (activity_level >= 1 AND activity_level <= 5);