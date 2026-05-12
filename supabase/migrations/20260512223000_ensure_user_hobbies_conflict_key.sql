-- Ensure /test/loading user_hobbies upsert has a matching conflict target.
-- Safe to run more than once in Supabase SQL editor.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_hobbies'::regclass
      and contype = 'p'
      and conname = 'user_hobbies_pkey'
  ) then
    delete from public.user_hobbies
    where user_id is null
      or hobby is null
      or btrim(hobby) = '';

    delete from public.user_hobbies hobby
    using (
      select
        ctid,
        row_number() over (
          partition by user_id, hobby
          order by created_at asc nulls last, ctid asc
        ) as duplicate_rank
      from public.user_hobbies
    ) ranked
    where hobby.ctid = ranked.ctid
      and ranked.duplicate_rank > 1;

    alter table public.user_hobbies
      alter column user_id set not null,
      alter column hobby set not null;

    alter table public.user_hobbies
      add constraint user_hobbies_pkey primary key (user_id, hobby);
  end if;
end $$;
