-- Enums
create type user_role as enum ('citizen', 'department_staff', 'super_admin');
create type complaint_category as enum ('pothole', 'streetlight', 'waste_bin', 'drainage', 'infrastructure', 'other');
create type complaint_status as enum ('submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected');

-- Departments
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- Profiles (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'citizen',
  department_id uuid references departments(id),
  created_at timestamptz not null default now()
);

-- Complaints
create table complaints (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references profiles(id),
  category complaint_category not null,
  title text not null,
  description text not null,
  photo_url text,
  latitude double precision not null,
  longitude double precision not null,
  address_text text,
  status complaint_status not null default 'submitted',
  department_id uuid references departments(id),
  assigned_staff_id uuid references profiles(id),
  ai_suggested_category complaint_category,
  ai_suggested_department_id uuid references departments(id),
  ai_confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index complaints_citizen_id_idx on complaints(citizen_id);
create index complaints_department_id_idx on complaints(department_id);
create index complaints_status_idx on complaints(status);

-- Status history (immutable audit trail)
create table complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  old_status complaint_status,
  new_status complaint_status not null,
  changed_by uuid not null references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index complaint_status_history_complaint_id_idx on complaint_status_history(complaint_id);

-- Internal staff comments
create table complaint_comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  author_id uuid not null references profiles(id),
  comment text not null,
  created_at timestamptz not null default now()
);

create index complaint_comments_complaint_id_idx on complaint_comments(complaint_id);

-- Public-safe view: no citizen_id, assigned_staff_id, or AI fields exposed
create view complaints_public as
select
  id, category, title, description, photo_url, latitude, longitude,
  address_text, status, department_id, created_at, updated_at
from complaints;
