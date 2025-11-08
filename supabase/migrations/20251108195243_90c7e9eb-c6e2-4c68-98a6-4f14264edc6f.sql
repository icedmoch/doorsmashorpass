-- Create a table to link meal entries to individual order items
CREATE TABLE IF NOT EXISTS public.meal_entry_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_entry_id bigint NOT NULL REFERENCES public.meal_entries(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  food_item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  calories integer NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  dining_hall text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_entry_items ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_entry_items
CREATE POLICY "Users can view their own meal entry items"
  ON public.meal_entry_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
      AND meal_entries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own meal entry items"
  ON public.meal_entry_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
      AND meal_entries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own meal entry items"
  ON public.meal_entry_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_entries
      WHERE meal_entries.id = meal_entry_items.meal_entry_id
      AND meal_entries.profile_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX idx_meal_entry_items_meal_entry_id ON public.meal_entry_items(meal_entry_id);