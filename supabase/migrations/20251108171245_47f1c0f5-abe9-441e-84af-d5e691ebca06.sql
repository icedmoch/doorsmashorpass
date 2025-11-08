-- Drop the restrictive policy and create proper permissive policies for food_items
DROP POLICY IF EXISTS "Allow anonymous access to food_items" ON public.food_items;

-- Allow anyone to read food items
CREATE POLICY "Anyone can view food_items"
ON public.food_items
FOR SELECT
USING (true);

-- Allow authenticated users to insert food items
CREATE POLICY "Authenticated users can insert food_items"
ON public.food_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update food items
CREATE POLICY "Authenticated users can update food_items"
ON public.food_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete food items
CREATE POLICY "Authenticated users can delete food_items"
ON public.food_items
FOR DELETE
TO authenticated
USING (true);

-- Fix meal_entries policies as well
DROP POLICY IF EXISTS "Allow anonymous access to meal_entries" ON public.meal_entries;

-- Allow users to view their own meal entries
CREATE POLICY "Users can view their own meal_entries"
ON public.meal_entries
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Allow users to insert their own meal entries
CREATE POLICY "Users can insert their own meal_entries"
ON public.meal_entries
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Allow users to update their own meal entries
CREATE POLICY "Users can update their own meal_entries"
ON public.meal_entries
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Allow users to delete their own meal entries
CREATE POLICY "Users can delete their own meal_entries"
ON public.meal_entries
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());