-- MacroTrack Together sharing v2.
-- Uses a JSONB payload so the client receives all shared fields consistently.

create or replace function public.group_shared_progress_v2(
  target_group uuid,
  selected_day date
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id', p.user_id,
        'name', p.name,

        'calorie_target',
          case when p.share_calories then p.calorie_target else null end,
        'protein_target',
          case when p.share_protein then p.protein_target else null end,
        'carb_target',
          case when p.share_carbs then p.carb_target else null end,
        'fat_target',
          case when p.share_fat then p.fat_target else null end,

        'calories',
          case when p.share_calories then coalesce((
            select sum(fl.calories)
            from public.food_logs fl
            where fl.user_id = p.user_id
              and fl.logged_at::date = selected_day
          ), 0) else null end,

        'protein',
          case when p.share_protein then coalesce((
            select sum(fl.protein)
            from public.food_logs fl
            where fl.user_id = p.user_id
              and fl.logged_at::date = selected_day
          ), 0) else null end,

        'carbs',
          case when p.share_carbs then coalesce((
            select sum(fl.carbs)
            from public.food_logs fl
            where fl.user_id = p.user_id
              and fl.logged_at::date = selected_day
          ), 0) else null end,

        'fat',
          case when p.share_fat then coalesce((
            select sum(fl.fat)
            from public.food_logs fl
            where fl.user_id = p.user_id
              and fl.logged_at::date = selected_day
          ), 0) else null end,

        'weight_kg',
          case when p.share_weight then (
            select wl.weight_kg
            from public.weight_logs wl
            where wl.user_id = p.user_id
            order by wl.logged_at desc
            limit 1
          ) else null end,

        'meal_details',
          case when p.share_meal_details then coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'name', coalesce(f.name, r.name, 'Food'),
                'meal', initcap(fl.meal::text),
                'grams', fl.quantity_grams,
                'calories', round(fl.calories),
                'protein', round(fl.protein, 1),
                'carbs', round(fl.carbs, 1),
                'fat', round(fl.fat, 1)
              )
              order by fl.logged_at
            )
            from public.food_logs fl
            left join public.foods f on f.id = fl.food_id
            left join public.recipes r on r.id = fl.recipe_id
            where fl.user_id = p.user_id
              and fl.logged_at::date = selected_day
          ), '[]'::jsonb) else '[]'::jsonb end
      )
      order by p.name
    ),
    '[]'::jsonb
  )
  from public.group_members gm
  join public.profiles p on p.user_id = gm.user_id
  where gm.group_id = target_group
    and public.is_group_member(target_group);
$$;

grant execute on function public.group_shared_progress_v2(uuid, date) to authenticated;
