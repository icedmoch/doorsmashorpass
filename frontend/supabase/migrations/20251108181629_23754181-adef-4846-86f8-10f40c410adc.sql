-- Add numeric goal columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN goal_calories integer,
ADD COLUMN goal_protein numeric,
ADD COLUMN goal_carbs numeric,
ADD COLUMN goal_fat numeric;