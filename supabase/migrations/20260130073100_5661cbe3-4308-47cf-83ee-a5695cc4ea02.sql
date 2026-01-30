-- Update default organization slug and name
UPDATE organizations 
SET 
  slug = 'drop-dead-salons',
  name = 'Drop Dead Salons',
  updated_at = now()
WHERE slug = 'drop-dead-gorgeous';