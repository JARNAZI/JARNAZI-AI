create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_free_trial_enabled boolean := true;
  initial_tokens int := 0;
begin
  -- Check if free trial is enabled in site_settings
  select (value = 'true') into is_free_trial_enabled 
  from public.site_settings 
  where key = 'enable_free_trial';

  if is_free_trial_enabled then
    initial_tokens := 1;
  end if;

  insert into public.profiles (id, email, full_name, token_balance)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', initial_tokens);
  return new;
end;
$$ language plpgsql security definer;
