-- Delete the orphan "Haircuts" entry that doesn't match any Phorest service
DELETE FROM service_category_colors 
WHERE category_name = 'Haircuts';