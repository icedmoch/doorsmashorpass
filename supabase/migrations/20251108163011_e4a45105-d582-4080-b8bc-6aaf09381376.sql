-- Add deliverer_id column to track who claimed the delivery
ALTER TABLE orders ADD COLUMN deliverer_id UUID REFERENCES profiles(id);