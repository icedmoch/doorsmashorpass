-- Add dietary preferences and goals to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dietary_preferences text[] DEFAULT '{}',
ADD COLUMN goals text;