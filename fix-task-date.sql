-- Update the existing task to have a future active_to date
UPDATE brand_tasks 
SET active_to = NOW() + INTERVAL '30 days'
WHERE id = 'f8f88628-fddd-4c70-970f-eb731f588b7d';