-- Helper functions. SECURITY DEFINER + owned by the migration role (which owns
-- the tables) means these bypass RLS internally, avoiding infinite recursion
-- when a profiles-table RLS policy needs to know the caller's own role.
create or replace function public.current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_department_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select department_id from public.profiles where id = auth.uid();
$$;

alter table profiles enable row level security;
alter table departments enable row level security;
alter table complaints enable row level security;
alter table complaint_status_history enable row level security;
alter table complaint_comments enable row level security;

-- profiles
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_select_staff_admin" on profiles for select using (current_user_role() in ('department_staff', 'super_admin'));
create policy "profiles_insert_self" on profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on profiles for all using (current_user_role() = 'super_admin') with check (current_user_role() = 'super_admin');

-- Prevent a citizen from self-promoting to staff/admin, whether via the
-- insert-own-profile policy (self-registration) or the update-own-profile
-- policy. On INSERT there is no `old` row to fall back to, so a non-super-admin
-- caller is forced to 'citizen' / no department instead. service_role (the
-- already-fully-trusted admin/seed context, which bypasses RLS by design) is
-- exempted up front so admin seeding/provisioning scripts can still set
-- non-citizen roles directly -- this trigger only needs to constrain
-- ordinary authenticated end users.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.current_user_role() is distinct from 'super_admin' then
      new.role := 'citizen';
      new.department_id := null;
    end if;
    return new;
  end if;

  if public.current_user_role() is distinct from 'super_admin' then
    new.role := old.role;
    new.department_id := old.department_id;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before insert or update on profiles
  for each row execute function public.prevent_role_escalation();

-- departments
create policy "departments_select_all" on departments for select using (true);
create policy "departments_admin_insert" on departments for insert with check (current_user_role() = 'super_admin');
create policy "departments_admin_update" on departments for update using (current_user_role() = 'super_admin') with check (current_user_role() = 'super_admin');
create policy "departments_admin_delete" on departments for delete using (current_user_role() = 'super_admin');

-- complaints: SELECT/INSERT only. No direct UPDATE policy — all status and
-- assignment changes go through the SECURITY DEFINER RPCs below, which do
-- their own authorization and always log to complaint_status_history.
create policy "complaints_insert_citizen" on complaints for insert with check (citizen_id = auth.uid());
create policy "complaints_select_own" on complaints for select using (citizen_id = auth.uid());
create policy "complaints_select_staff" on complaints for select using (current_user_role() = 'department_staff' and department_id = current_user_department_id());
create policy "complaints_select_admin" on complaints for select using (current_user_role() = 'super_admin');

-- complaint_status_history: read-only to clients; only the trigger/RPCs below (as table owner) write to it.
create policy "history_select_own" on complaint_status_history for select using (
  exists (select 1 from complaints c where c.id = complaint_id and c.citizen_id = auth.uid())
);
create policy "history_select_staff" on complaint_status_history for select using (
  current_user_role() = 'department_staff' and exists (
    select 1 from complaints c where c.id = complaint_id and c.department_id = current_user_department_id()
  )
);
create policy "history_select_admin" on complaint_status_history for select using (current_user_role() = 'super_admin');

-- complaint_comments: internal to staff/admin, scoped to their department
create policy "comments_select_staff_admin" on complaint_comments for select using (
  current_user_role() = 'super_admin' or (
    current_user_role() = 'department_staff' and exists (
      select 1 from complaints c where c.id = complaint_id and c.department_id = current_user_department_id()
    )
  )
);
create policy "comments_insert_staff_admin" on complaint_comments for insert with check (
  author_id = auth.uid() and (
    current_user_role() = 'super_admin' or (
      current_user_role() = 'department_staff' and exists (
        select 1 from complaints c where c.id = complaint_id and c.department_id = current_user_department_id()
      )
    )
  )
);

-- Auto-log the initial "submitted" history entry when a complaint is created.
create or replace function public.log_initial_complaint_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into complaint_status_history (complaint_id, old_status, new_status, changed_by, note)
  values (new.id, null, new.status, new.citizen_id, null);
  return new;
end;
$$;

create trigger trg_log_initial_complaint_status
  after insert on complaints
  for each row execute function public.log_initial_complaint_status();

-- RPC: staff/admin status transitions. SECURITY DEFINER so it can write to
-- complaints + complaint_status_history in one authorized, validated step.
create or replace function public.update_complaint_status(
  p_complaint_id uuid,
  p_new_status complaint_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_complaint complaints%rowtype;
  v_old_status complaint_status;
  v_allowed complaint_status[];
begin
  select * into v_complaint from complaints where id = p_complaint_id;

  if v_complaint.id is null then
    raise exception 'Complaint not found';
  end if;

  if current_user_role() = 'department_staff' and (current_user_department_id() is null or v_complaint.department_id is distinct from current_user_department_id()) then
    raise exception 'Not authorized to update this complaint';
  elsif current_user_role() not in ('department_staff', 'super_admin') then
    raise exception 'Not authorized to update complaint status';
  end if;

  v_old_status := v_complaint.status;

  v_allowed := case v_old_status
    when 'submitted' then array['assigned', 'rejected']::complaint_status[]
    when 'assigned' then array['in_progress', 'rejected']::complaint_status[]
    when 'in_progress' then array['resolved', 'rejected']::complaint_status[]
    when 'resolved' then array['closed', 'in_progress']::complaint_status[]
    else array[]::complaint_status[]
  end;

  if not (p_new_status = any(v_allowed)) then
    raise exception 'Invalid status transition from % to %', v_old_status, p_new_status;
  end if;

  update complaints set status = p_new_status, updated_at = now() where id = p_complaint_id;

  insert into complaint_status_history (complaint_id, old_status, new_status, changed_by, note)
  values (p_complaint_id, v_old_status, p_new_status, auth.uid(), p_note);
end;
$$;

grant execute on function public.update_complaint_status(uuid, complaint_status, text) to authenticated;

-- RPC: super-admin assignment/reassignment. Also advances submitted -> assigned.
create or replace function public.assign_complaint(
  p_complaint_id uuid,
  p_department_id uuid,
  p_staff_id uuid default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_complaint complaints%rowtype;
  v_old_status complaint_status;
  v_new_status complaint_status;
begin
  if current_user_role() <> 'super_admin' then
    raise exception 'Only a super admin can assign complaints';
  end if;

  select * into v_complaint from complaints where id = p_complaint_id;
  if v_complaint.id is null then
    raise exception 'Complaint not found';
  end if;

  v_old_status := v_complaint.status;
  v_new_status := case when v_old_status = 'submitted' then 'assigned' else v_old_status end;

  update complaints
    set department_id = p_department_id, assigned_staff_id = p_staff_id, status = v_new_status, updated_at = now()
    where id = p_complaint_id;

  if v_new_status is distinct from v_old_status then
    insert into complaint_status_history (complaint_id, old_status, new_status, changed_by, note)
    values (p_complaint_id, v_old_status, v_new_status, auth.uid(), coalesce(p_note, 'Assigned to department'));
  end if;
end;
$$;

grant execute on function public.assign_complaint(uuid, uuid, uuid, text) to authenticated;

-- Explicit deny-by-default backstop: revoke Supabase's default broad
-- ALTER-DEFAULT-PRIVILEGES grants before re-granting only what's needed below,
-- so RLS isn't the sole line of defense if a future migration adds a policy.
revoke all on profiles, departments, complaints, complaint_status_history, complaint_comments from anon, authenticated;

-- Table-level grants (RLS policies above further restrict which rows/roles apply)
grant select, insert on profiles to authenticated;
grant update on profiles to authenticated;
grant select on departments to anon, authenticated;
grant insert, update, delete on departments to authenticated;
grant select, insert on complaints to authenticated;
grant select on complaint_status_history to authenticated;
grant select, insert on complaint_comments to authenticated;
grant select on complaints_public to anon, authenticated;

-- Storage: public bucket for complaint photos, upload restricted to the
-- authenticated user's own folder (first path segment = their user id).
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

create policy "photo_upload_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'complaint-photos' and (storage.foldername(name))[1] = auth.uid()::text);
