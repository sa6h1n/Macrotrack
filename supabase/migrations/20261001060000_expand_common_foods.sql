-- Common everyday foods for faster search. Values are approximate generic values per 100g.
insert into public.foods (name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global)
select * from (values
  ('Chicken with Bone', 'generic'::public.food_type, 'cooked'::public.measurement_state, 165, 25.0, 0, 6.5, 0, 'Custom', true),
  ('Chicken Leg', 'generic'::public.food_type, 'cooked'::public.measurement_state, 184, 26.0, 0, 8.0, 0, 'USDA', true),
  ('Chicken Drumstick', 'generic'::public.food_type, 'cooked'::public.measurement_state, 172, 28.3, 0, 5.7, 0, 'USDA', true),
  ('Chicken Thigh with Skin', 'generic'::public.food_type, 'cooked'::public.measurement_state, 229, 25.9, 0, 13.5, 0, 'USDA', true),
  ('Chicken Breast with Skin', 'generic'::public.food_type, 'cooked'::public.measurement_state, 197, 29.8, 0, 7.8, 0, 'USDA', true),
  ('Chicken Wings', 'generic'::public.food_type, 'cooked'::public.measurement_state, 203, 30.5, 0, 8.1, 0, 'USDA', true),
  ('Chicken Liver', 'generic'::public.food_type, 'cooked'::public.measurement_state, 167, 24.5, 0.9, 6.5, 0, 'USDA', true),
  ('Mackerel', 'generic'::public.food_type, 'cooked'::public.measurement_state, 262, 23.9, 0, 17.8, 0, 'USDA', true),
  ('Sardines', 'generic'::public.food_type, 'cooked'::public.measurement_state, 208, 24.6, 0, 11.5, 0, 'USDA', true),
  ('Tuna', 'generic'::public.food_type, 'cooked'::public.measurement_state, 132, 29.9, 0, 0.6, 0, 'USDA', true),
  ('Basmati Rice', 'generic'::public.food_type, 'cooked'::public.measurement_state, 130, 2.7, 28.2, 0.3, 0.4, 'USDA', true),
  ('Brown Rice', 'generic'::public.food_type, 'cooked'::public.measurement_state, 123, 2.7, 25.6, 1.0, 1.6, 'USDA', true),
  ('Kerala Matta Rice', 'generic'::public.food_type, 'cooked'::public.measurement_state, 125, 2.6, 26.1, 0.8, 1.6, 'Custom', true),
  ('Dal', 'generic'::public.food_type, 'cooked'::public.measurement_state, 116, 9.0, 20.1, 0.4, 7.9, 'USDA', true),
  ('Moong Dal', 'generic'::public.food_type, 'cooked'::public.measurement_state, 105, 7.0, 19.2, 0.4, 7.6, 'USDA', true),
  ('Chickpeas', 'generic'::public.food_type, 'cooked'::public.measurement_state, 164, 8.9, 27.4, 2.6, 7.6, 'USDA', true),
  ('Rajma', 'generic'::public.food_type, 'cooked'::public.measurement_state, 127, 8.7, 22.8, 0.5, 6.4, 'USDA', true),
  ('Tofu', 'generic'::public.food_type, 'as_served'::public.measurement_state, 76, 8.1, 1.9, 4.8, 0.3, 'USDA', true),
  ('Dosa', 'generic'::public.food_type, 'as_served'::public.measurement_state, 168, 4.5, 27.9, 4.2, 1.5, 'Custom', true),
  ('Idli', 'generic'::public.food_type, 'as_served'::public.measurement_state, 146, 5.0, 30.0, 0.7, 1.5, 'Custom', true),
  ('Appam', 'generic'::public.food_type, 'as_served'::public.measurement_state, 160, 3.0, 30.0, 2.5, 1.0, 'Custom', true),
  ('Puttu', 'generic'::public.food_type, 'as_served'::public.measurement_state, 180, 4.0, 35.0, 2.5, 2.0, 'Custom', true),
  ('Coconut', 'generic'::public.food_type, 'as_served'::public.measurement_state, 354, 3.3, 15.2, 33.5, 9.0, 'USDA', true),
  ('Cashews', 'generic'::public.food_type, 'as_served'::public.measurement_state, 553, 18.2, 30.2, 43.8, 3.3, 'USDA', true),
  ('Peanuts', 'generic'::public.food_type, 'as_served'::public.measurement_state, 567, 25.8, 16.1, 49.2, 8.5, 'USDA', true),
  ('Cottage Cheese', 'generic'::public.food_type, 'as_served'::public.measurement_state, 98, 11.1, 3.4, 4.3, 0, 'USDA', true),
  ('Whey Protein Powder', 'generic'::public.food_type, 'raw'::public.measurement_state, 400, 80.0, 8.0, 6.0, 0, 'Custom', true),
  ('Whole Egg', 'generic'::public.food_type, 'cooked'::public.measurement_state, 155, 12.6, 1.1, 10.6, 0, 'USDA', true),
  ('Egg White', 'generic'::public.food_type, 'cooked'::public.measurement_state, 52, 10.9, 0.7, 0.2, 0, 'USDA', true),
  ('Greek Yogurt', 'generic'::public.food_type, 'as_served'::public.measurement_state, 73, 10.0, 3.9, 1.9, 0, 'USDA', true),
  ('Curd', 'generic'::public.food_type, 'as_served'::public.measurement_state, 61, 3.5, 4.7, 3.3, 0, 'USDA', true),
  ('Milk', 'generic'::public.food_type, 'as_served'::public.measurement_state, 61, 3.2, 4.8, 3.3, 0, 'USDA', true),
  ('Banana', 'generic'::public.food_type, 'as_served'::public.measurement_state, 89, 1.1, 22.8, 0.3, 2.6, 'USDA', true),
  ('Apple', 'generic'::public.food_type, 'as_served'::public.measurement_state, 52, 0.3, 13.8, 0.2, 2.4, 'USDA', true),
  ('Potato', 'generic'::public.food_type, 'cooked'::public.measurement_state, 87, 1.9, 20.1, 0.1, 1.8, 'USDA', true),
  ('Sweet Potato', 'generic'::public.food_type, 'cooked'::public.measurement_state, 90, 2.0, 20.7, 0.2, 3.3, 'USDA', true)
) as v(name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global)
where not exists (
  select 1 from public.foods f
  where lower(f.name) = lower(v.name)
    and f.measurement_state::text = v.measurement_state::text
    and f.is_global = true
);
