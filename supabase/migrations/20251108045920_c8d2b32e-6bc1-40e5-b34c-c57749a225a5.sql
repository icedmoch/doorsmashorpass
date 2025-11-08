-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id bigint REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  delivery_option text NOT NULL,
  delivery_location text,
  delivery_time text NOT NULL,
  special_notes text,
  status order_status NOT NULL DEFAULT 'pending',
  total_calories numeric NOT NULL DEFAULT 0,
  total_protein numeric NOT NULL DEFAULT 0,
  total_carbs numeric NOT NULL DEFAULT 0,
  total_fat numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  food_item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders (allowing anonymous access for now, matching existing pattern)
CREATE POLICY "Allow anonymous access to orders"
  ON public.orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for order_items
CREATE POLICY "Allow anonymous access to order_items"
  ON public.order_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);