-- Remove unit columns from profiles
ALTER TABLE profiles DROP COLUMN height_unit;
ALTER TABLE profiles DROP COLUMN weight_unit;

-- Rename columns to reflect inches/lbs storage
ALTER TABLE profiles RENAME COLUMN height_cm TO height_inches;
ALTER TABLE profiles RENAME COLUMN weight_kg TO weight_lbs;