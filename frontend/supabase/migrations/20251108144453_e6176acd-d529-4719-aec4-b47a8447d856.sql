-- Clean up existing data and old tables
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.meal_entries;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update orders table
ALTER TABLE public.orders
  ALTER COLUMN user_id TYPE uuid USING NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.orders
  ALTER COLUMN delivery_person_id TYPE uuid USING NULL,
  ADD CONSTRAINT orders_delivery_person_id_fkey FOREIGN KEY (delivery_person_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update meal_entries table
ALTER TABLE public.meal_entries
  ALTER COLUMN user_id TYPE uuid USING NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT meal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Allow anonymous access to orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view orders they are delivering"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = delivery_person_id);

CREATE POLICY "Users can view available deliveries"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    delivery_option = 'delivery' 
    AND delivery_person_id IS NULL 
    AND status IN ('pending', 'preparing', 'ready')
  );

CREATE POLICY "Users can insert their own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Delivery persons can claim orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    delivery_person_id IS NULL 
    AND delivery_option = 'delivery'
  );

CREATE POLICY "Delivery persons can update their deliveries"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = delivery_person_id);

-- Update RLS for order_items
DROP POLICY IF EXISTS "Allow anonymous access to order_items" ON public.order_items;

CREATE POLICY "Users can view their order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.delivery_person_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert order items for their orders"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Update RLS for meal_entries
DROP POLICY IF EXISTS "Allow anonymous access to meal_entries" ON public.meal_entries;

CREATE POLICY "Users can view their own meal entries"
  ON public.meal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal entries"
  ON public.meal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal entries"
  ON public.meal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal entries"
  ON public.meal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);