-- Add delivery person tracking to orders table
ALTER TABLE public.orders
ADD COLUMN delivery_person_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN claimed_at timestamp with time zone;

-- Create index for faster queries on delivery orders
CREATE INDEX idx_orders_delivery_person ON public.orders(delivery_person_id);
CREATE INDEX idx_orders_delivery_option ON public.orders(delivery_option);