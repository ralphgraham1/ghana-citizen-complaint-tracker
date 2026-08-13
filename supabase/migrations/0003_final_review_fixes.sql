-- Final whole-branch code review hardening pass.

-- Fix 1: public complaint-status timeline was blank for every visitor because
-- complaint_status_history's RLS grants only cover `authenticated`, never
-- `anon`. Expose a minimal read-only view of just the columns the public
-- detail page needs, and grant anon (and authenticated, for consistency)
-- select on it.
create view complaint_status_history_public as
  select id, complaint_id, new_status, created_at from complaint_status_history;

grant select on complaint_status_history_public to anon, authenticated;

-- Fix 6: the complaint-photos bucket had no server-side size/type constraint;
-- the 5MB/image-type check in SubmitComplaintPage was UI-only and could be
-- bypassed by calling the Storage API directly.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
where id = 'complaint-photos';

-- Fix 7: profiles_select_staff_admin gave every department_staff account
-- read access to the entire profiles table (every citizen's name/phone),
-- even though no staff-facing page queries profiles. Unused, over-broad
-- access -- drop it. profiles_select_own and profiles_admin_all remain and
-- are sufficient for everything the app actually does.
drop policy "profiles_select_staff_admin" on profiles;

-- Fix 8: signUp() previously did auth.signUp() followed by a separate
-- profiles insert; if the second call failed, the auth.users row existed
-- with no matching profiles row, permanently locking the citizen out (email
-- already taken, but ProtectedRoute treats user-without-profile as
-- logged-out). Move profile creation into a trigger on auth.users so it's
-- atomic with account creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), 'citizen')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();
