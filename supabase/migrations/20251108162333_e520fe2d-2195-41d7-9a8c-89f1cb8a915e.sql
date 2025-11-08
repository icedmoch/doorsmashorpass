-- Add delivery-related columns to orders table
ALTER TABLE orders ADD COLUMN delivery_option TEXT DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN delivery_latitude DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN delivery_longitude DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN special_notes TEXT;

-- Rename special_instructions to match the code if it exists
-- Since we're adding special_notes, we can keep both for backward compatibility