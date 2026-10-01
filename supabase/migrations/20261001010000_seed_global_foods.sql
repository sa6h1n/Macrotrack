-- Seed the editable global catalogue used by the app.
insert into public.foods (name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global)
select * from (values
  ('Egg', 'generic'::public.food_type, 'cooked'::public.measurement_state, 155::numeric, 12.6::numeric, 1.1::numeric, 10.6::numeric, 0::numeric, 'USDA', true),
  ('Chicken Breast', 'generic'::public.food_type, 'raw'::public.measurement_state, 120::numeric, 22.5::numeric, 0::numeric, 2.6::numeric, 0::numeric, 'USDA', true),
  ('Chicken Breast', 'generic'::public.food_type, 'cooked'::public.measurement_state, 165::numeric, 31::numeric, 0::numeric, 3.6::numeric, 0::numeric, 'USDA', true),
  ('White Rice', 'generic'::public.food_type, 'cooked'::public.measurement_state, 130::numeric, 2.7::numeric, 28.2::numeric, .3::numeric, .4::numeric, 'USDA', true),
  ('Kerala Matta Rice', 'generic'::public.food_type, 'cooked'::public.measurement_state, 125::numeric, 2.6::numeric, 26.1::numeric, .8::numeric, 1.6::numeric, 'Custom', true),
  ('Banana', 'generic'::public.food_type, 'as_served'::public.measurement_state, 89::numeric, 1.1::numeric, 22.8::numeric, .3::numeric, 2.6::numeric, 'USDA', true),
  ('Kiwi', 'generic'::public.food_type, 'as_served'::public.measurement_state, 61::numeric, 1.1::numeric, 14.7::numeric, .5::numeric, 3::numeric, 'USDA', true),
  ('Avocado', 'generic'::public.food_type, 'as_served'::public.measurement_state, 160::numeric, 2::numeric, 8.5::numeric, 14.7::numeric, 6.7::numeric, 'USDA', true),
  ('Curd', 'generic'::public.food_type, 'as_served'::public.measurement_state, 61::numeric, 3.5::numeric, 4.7::numeric, 3.3::numeric, 0::numeric, 'USDA', true),
  ('Milk', 'generic'::public.food_type, 'as_served'::public.measurement_state, 61::numeric, 3.2::numeric, 4.8::numeric, 3.3::numeric, 0::numeric, 'USDA', true),
  ('Oats', 'generic'::public.food_type, 'raw'::public.measurement_state, 389::numeric, 16.9::numeric, 66.3::numeric, 6.9::numeric, 10.6::numeric, 'USDA', true)
) as seed(name, food_type, measurement_state, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, is_global)
where not exists (
  select 1 from public.foods f where f.name = seed.name and f.measurement_state = seed.measurement_state and f.is_global = true
);
