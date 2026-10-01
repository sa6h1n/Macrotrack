insert into public.foods (name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global)
select * from (values
  ('Whole Wheat Bread', 'generic', 'as_served', 247, 13.0, 41.0, 4.2, 6.0, 'USDA', true),
  ('White Bread', 'generic', 'as_served', 266, 8.9, 49.4, 3.2, 2.4, 'USDA', true),
  ('Apple', 'generic', 'as_served', 52, 0.3, 13.8, 0.2, 2.4, 'USDA', true),
  ('Orange', 'generic', 'as_served', 47, 0.9, 11.8, 0.1, 2.4, 'USDA', true),
  ('Potato', 'generic', 'raw', 77, 2.0, 17.5, 0.1, 2.2, 'USDA', true),
  ('Potato', 'generic', 'cooked', 87, 1.9, 20.1, 0.1, 1.8, 'USDA', true),
  ('Sweet Potato', 'generic', 'cooked', 90, 2.0, 20.7, 0.2, 3.3, 'USDA', true),
  ('Paneer', 'generic', 'as_served', 265, 18.3, 1.2, 20.8, 0, 'Custom', true),
  ('Greek Yogurt', 'generic', 'as_served', 73, 10.0, 3.9, 1.9, 0, 'USDA', true),
  ('Egg White', 'generic', 'as_served', 52, 10.9, 0.7, 0.2, 0, 'USDA', true),
  ('Peanut Butter', 'generic', 'as_served', 588, 25.1, 20.0, 50.4, 6.0, 'USDA', true),
  ('Almonds', 'generic', 'as_served', 579, 21.2, 21.6, 49.9, 12.5, 'USDA', true),
  ('Chapati', 'generic', 'as_served', 297, 11.3, 55.0, 4.0, 11.0, 'Custom', true),
  ('Chicken Thigh', 'generic', 'cooked', 209, 26.0, 0, 10.9, 0, 'USDA', true),
  ('Salmon', 'generic', 'cooked', 206, 22.1, 0, 12.4, 0, 'USDA', true)
) as v(name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global)
where not exists (
  select 1 from public.foods f
  where f.name = v.name and f.measurement_state = v.measurement_state and f.is_global = true
);
