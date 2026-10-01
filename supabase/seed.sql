-- Approximate generic values per 100g. These are editable seed records, not clinical data.
insert into public.foods (name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global) values
('Egg', 'generic', 'cooked', 155, 12.6, 1.1, 10.6, 0, 'USDA', true),
('Chicken Breast', 'generic', 'raw', 120, 22.5, 0, 2.6, 0, 'USDA', true),
('Chicken Breast', 'generic', 'cooked', 165, 31, 0, 3.6, 0, 'USDA', true),
('White Rice', 'generic', 'cooked', 130, 2.7, 28.2, .3, .4, 'USDA', true),
('Kerala Matta Rice', 'generic', 'cooked', 125, 2.6, 26.1, .8, 1.6, 'Custom', true),
('Banana', 'generic', 'as_served', 89, 1.1, 22.8, .3, 2.6, 'USDA', true),
('Kiwi', 'generic', 'as_served', 61, 1.1, 14.7, .5, 3, 'USDA', true),
('Avocado', 'generic', 'as_served', 160, 2, 8.5, 14.7, 6.7, 'USDA', true),
('Curd', 'generic', 'as_served', 61, 3.5, 4.7, 3.3, 0, 'USDA', true),
('Milk', 'generic', 'as_served', 61, 3.2, 4.8, 3.3, 0, 'USDA', true),
('Oats', 'generic', 'raw', 389, 16.9, 66.3, 6.9, 10.6, 'USDA', true);
