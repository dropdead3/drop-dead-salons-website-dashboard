-- Add tip_amount column to track tips for experience scoring
ALTER TABLE phorest_appointments 
ADD COLUMN tip_amount DECIMAL(10,2) DEFAULT 0;