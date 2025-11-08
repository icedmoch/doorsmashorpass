-- Add latitude and longitude columns to orders table for map integration
ALTER TABLE public.orders 
ADD COLUMN delivery_latitude numeric,
ADD COLUMN delivery_longitude numeric;

-- Add index for geolocation queries
CREATE INDEX idx_orders_location ON public.orders(delivery_latitude, delivery_longitude) WHERE delivery_latitude IS NOT NULL;