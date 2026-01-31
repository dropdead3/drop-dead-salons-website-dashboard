-- First migration: Just add the enum value
-- This needs to be committed before we can use it
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'booth_renter';