-- Rename logo_background_color to logo_color for clarity
ALTER TABLE public.program_configuration
RENAME COLUMN logo_background_color TO logo_color;