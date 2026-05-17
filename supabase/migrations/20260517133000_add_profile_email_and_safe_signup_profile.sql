alter table public.profiles
  add column if not exists email text;

create index if not exists profiles_email_idx on public.profiles (lower(email))
where email is not null and btrim(email) <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_pseudo text := nullif(btrim(new.raw_user_meta_data->>'pseudo'), '');
  requested_study_level text := nullif(btrim(new.raw_user_meta_data->>'study_level'), '');
  safe_pseudo text := requested_pseudo;
begin
  if requested_study_level not in ('L1', 'L2', 'L3', 'PM', 'M1', 'M2', 'LAUREAT') then
    requested_study_level := null;
  end if;

  if safe_pseudo is not null and exists (
    select 1 from public.profiles
    where lower(pseudo) = lower(safe_pseudo)
      and id <> new.id
  ) then
    safe_pseudo := null;
  end if;

  insert into public.profiles (id, email, pseudo, study_level)
  values (
    new.id,
    nullif(btrim(new.email), ''),
    safe_pseudo,
    requested_study_level
  )
  on conflict (id) do update
  set
    email = coalesce(nullif(btrim(excluded.email), ''), public.profiles.email),
    pseudo = coalesce(public.profiles.pseudo, excluded.pseudo),
    study_level = coalesce(public.profiles.study_level, excluded.study_level),
    updated_at = now();
  return new;
end;
$$;
