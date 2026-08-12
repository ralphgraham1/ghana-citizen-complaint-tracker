# Ghana Citizen Service & Complaint Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a working web platform where citizens report public-infrastructure issues (with AI-assisted category suggestion), department staff triage and resolve them, a super admin manages departments/staff/assignment, and the public can track every complaint's status without logging in.

**Architecture:** Vite + React + TypeScript single-page app, styled with TailwindCSS + shadcn/ui, routed with React Router. Supabase (Postgres + Auth + Storage + Row-Level Security) is the entire backend — no custom CRUD server. The one exception is a single Vercel serverless function (`api/classify-complaint.ts`) that proxies a Claude API call so the API key never reaches the browser. All complaint status/assignment mutations go through two Postgres `SECURITY DEFINER` RPC functions (not raw table updates), which keeps every state transition centrally authorized and auto-logged to an immutable history table.

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, TailwindCSS, shadcn/ui, react-leaflet + OpenStreetMap, Supabase JS client v2, `@anthropic-ai/sdk`, Vitest, deployed on Vercel.

## Global Constraints

- Node 18+ and npm are assumed as the toolchain.
- TypeScript strict mode is enabled project-wide; no `any` in hand-written code.
- All styling goes through Tailwind utility classes and shadcn/ui components — no separate hand-rolled CSS files beyond `src/index.css` (Tailwind directives + shadcn CSS variables).
- Fixed enums used consistently everywhere (DB, TypeScript, AI prompt) — never re-derive or rename these strings:
  - `ComplaintCategory`: `pothole` | `streetlight` | `waste_bin` | `drainage` | `infrastructure` | `other`
  - `ComplaintStatus`: `submitted` | `assigned` | `in_progress` | `resolved` | `closed` | `rejected`
  - `UserRole`: `citizen` | `department_staff` | `super_admin`
- Department names are fixed seed data: `Roads & Highways`, `Sanitation & Waste Management`, `Water & Drainage`, `Electricity & Streetlighting`.
- Default map center is Accra: `[5.6037, -0.1870]`.
- The Supabase project must have **email confirmation disabled** in Auth settings (Authentication → Providers → Email → "Confirm email" off) so citizen self-registration works without an email step — this is a documented scope decision for the 48-hour demo, not an oversight.
- All complaint status/department-assignment changes go through the `update_complaint_status` and `assign_complaint` Postgres RPC functions defined in Task 3 — never a direct `UPDATE` on the `complaints` table from client code.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `components.json`

**Interfaces:**
- Produces: an `App` React component rendered into `#root`; a working `npm run dev` / `npm run build` / `npm run test` toolchain; Tailwind + shadcn/ui ready for component generation via `npx shadcn@latest add <component>`.

- [ ] **Step 1: Initialize the Vite React-TS project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted about a non-empty directory (the `docs/` folder already exists), confirm to proceed in the current directory.

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm install react-router-dom @supabase/supabase-js react-leaflet leaflet clsx tailwind-merge class-variance-authority lucide-react
npm install -D tailwindcss@3 postcss autoprefixer vitest @types/leaflet
```

- [ ] **Step 3: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

Replace the generated `tailwind.config.js` by creating `tailwind.config.ts` instead (delete `tailwind.config.js` after):

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

```bash
npm install -D tailwindcss-animate
rm tailwind.config.js
```

- [ ] **Step 4: Set up shadcn/ui**

```bash
npx shadcn@latest init -d
```

This creates `components.json`, updates `src/index.css` with CSS variables, and configures the `@/` import alias. Confirm `tsconfig.json` contains:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Then install the shadcn components this project needs:

```bash
npx shadcn@latest add button input textarea select label card badge tabs dialog table
```

- [ ] **Step 5: Add environment template and gitignore entries**

Create `.env.example`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

Ensure `.gitignore` contains at least:
```
node_modules
dist
.env
.env.local
```

- [ ] **Step 6: Replace `src/App.tsx` with a placeholder that will be filled in by Task 7**

```tsx
function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Ghana Citizen Service &amp; Complaint Tracker</p>
    </div>
  )
}

export default App
```

- [ ] **Step 7: Verify the toolchain**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

Run: `npm run dev` (then stop it with Ctrl+C once you see it serving on `http://localhost:5173`)
Expected: dev server starts without errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite/React/TS project with Tailwind and shadcn/ui"
```

---

### Task 2: Database Schema Migration

**Files:**
- Create: `supabase/migrations/0001_init_schema.sql`

**Interfaces:**
- Produces: tables `profiles`, `departments`, `complaints`, `complaint_status_history`, `complaint_comments`; enums `user_role`, `complaint_category`, `complaint_status`; view `complaints_public` with columns `id, category, title, description, photo_url, latitude, longitude, address_text, status, department_id, created_at, updated_at`.

- [ ] **Step 1: Write the schema migration**

Create `supabase/migrations/0001_init_schema.sql`:

```sql
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
```

- [ ] **Step 2: Apply the migration to your Supabase project**

Run (via the Supabase SQL editor in the dashboard, or `supabase db push` if using the Supabase CLI linked to your project):

```bash
supabase db push
```

Expected: no errors; the 5 tables/view and 3 enums exist under the `public` schema (verify in Supabase Studio → Table Editor).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init_schema.sql
git commit -m "feat(db): add core schema for departments, profiles, complaints, history, comments"
```

---

### Task 3: Security Migration — RLS, Helper Functions, Triggers, RPCs, Storage

**Files:**
- Create: `supabase/migrations/0002_security.sql`

**Interfaces:**
- Consumes: schema from Task 2.
- Produces: SQL functions `current_user_role()`, `current_user_department_id()`; RPCs `update_complaint_status(p_complaint_id uuid, p_new_status complaint_status, p_note text)` and `assign_complaint(p_complaint_id uuid, p_department_id uuid, p_staff_id uuid, p_note text)`, both callable via `supabase.rpc(...)` from the client; storage bucket `complaint-photos` (public read, authenticated upload scoped to `${auth.uid()}/...` paths).

- [ ] **Step 1: Write the security migration**

Create `supabase/migrations/0002_security.sql`:

```sql
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

-- Prevent a citizen from self-promoting to staff/admin via the update-own-profile policy.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() is distinct from 'super_admin' then
    new.role := old.role;
    new.department_id := old.department_id;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on profiles
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

  if current_user_role() = 'department_staff' and v_complaint.department_id is distinct from current_user_department_id() then
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
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push`
Expected: no errors. In Supabase Studio, confirm RLS is enabled (shield icon) on all 5 tables, and the `complaint-photos` bucket exists under Storage.

- [ ] **Step 3: Manually verify RLS with two throwaway accounts**

In Supabase Studio's SQL editor or via the app once Task 7 is done, confirm: a citizen cannot `select` another citizen's complaint row; an unauthenticated (`anon`) request can `select` from `complaints_public` but gets rejected on `complaints` directly.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_security.sql
git commit -m "feat(db): add RLS policies, status-transition RPCs, and photo storage bucket"
```

---

### Task 4: Seed Data — Departments and Demo Accounts

**Files:**
- Create: `supabase/seed.sql`
- Create: `scripts/seedDemoUsers.mjs`
- Modify: `package.json` (add `"seed"` script)

**Interfaces:**
- Consumes: schema/RLS from Tasks 2–3.
- Produces: 4 seeded departments; 3 demo auth accounts (citizen, department_staff, super_admin) with matching `profiles` rows, whose credentials are recorded for later use in the deployment doc (Task 15).

- [ ] **Step 1: Seed departments**

Create `supabase/seed.sql`:

```sql
insert into departments (name, description) values
  ('Roads & Highways', 'Potholes, damaged roads, and general road infrastructure'),
  ('Sanitation & Waste Management', 'Overflowing bins and waste collection issues'),
  ('Water & Drainage', 'Drainage blockages and flooding-related infrastructure'),
  ('Electricity & Streetlighting', 'Broken or non-functional streetlights')
on conflict (name) do nothing;
```

Run: `supabase db push` (or run the file's contents directly in the SQL editor) to apply it.
Expected: 4 rows in `departments`.

- [ ] **Step 2: Write the demo-user seed script**

Create `scripts/seedDemoUsers.mjs`:

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_USERS = [
  { email: 'citizen.demo@example.com', password: 'DemoCitizen123!', full_name: 'Ama Demo', role: 'citizen' },
  { email: 'staff.demo@example.com', password: 'DemoStaff123!', full_name: 'Kofi Demo', role: 'department_staff', departmentName: 'Roads & Highways' },
  { email: 'admin.demo@example.com', password: 'DemoAdmin123!', full_name: 'Akosua Demo', role: 'super_admin' },
]

async function main() {
  const { data: departments, error: deptError } = await admin.from('departments').select('id, name')
  if (deptError) throw deptError

  for (const demoUser of DEMO_USERS) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      email_confirm: true,
    })

    if (createError) {
      console.error(`Failed to create ${demoUser.email}:`, createError.message)
      continue
    }

    const departmentId = demoUser.departmentName
      ? departments.find((d) => d.name === demoUser.departmentName)?.id ?? null
      : null

    const { error: profileError } = await admin.from('profiles').insert({
      id: created.user.id,
      full_name: demoUser.full_name,
      role: demoUser.role,
      department_id: departmentId,
    })

    if (profileError) {
      console.error(`Failed to create profile for ${demoUser.email}:`, profileError.message)
      continue
    }

    console.log(`Created ${demoUser.role}: ${demoUser.email} / ${demoUser.password}`)
  }
}

main().then(() => process.exit(0))
```

- [ ] **Step 3: Add the seed script to `package.json`**

```json
{
  "scripts": {
    "seed": "node scripts/seedDemoUsers.mjs"
  }
}
```

- [ ] **Step 4: Run it against the Supabase project**

```bash
SUPABASE_URL=<your-project-url> SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> npm run seed
```

Expected: three "Created ..." lines printed. Verify in Supabase Studio → Authentication that 3 users exist, and in Table Editor that 3 matching `profiles` rows exist with the correct `role`/`department_id`.

- [ ] **Step 5: Record the credentials for later**

Save the three email/password pairs somewhere you'll reuse in Task 15's deployment doc — they're the grader's test credentials.

- [ ] **Step 6: Commit**

```bash
git add supabase/seed.sql scripts/seedDemoUsers.mjs package.json
git commit -m "feat(db): seed departments and demo accounts for all three roles"
```

---

### Task 5: Supabase Client, Shared Types, Auth Context

**Files:**
- Create: `src/lib/supabaseClient.ts`
- Create: `src/lib/types.ts`
- Create: `src/hooks/useAuth.tsx`

**Interfaces:**
- Consumes: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars.
- Produces: `supabase: SupabaseClient` (import from `@/lib/supabaseClient`); types `UserRole`, `ComplaintCategory`, `ComplaintStatus`, `Department`, `Profile`, `Complaint`, `PublicComplaint`, `ComplaintStatusHistory`, `ComplaintComment` (import from `@/lib/types`); `AuthProvider` component and `useAuth()` hook returning `{ user, profile, loading, signIn, signUp, signOut }` (import from `@/hooks/useAuth`).

- [ ] **Step 1: Create the Supabase client**

Create `src/lib/supabaseClient.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
}

export const supabase = createClient(url, anonKey)
```

- [ ] **Step 2: Create shared TypeScript types**

Create `src/lib/types.ts`:

```ts
export type UserRole = 'citizen' | 'department_staff' | 'super_admin'

export type ComplaintCategory = 'pothole' | 'streetlight' | 'waste_bin' | 'drainage' | 'infrastructure' | 'other'

export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected'

export interface Department {
  id: string
  name: string
  description: string | null
}

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  department_id: string | null
  created_at: string
}

export interface Complaint {
  id: string
  citizen_id: string
  category: ComplaintCategory
  title: string
  description: string
  photo_url: string | null
  latitude: number
  longitude: number
  address_text: string | null
  status: ComplaintStatus
  department_id: string | null
  assigned_staff_id: string | null
  ai_suggested_category: ComplaintCategory | null
  ai_suggested_department_id: string | null
  ai_confidence: number | null
  created_at: string
  updated_at: string
}

export interface PublicComplaint {
  id: string
  category: ComplaintCategory
  title: string
  description: string
  photo_url: string | null
  latitude: number
  longitude: number
  address_text: string | null
  status: ComplaintStatus
  department_id: string | null
  created_at: string
  updated_at: string
}

export interface ComplaintStatusHistory {
  id: string
  complaint_id: string
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  changed_by: string
  note: string | null
  created_at: string
}

export interface ComplaintComment {
  id: string
  complaint_id: string
  author_id: string
  comment: string
  created_at: string
}
```

- [ ] **Step 3: Create the auth context/hook**

Create `src/hooks/useAuth.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile((data as Profile) ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, full_name: fullName })
      if (profileError) return { error: profileError.message }
    }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: no TypeScript errors (this task adds no consumers yet, so nothing renders differently).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabaseClient.ts src/lib/types.ts src/hooks/useAuth.tsx
git commit -m "feat: add Supabase client, shared types, and auth context"
```

---

### Task 6: Category Routing and Status Transition Utilities (TDD)

**Files:**
- Create: `src/lib/categoryRouting.ts`
- Create: `src/lib/statusTransitions.ts`
- Test: `tests/categoryRouting.test.ts`
- Test: `tests/statusTransitions.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: `ComplaintCategory`, `ComplaintStatus`, `Department` from `@/lib/types` (Task 5).
- Produces: `suggestDepartmentId(category, departments): string | null` and `CATEGORY_TO_DEPARTMENT_NAME` (from `@/lib/categoryRouting`); `isValidTransition(from, to): boolean` and `ALLOWED_TRANSITIONS` (from `@/lib/statusTransitions`) — used by Task 9 (submission form) and Task 12 (staff status update UI) to disable invalid options client-side (the RPC in Task 3 is the source of truth; this is a UX layer on top).

- [ ] **Step 1: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: { environment: 'node' },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing test for category routing**

Create `tests/categoryRouting.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { suggestDepartmentId } from '@/lib/categoryRouting'
import type { Department } from '@/lib/types'

const departments: Department[] = [
  { id: '1', name: 'Roads & Highways', description: null },
  { id: '2', name: 'Electricity & Streetlighting', description: null },
  { id: '3', name: 'Sanitation & Waste Management', description: null },
  { id: '4', name: 'Water & Drainage', description: null },
]

describe('suggestDepartmentId', () => {
  it('routes pothole to Roads & Highways', () => {
    expect(suggestDepartmentId('pothole', departments)).toBe('1')
  })

  it('routes infrastructure to Roads & Highways', () => {
    expect(suggestDepartmentId('infrastructure', departments)).toBe('1')
  })

  it('routes streetlight to Electricity & Streetlighting', () => {
    expect(suggestDepartmentId('streetlight', departments)).toBe('2')
  })

  it('routes waste_bin to Sanitation & Waste Management', () => {
    expect(suggestDepartmentId('waste_bin', departments)).toBe('3')
  })

  it('routes drainage to Water & Drainage', () => {
    expect(suggestDepartmentId('drainage', departments)).toBe('4')
  })

  it('returns null for category "other"', () => {
    expect(suggestDepartmentId('other', departments)).toBeNull()
  })

  it('returns null when the matching department is missing from the list', () => {
    expect(suggestDepartmentId('pothole', [])).toBeNull()
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/categoryRouting.test.ts`
Expected: FAIL — `Cannot find module '@/lib/categoryRouting'`.

- [ ] **Step 4: Implement `categoryRouting.ts`**

Create `src/lib/categoryRouting.ts`:

```ts
import type { ComplaintCategory, Department } from '@/lib/types'

export const CATEGORY_TO_DEPARTMENT_NAME: Record<ComplaintCategory, string | null> = {
  pothole: 'Roads & Highways',
  infrastructure: 'Roads & Highways',
  streetlight: 'Electricity & Streetlighting',
  waste_bin: 'Sanitation & Waste Management',
  drainage: 'Water & Drainage',
  other: null,
}

export function suggestDepartmentId(category: ComplaintCategory, departments: Department[]): string | null {
  const name = CATEGORY_TO_DEPARTMENT_NAME[category]
  if (!name) return null
  return departments.find((d) => d.name === name)?.id ?? null
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run tests/categoryRouting.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 6: Write the failing test for status transitions**

Create `tests/statusTransitions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isValidTransition } from '@/lib/statusTransitions'

describe('isValidTransition', () => {
  it('allows submitted -> assigned', () => {
    expect(isValidTransition('submitted', 'assigned')).toBe(true)
  })

  it('allows submitted -> rejected', () => {
    expect(isValidTransition('submitted', 'rejected')).toBe(true)
  })

  it('disallows submitted -> resolved (must go through assigned/in_progress)', () => {
    expect(isValidTransition('submitted', 'resolved')).toBe(false)
  })

  it('allows resolved -> closed', () => {
    expect(isValidTransition('resolved', 'closed')).toBe(true)
  })

  it('allows resolved -> in_progress (reopen)', () => {
    expect(isValidTransition('resolved', 'in_progress')).toBe(true)
  })

  it('disallows any transition out of closed', () => {
    expect(isValidTransition('closed', 'in_progress')).toBe(false)
  })

  it('disallows any transition out of rejected', () => {
    expect(isValidTransition('rejected', 'assigned')).toBe(false)
  })
})
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx vitest run tests/statusTransitions.test.ts`
Expected: FAIL — `Cannot find module '@/lib/statusTransitions'`.

- [ ] **Step 8: Implement `statusTransitions.ts`**

Create `src/lib/statusTransitions.ts`:

```ts
import type { ComplaintStatus } from '@/lib/types'

export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  submitted: ['assigned', 'rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['closed', 'in_progress'],
  closed: [],
  rejected: [],
}

export function isValidTransition(from: ComplaintStatus, to: ComplaintStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}
```

Note: this list intentionally mirrors the `v_allowed` logic inside the `update_complaint_status` SQL function from Task 3. The duplication crosses a language boundary (TS ↔ SQL) and is documented as acceptable technical debt in the spec — the SQL version is the enforced source of truth; this one only drives which options the UI offers.

- [ ] **Step 9: Run it to verify it passes**

Run: `npx vitest run tests/statusTransitions.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 10: Run the full test suite**

Run: `npm run test`
Expected: 14 tests passing, 0 failing.

- [ ] **Step 11: Commit**

```bash
git add src/lib/categoryRouting.ts src/lib/statusTransitions.ts tests/ vitest.config.ts package.json
git commit -m "feat: add category-routing and status-transition utilities with unit tests"
```

---

### Task 7: Auth Pages, Protected Routing, App Shell

**Files:**
- Create: `src/components/layout/ProtectedRoute.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/RegisterPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `useAuth()` from Task 5.
- Produces: `<ProtectedRoute allowedRoles={UserRole[]} />` (route guard component used as a wrapping route in `App.tsx`); route paths `/login`, `/register`, `/submit`, `/my-reports`, `/staff`, `/admin` that later tasks add pages under.

- [ ] **Step 1: Wrap the app in `AuthProvider` and `BrowserRouter`**

Modify `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 2: Create the protected-route guard**

Create `src/components/layout/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/types'

export function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>
  if (!user || !profile) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />

  return <Outlet />
}
```

- [ ] **Step 3: Create the navbar**

Create `src/components/layout/Navbar.tsx`:

```tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <Link to="/" className="font-semibold">
        Ghana Citizen Report
      </Link>
      <div className="flex items-center gap-3 text-sm">
        {!user && (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">
              <Button size="sm">Report an issue</Button>
            </Link>
          </>
        )}
        {user && profile?.role === 'citizen' && (
          <>
            <Link to="/submit">Submit</Link>
            <Link to="/my-reports">My Reports</Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
          </>
        )}
        {user && profile?.role === 'department_staff' && (
          <>
            <Link to="/staff">My Queue</Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
          </>
        )}
        {user && profile?.role === 'super_admin' && (
          <>
            <Link to="/admin">Admin</Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
          </>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create the login page**

Create `src/pages/LoginPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/')
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Create the register page**

Create `src/pages/RegisterPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signUp(email, password, fullName)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/login')
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Create a citizen account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Wire up `App.tsx` with the route skeleton**

Modify `src/App.tsx` (placeholder routes for pages added in later tasks — this task only wires auth + guard structure, so unimplemented routes render a temporary "Coming soon" placeholder that later tasks replace):

```tsx
import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

function ComingSoon({ label }: { label: string }) {
  return <div className="p-8 text-muted-foreground">{label} — coming soon.</div>
}

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<ComingSoon label="Public dashboard" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route path="/submit" element={<ComingSoon label="Submit complaint" />} />
          <Route path="/my-reports" element={<ComingSoon label="My reports" />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['department_staff']} />}>
          <Route path="/staff" element={<ComingSoon label="Staff queue" />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/admin" element={<ComingSoon label="Admin dashboard" />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
```

- [ ] **Step 7: Manually verify**

Run: `npm run dev`, open `http://localhost:5173`.
Expected: public dashboard placeholder loads; `/register` creates a citizen account (check Supabase Studio for the new `auth.users` + `profiles` rows); `/login` with the demo citizen account from Task 4 logs in and the navbar switches to the citizen menu; visiting `/admin` while logged in as the demo citizen redirects to `/`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add login/register pages, protected routing, and app shell"
```

---

### Task 8: AI Classification — Serverless Function and Client Helper

**Files:**
- Create: `api/classify-complaint.ts`
- Create: `src/lib/aiClassification.ts`
- Create: `src/hooks/useDebouncedValue.ts`

**Interfaces:**
- Consumes: `ANTHROPIC_API_KEY` server env var (never exposed to the client).
- Produces: HTTP endpoint `POST /api/classify-complaint` accepting `{ description: string }`, returning `{ category: ComplaintCategory, department: string, confidence: number }` on success or a non-200 status on failure; client helper `classifyDescription(description: string): Promise<{ category: ComplaintCategory; confidence: number } | null>` (from `@/lib/aiClassification`, returns `null` on any failure/timeout — callers must treat `null` as "fall back to manual"); `useDebouncedValue<T>(value: T, delayMs: number): T` (from `@/hooks/useDebouncedValue`) — used by Task 9's submission form.

- [ ] **Step 1: Install the Anthropic SDK and Vercel Node types**

```bash
npm install @anthropic-ai/sdk
npm install -D @vercel/node
```

- [ ] **Step 2: Write the serverless function**

Create `api/classify-complaint.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const CATEGORIES = ['pothole', 'streetlight', 'waste_bin', 'drainage', 'infrastructure', 'other'] as const
type Category = (typeof CATEGORIES)[number]

const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  pothole: 'Roads & Highways',
  infrastructure: 'Roads & Highways',
  streetlight: 'Electricity & Streetlighting',
  waste_bin: 'Sanitation & Waste Management',
  drainage: 'Water & Drainage',
  other: 'Unassigned',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { description } = req.body ?? {}
  if (typeof description !== 'string' || description.trim().length < 5) {
    res.status(400).json({ error: 'description must be a string of at least 5 characters' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: missing ANTHROPIC_API_KEY' })
    return
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system:
        'You classify Ghanaian public-infrastructure complaints into exactly one category from this fixed list: pothole, streetlight, waste_bin, drainage, infrastructure, other. Respond with ONLY the category word, nothing else.',
      messages: [{ role: 'user', content: description.slice(0, 2000) }],
    })

    const firstBlock = message.content[0]
    const text = firstBlock.type === 'text' ? firstBlock.text.trim().toLowerCase() : ''
    const category: Category = (CATEGORIES as readonly string[]).includes(text) ? (text as Category) : 'other'

    res.status(200).json({
      category,
      department: DEPARTMENT_BY_CATEGORY[category],
      confidence: category === 'other' ? 0.3 : 0.8,
    })
  } catch (err) {
    res.status(502).json({ error: 'AI classification unavailable', detail: (err as Error).message })
  }
}
```

- [ ] **Step 3: Write the client-side debounce hook**

Create `src/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
```

- [ ] **Step 4: Write the client-side classification helper**

Create `src/lib/aiClassification.ts`:

```ts
import type { ComplaintCategory } from '@/lib/types'

interface ClassificationResult {
  category: ComplaintCategory
  confidence: number
}

export async function classifyDescription(description: string): Promise<ClassificationResult | null> {
  try {
    const res = await fetch('/api/classify-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { category: data.category as ComplaintCategory, confidence: data.confidence as number }
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Verify locally with the Vercel CLI**

```bash
npm install -D vercel
ANTHROPIC_API_KEY=<your-key> npx vercel dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/classify-complaint \
  -H "Content-Type: application/json" \
  -d '{"description":"There is a large pothole on the main road near the market causing traffic."}'
```

Expected: `{"category":"pothole","department":"Roads & Highways","confidence":0.8}`.

Also verify the fallback path:
```bash
curl -X POST http://localhost:3000/api/classify-complaint -H "Content-Type: application/json" -d '{"description":"hi"}'
```
Expected: HTTP 400 (description too short) — confirms the function validates input before calling the AI.

- [ ] **Step 6: Commit**

```bash
git add api/classify-complaint.ts src/lib/aiClassification.ts src/hooks/useDebouncedValue.ts package.json
git commit -m "feat: add AI complaint-classification serverless function and client helper"
```

---

### Task 9: Complaint Submission (Map Picker, Photo Upload, AI-Assisted Category)

**Files:**
- Create: `src/components/complaints/ComplaintMap.tsx`
- Create: `src/hooks/useDepartments.ts`
- Create: `src/pages/SubmitComplaintPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `classifyDescription` (Task 8), `useDebouncedValue` (Task 8), `suggestDepartmentId` (Task 6), `useAuth` (Task 5), `supabase` client (Task 5).
- Produces: `<ComplaintMap complaints? pickable? pickedLocation? onPick? onMarkerClick? />` reusable map component (used again by Tasks 10–12); `useDepartments(): { departments: Department[]; loading: boolean }`; route `/submit`.

- [ ] **Step 1: Install Leaflet CSS and the map component**

In `src/main.tsx`, add near the top: `import 'leaflet/dist/leaflet.css'`.

Create `src/components/complaints/ComplaintMap.tsx`:

```tsx
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Complaint, PublicComplaint } from '@/lib/types'

const ACCRA_CENTER: [number, number] = [5.6037, -0.187]

const STATUS_COLOR: Record<string, string> = {
  submitted: '#eab308',
  assigned: '#3b82f6',
  in_progress: '#f97316',
  resolved: '#22c55e',
  closed: '#6b7280',
  rejected: '#ef4444',
}

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.5)"></div>`,
    iconSize: [14, 14],
  })
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

interface ComplaintMapProps {
  complaints?: (Complaint | PublicComplaint)[]
  pickable?: boolean
  pickedLocation?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  onMarkerClick?: (complaintId: string) => void
}

export function ComplaintMap({ complaints = [], pickable = false, pickedLocation, onPick, onMarkerClick }: ComplaintMapProps) {
  return (
    <MapContainer center={ACCRA_CENTER} zoom={7} style={{ height: '400px', width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pickable && onPick && <ClickCatcher onPick={onPick} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={markerIcon('#3b82f6')} />}
      {complaints.map((c) => (
        <Marker
          key={c.id}
          position={[c.latitude, c.longitude]}
          icon={markerIcon(STATUS_COLOR[c.status] ?? '#6b7280')}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(c.id) } : undefined}
        >
          <Popup>
            <strong>{c.title}</strong>
            <br />
            {c.status.replace('_', ' ')}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

- [ ] **Step 2: Create the departments hook**

Create `src/hooks/useDepartments.ts`:

```ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/lib/types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('departments')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setDepartments((data as Department[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { departments, loading }
}
```

- [ ] **Step 3: Build the submission page**

Create `src/pages/SubmitComplaintPage.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDepartments } from '@/hooks/useDepartments'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { classifyDescription } from '@/lib/aiClassification'
import { suggestDepartmentId } from '@/lib/categoryRouting'
import { supabase } from '@/lib/supabaseClient'
import type { ComplaintCategory } from '@/lib/types'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  pothole: 'Pothole',
  streetlight: 'Broken streetlight',
  waste_bin: 'Overflowing waste bin',
  drainage: 'Drainage problem',
  infrastructure: 'Damaged public infrastructure',
  other: 'Other',
}

export function SubmitComplaintPage() {
  const { user } = useAuth()
  const { departments } = useDepartments()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ComplaintCategory>('other')
  const [aiSuggestion, setAiSuggestion] = useState<{ category: ComplaintCategory; confidence: number } | null>(null)
  const [addressText, setAddressText] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedDescription = useDebouncedValue(description, 800)

  useEffect(() => {
    if (debouncedDescription.trim().length < 15) return
    let cancelled = false
    classifyDescription(debouncedDescription).then((result) => {
      if (cancelled || !result) return
      setAiSuggestion(result)
      setCategory(result.category)
    })
    return () => {
      cancelled = true
    }
  }, [debouncedDescription])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!location) {
      setError('Please click the map to mark the location of the issue.')
      return
    }
    setSubmitting(true)
    setError(null)

    if (photoFile && (!photoFile.type.startsWith('image/') || photoFile.size > 5 * 1024 * 1024)) {
      setSubmitting(false)
      setError('Photo must be an image file under 5MB.')
      return
    }

    let photoUrl: string | null = null
    if (photoFile) {
      const path = `${user.id}/${crypto.randomUUID()}-${photoFile.name}`
      const { error: uploadError } = await supabase.storage.from('complaint-photos').upload(path, photoFile)
      if (uploadError) {
        setSubmitting(false)
        setError(`Photo upload failed: ${uploadError.message}`)
        return
      }
      photoUrl = supabase.storage.from('complaint-photos').getPublicUrl(path).data.publicUrl
    }

    const departmentId = suggestDepartmentId(category, departments)

    const { error: insertError } = await supabase.from('complaints').insert({
      citizen_id: user.id,
      category,
      title,
      description,
      photo_url: photoUrl,
      latitude: location.lat,
      longitude: location.lng,
      address_text: addressText || null,
      department_id: departmentId,
      ai_suggested_category: aiSuggestion?.category ?? null,
      ai_confidence: aiSuggestion?.confidence ?? null,
    })

    setSubmitting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    navigate('/my-reports')
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Report an issue</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
          {aiSuggestion && (
            <p className="mt-1 text-xs text-muted-foreground">
              AI suggested category: <strong>{CATEGORY_LABELS[aiSuggestion.category]}</strong> — review and change it below if it's wrong.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="address">Landmark / address (optional)</Label>
          <Input id="address" value={addressText} onChange={(e) => setAddressText(e.target.value)} />
        </div>

        <div>
          <Label>Location — click the map to mark the issue</Label>
          <ComplaintMap pickable pickedLocation={location} onPick={(lat, lng) => setLocation({ lat, lng })} />
        </div>

        <div>
          <Label htmlFor="photo">Photo (optional)</Label>
          <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Wire the route into `App.tsx`**

In `src/App.tsx`, replace `<Route path="/submit" element={<ComingSoon label="Submit complaint" />} />` with:

```tsx
import { SubmitComplaintPage } from '@/pages/SubmitComplaintPage'
// ...
<Route path="/submit" element={<SubmitComplaintPage />} />
```

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, log in as the demo citizen, go to `/submit`. Type a description like "There's a broken streetlight outside my house on Ring Road" and wait ~1 second — confirm the category select auto-switches to "Broken streetlight" and the AI-suggestion note appears (requires `api/classify-complaint.ts` reachable, i.e. run via `vercel dev` per Task 8, or temporarily point `fetch` at a deployed preview URL). Click the map to place a pin, attach a photo, submit. Expected: redirected to `/my-reports`; in Supabase Studio, the new row in `complaints` has `department_id` set to Electricity & Streetlighting's id and `photo_url` populated; the `complaint-photos` bucket has the uploaded file under `<user-id>/...`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add complaint submission form with map picker, photo upload, and AI category suggestion"
```

---

### Task 10: Citizen "My Reports" and Complaint Detail

**Files:**
- Create: `src/components/complaints/StatusBadge.tsx`
- Create: `src/components/complaints/StatusHistoryTimeline.tsx`
- Create: `src/components/complaints/ComplaintCard.tsx`
- Create: `src/hooks/useComplaints.ts`
- Create: `src/pages/MyReportsPage.tsx`
- Create: `src/pages/CitizenComplaintDetailPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ComplaintMap` (Task 9), `useAuth` (Task 5), `supabase` (Task 5).
- Produces: `<StatusBadge status={ComplaintStatus} />`, `<StatusHistoryTimeline history={ComplaintStatusHistory[]} />`, `<ComplaintCard complaint={Complaint | PublicComplaint} to={string} />` (all reused by Tasks 11–12); `useMyComplaints(citizenId)`, `useDepartmentComplaints(departmentId)`, `useAllComplaints()`, `usePublicComplaints()` (all from `@/hooks/useComplaints`, reused by Tasks 11–14); routes `/my-reports`, `/my-reports/:id`.

- [ ] **Step 1: Create `StatusBadge`**

Create `src/components/complaints/StatusBadge.tsx`:

```tsx
import type { ComplaintStatus } from '@/lib/types'

const LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
}

const CLASSES: Record<ComplaintStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>{LABELS[status]}</span>
}
```

- [ ] **Step 2: Create `StatusHistoryTimeline`**

Create `src/components/complaints/StatusHistoryTimeline.tsx`:

```tsx
import type { ComplaintStatusHistory } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

export function StatusHistoryTimeline({ history }: { history: ComplaintStatusHistory[] }) {
  const sorted = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <ol className="space-y-3">
      {sorted.map((entry) => (
        <li key={entry.id} className="border-l-2 border-muted pl-3">
          <StatusBadge status={entry.new_status} />
          <p className="mt-1 text-sm text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
          {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 3: Create `ComplaintCard`**

Create `src/components/complaints/ComplaintCard.tsx`:

```tsx
import { Link } from 'react-router-dom'
import type { Complaint, PublicComplaint } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

export function ComplaintCard({ complaint, to }: { complaint: Complaint | PublicComplaint; to: string }) {
  return (
    <Link to={to} className="block rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{complaint.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {complaint.address_text ?? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Create the complaint-fetching hooks**

Create `src/hooks/useComplaints.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Complaint, PublicComplaint } from '@/lib/types'

export function useMyComplaints(citizenId: string | undefined) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!citizenId) return
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').eq('citizen_id', citizenId).order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setLoading(false)
  }, [citizenId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, refetch }
}

export function useDepartmentComplaints(departmentId: string | undefined | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!departmentId) return
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').eq('department_id', departmentId).order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setLoading(false)
  }, [departmentId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, refetch }
}

export function useAllComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, refetch }
}

export function usePublicComplaints() {
  const [complaints, setComplaints] = useState<PublicComplaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('complaints_public')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setComplaints((data as PublicComplaint[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { complaints, loading }
}
```

- [ ] **Step 5: Create `MyReportsPage`**

Create `src/pages/MyReportsPage.tsx`:

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useMyComplaints } from '@/hooks/useComplaints'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'

export function MyReportsPage() {
  const { user } = useAuth()
  const { complaints, loading } = useMyComplaints(user?.id)

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">My Reports</h1>
      {complaints.length === 0 && <p className="text-muted-foreground">You haven't reported anything yet.</p>}
      <div className="space-y-3">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/my-reports/${c.id}`} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `CitizenComplaintDetailPage`**

Create `src/pages/CitizenComplaintDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { Complaint, ComplaintStatusHistory } from '@/lib/types'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { StatusHistoryTimeline } from '@/components/complaints/StatusHistoryTimeline'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'

export function CitizenComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('complaints').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('*').eq('complaint_id', id),
    ]).then(([complaintRes, historyRes]) => {
      setComplaint((complaintRes.data as Complaint) ?? null)
      setHistory((historyRes.data as ComplaintStatusHistory[]) ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>
  if (!complaint) return <p className="p-6 text-muted-foreground">Report not found.</p>

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{complaint.title}</h1>
        <StatusBadge status={complaint.status} />
      </div>
      <p>{complaint.description}</p>
      {complaint.photo_url && <img src={complaint.photo_url} alt="Reported issue" className="max-h-80 rounded-lg border" />}
      <ComplaintMap complaints={[complaint]} />
      <div>
        <h2 className="mb-2 font-medium">Status history</h2>
        <StatusHistoryTimeline history={history} />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Wire the routes into `App.tsx`**

Replace the `/my-reports` placeholder route and add the detail route:

```tsx
import { MyReportsPage } from '@/pages/MyReportsPage'
import { CitizenComplaintDetailPage } from '@/pages/CitizenComplaintDetailPage'
// ...
<Route path="/my-reports" element={<MyReportsPage />} />
<Route path="/my-reports/:id" element={<CitizenComplaintDetailPage />} />
```

(Both stay nested under the existing `<Route element={<ProtectedRoute allowedRoles={['citizen']} />}>` wrapper from Task 7.)

- [ ] **Step 8: Manually verify**

Log in as the demo citizen, submit a report (Task 9), then visit `/my-reports` — confirm the card appears with a "Submitted" badge. Click into it — confirm the detail page shows the map pin, photo (if attached), and a status-history entry for "Submitted".

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add citizen My Reports list and complaint detail view"
```

---

### Task 11: Public Accountability Dashboard

**Files:**
- Create: `src/pages/PublicDashboardPage.tsx`
- Create: `src/pages/PublicComplaintDetailPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePublicComplaints`, `useDepartments`, `ComplaintMap`, `ComplaintCard`, `StatusBadge`, `StatusHistoryTimeline` from Tasks 9–10. Note: the public detail page must query `complaints_public` and only the public-safe columns of `complaint_status_history` (status/timestamp, no `note`/`changed_by`) — do not query the raw `complaints` table here, since RLS blocks anon reads on it by design (Task 3).
- Produces: routes `/` (replaces the Task 7 placeholder) and `/complaints/:id`.

- [ ] **Step 1: Build the public dashboard**

Create `src/pages/PublicDashboardPage.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { usePublicComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { ComplaintStatus } from '@/lib/types'

const STATUS_OPTIONS: (ComplaintStatus | 'all')[] = ['all', 'submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected']

export function PublicDashboardPage() {
  const { complaints, loading } = usePublicComplaints()
  const { departments } = useDepartments()
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  const filtered = useMemo(
    () =>
      complaints.filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (departmentFilter !== 'all' && c.department_id !== departmentFilter) return false
        return true
      }),
    [complaints, statusFilter, departmentFilter]
  )

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Public accountability dashboard</h1>
      <p className="mb-4 text-sm text-muted-foreground">Every reported issue and its current status — no login required.</p>

      <div className="mb-4 flex gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ComplaintStatus | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ComplaintMap complaints={filtered} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/complaints/${c.id}`} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build the public complaint detail page**

Create `src/pages/PublicComplaintDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { PublicComplaint } from '@/lib/types'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'

interface PublicHistoryEntry {
  new_status: PublicComplaint['status']
  created_at: string
}

export function PublicComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<PublicComplaint | null>(null)
  const [history, setHistory] = useState<PublicHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('complaints_public').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('new_status, created_at').eq('complaint_id', id).order('created_at'),
    ]).then(([complaintRes, historyRes]) => {
      setComplaint((complaintRes.data as PublicComplaint) ?? null)
      setHistory((historyRes.data as PublicHistoryEntry[]) ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>
  if (!complaint) return <p className="p-6 text-muted-foreground">Report not found.</p>

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{complaint.title}</h1>
        <StatusBadge status={complaint.status} />
      </div>
      <p>{complaint.description}</p>
      {complaint.photo_url && <img src={complaint.photo_url} alt="Reported issue" className="max-h-80 rounded-lg border" />}
      <ComplaintMap complaints={[complaint]} />
      <div>
        <h2 className="mb-2 font-medium">Timeline</h2>
        <ol className="space-y-2">
          {history.map((h, i) => (
            <li key={i} className="border-l-2 border-muted pl-3 text-sm">
              <StatusBadge status={h.new_status} /> <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
```

Note: `complaint_status_history` RLS (Task 3) has no `anon`-accessible policy, so this `select` will correctly return an empty array for unauthenticated visitors rather than leaking `note`/`changed_by`. If you want the public timeline to actually populate, add a dedicated `history_select_public` policy exposing only `new_status`/`created_at` — this is intentionally left as a documented decision point, not a bug, because the spec's public-view requirement (FR4) only commits to current status, not full timeline visibility for anonymous users.

- [ ] **Step 3: Wire the routes into `App.tsx`**

Replace the root placeholder and add the detail route:

```tsx
import { PublicDashboardPage } from '@/pages/PublicDashboardPage'
import { PublicComplaintDetailPage } from '@/pages/PublicComplaintDetailPage'
// ...
<Route path="/" element={<PublicDashboardPage />} />
<Route path="/complaints/:id" element={<PublicComplaintDetailPage />} />
```

- [ ] **Step 4: Manually verify**

Open the app in a private/incognito window (no login). Expected: `/` shows the map + list of all complaints seeded so far, filters work, clicking a card opens `/complaints/:id` without requiring login, and no citizen name/email appears anywhere on these pages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add public accountability dashboard and public complaint detail page"
```

---

### Task 12: Department Staff Queue and Status Updates

**Files:**
- Create: `src/pages/staff/StaffQueuePage.tsx`
- Create: `src/pages/staff/StaffComplaintDetailPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDepartmentComplaints`, `ComplaintCard`, `ComplaintMap`, `StatusBadge`, `StatusHistoryTimeline` (Tasks 9–10), `ALLOWED_TRANSITIONS`/`isValidTransition` (Task 6), `useAuth` (Task 5).
- Produces: routes `/staff` and `/staff/:id`.

- [ ] **Step 1: Build the staff queue page**

Create `src/pages/staff/StaffQueuePage.tsx`:

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useDepartmentComplaints } from '@/hooks/useComplaints'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'

export function StaffQueuePage() {
  const { profile } = useAuth()
  const { complaints, loading } = useDepartmentComplaints(profile?.department_id)

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Department queue</h1>
      {complaints.length === 0 && <p className="text-muted-foreground">No complaints assigned to your department yet.</p>}
      <div className="space-y-3">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/staff/${c.id}`} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build the staff complaint detail + status update + comments page**

Create `src/pages/staff/StaffComplaintDetailPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { ALLOWED_TRANSITIONS } from '@/lib/statusTransitions'
import type { Complaint, ComplaintComment, ComplaintStatus, ComplaintStatusHistory } from '@/lib/types'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { StatusHistoryTimeline } from '@/components/complaints/StatusHistoryTimeline'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function StaffComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([])
  const [comments, setComments] = useState<ComplaintComment[]>([])
  const [loading, setLoading] = useState(true)

  const [nextStatus, setNextStatus] = useState<ComplaintStatus | ''>('')
  const [note, setNote] = useState('')
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [complaintRes, historyRes, commentsRes] = await Promise.all([
      supabase.from('complaints').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('*').eq('complaint_id', id),
      supabase.from('complaint_comments').select('*').eq('complaint_id', id).order('created_at'),
    ])
    setComplaint((complaintRes.data as Complaint) ?? null)
    setHistory((historyRes.data as ComplaintStatusHistory[]) ?? [])
    setComments((commentsRes.data as ComplaintComment[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusUpdate() {
    if (!complaint || !nextStatus) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.rpc('update_complaint_status', {
      p_complaint_id: complaint.id,
      p_new_status: nextStatus,
      p_note: note || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setNote('')
    setNextStatus('')
    load()
  }

  async function handleAddComment() {
    if (!complaint || !profile || !newComment.trim()) return
    const { error } = await supabase.from('complaint_comments').insert({
      complaint_id: complaint.id,
      author_id: profile.id,
      comment: newComment,
    })
    if (error) {
      setError(error.message)
      return
    }
    setNewComment('')
    load()
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>
  if (!complaint) return <p className="p-6 text-muted-foreground">Complaint not found or not assigned to your department.</p>

  const allowedNext = ALLOWED_TRANSITIONS[complaint.status]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{complaint.title}</h1>
        <StatusBadge status={complaint.status} />
      </div>
      <p>{complaint.description}</p>
      {complaint.photo_url && <img src={complaint.photo_url} alt="Reported issue" className="max-h-80 rounded-lg border" />}
      <ComplaintMap complaints={[complaint]} />

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="font-medium">Update status</h2>
        {allowedNext.length === 0 && <p className="text-sm text-muted-foreground">No further transitions available from this status.</p>}
        {allowedNext.length > 0 && (
          <>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ComplaintStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allowedNext.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button onClick={handleStatusUpdate} disabled={!nextStatus || saving}>
              {saving ? 'Saving…' : 'Update status'}
            </Button>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div>
        <h2 className="mb-2 font-medium">Status history</h2>
        <StatusHistoryTimeline history={history} />
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Internal notes</h2>
        {comments.map((c) => (
          <p key={c.id} className="rounded bg-muted/50 p-2 text-sm">
            {c.comment}
          </p>
        ))}
        <Textarea placeholder="Add an internal note" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <Button variant="outline" onClick={handleAddComment} disabled={!newComment.trim()}>
          Add note
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire the routes into `App.tsx`**

Replace the `/staff` placeholder and add the detail route, both nested under the existing `department_staff` `ProtectedRoute`:

```tsx
import { StaffQueuePage } from '@/pages/staff/StaffQueuePage'
import { StaffComplaintDetailPage } from '@/pages/staff/StaffComplaintDetailPage'
// ...
<Route path="/staff" element={<StaffQueuePage />} />
<Route path="/staff/:id" element={<StaffComplaintDetailPage />} />
```

- [ ] **Step 4: Manually verify**

Log in as the demo department staff account (Roads & Highways). As the demo citizen, submit a pothole report (auto-routes to Roads & Highways). As staff, visit `/staff` — confirm the new complaint appears. Open it, change status to "assigned" then "in_progress" with a note — confirm the history timeline updates and the note is stored. Try selecting an option not in `ALLOWED_TRANSITIONS` — confirm it's not offered in the dropdown. As a sanity check on server-side enforcement, temporarily call `supabase.rpc('update_complaint_status', { p_complaint_id: '<id>', p_new_status: 'closed' })` from the browser devtools console while status is still `submitted` — expected: an error from the RPC ("Invalid status transition…"), proving the UI restriction isn't the only guard.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add department staff queue, status updates via RPC, and internal notes"
```

---

### Task 13: Super Admin — Departments and Staff Management

**Files:**
- Create: `src/pages/admin/AdminDepartmentsPage.tsx`
- Create: `src/pages/admin/AdminStaffPage.tsx`
- Create: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDepartments` (Task 9), `supabase` (Task 5).
- Produces: `<AdminLayout />` (tab navigation shell wrapping all `/admin/*` pages, reused by Task 14); routes `/admin` (redirects to `/admin/complaints`, added in Task 14), `/admin/departments`, `/admin/staff`.

- [ ] **Step 1: Build the admin layout with tab navigation**

Create `src/pages/admin/AdminLayout.tsx`:

```tsx
import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { to: '/admin/complaints', label: 'Complaints' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/staff', label: 'Staff' },
  { to: '/admin/analytics', label: 'Analytics' },
]

export function AdminLayout() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Admin</h1>
      <div className="mb-6 flex gap-4 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `pb-2 text-sm ${isActive ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
```

- [ ] **Step 2: Build the departments management page**

Create `src/pages/admin/AdminDepartmentsPage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useDepartments } from '@/hooks/useDepartments'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AdminDepartmentsPage() {
  const { departments, loading } = useDepartments()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.from('departments').insert({ name, description: description || null })
    if (error) {
      setError(error.message)
      return
    }
    setName('')
    setDescription('')
    window.location.reload()
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{d.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <form onSubmit={handleCreate} className="max-w-sm space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Add department</h2>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit">Add</Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Build the staff management page**

Create `src/pages/admin/AdminStaffPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useDepartments } from '@/hooks/useDepartments'
import type { Profile } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function AdminStaffPage() {
  const { departments } = useDepartments()
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('role', 'department_staff').order('full_name')
    setStaff((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDepartmentChange(staffId: string, departmentId: string) {
    await supabase.from('profiles').update({ department_id: departmentId }).eq('id', staffId)
    load()
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Staff accounts are created via the seed script (or Supabase Studio) — see the User Manual. This page lets you reassign an existing
        staff member to a different department.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.full_name}</TableCell>
              <TableCell>
                <Select value={s.department_id ?? ''} onValueChange={(v) => handleDepartmentChange(s.id, v)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

Note: staff account *creation* (email/password sign-up) is intentionally out of scope for this page — it's the "manual, non-self-service staff account creation" technical debt item documented in the spec. This page only handles department reassignment for accounts that already exist.

- [ ] **Step 4: Wire the routes into `App.tsx`**

Replace the `/admin` placeholder route with a nested layout (the `/admin` index redirect to `/admin/complaints` is added in Task 14 alongside the complaints page):

```tsx
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage'
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage'
// ...
<Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route path="departments" element={<AdminDepartmentsPage />} />
    <Route path="staff" element={<AdminStaffPage />} />
  </Route>
</Route>
```

- [ ] **Step 5: Manually verify**

Log in as the demo super admin. Visit `/admin/departments` — confirm the 4 seeded departments list, and adding a new one works and appears after reload. Visit `/admin/staff` — confirm the demo staff account lists with its current department, and changing the dropdown updates it (verify in Supabase Studio).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add admin departments and staff management pages"
```

---

### Task 14: Super Admin — All Complaints, Assign/Reassign, Analytics

**Files:**
- Create: `src/pages/admin/AdminComplaintsPage.tsx`
- Create: `src/pages/admin/AdminAnalyticsPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAllComplaints`, `ComplaintCard` (Task 10), `useDepartments` (Task 9), `AdminLayout` (Task 13).
- Produces: routes `/admin` (index, redirects to `/admin/complaints`), `/admin/complaints`, `/admin/complaints/:id`, `/admin/analytics`.

- [ ] **Step 1: Build the all-complaints page with inline assign/reassign**

Create `src/pages/admin/AdminComplaintsPage.tsx`:

```tsx
import { useState } from 'react'
import { useAllComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AdminComplaintsPage() {
  const { complaints, loading, refetch } = useAllComplaints()
  const { departments } = useDepartments()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAssign(complaintId: string, departmentId: string) {
    setSavingId(complaintId)
    setError(null)
    const { error } = await supabase.rpc('assign_complaint', {
      p_complaint_id: complaintId,
      p_department_id: departmentId,
      p_staff_id: null,
      p_note: null,
    })
    setSavingId(null)
    if (error) {
      setError(error.message)
      return
    }
    refetch()
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.title}</TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell>
                <Select
                  value={c.department_id ?? ''}
                  onValueChange={(v) => handleAssign(c.id, v)}
                  disabled={savingId === c.id}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 2: Build the analytics page**

Create `src/pages/admin/AdminAnalyticsPage.tsx`:

```tsx
import { useMemo } from 'react'
import { useAllComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComplaintStatus } from '@/lib/types'

const STATUSES: ComplaintStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected']

export function AdminAnalyticsPage() {
  const { complaints, loading } = useAllComplaints()
  const { departments } = useDepartments()

  const byStatus = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ComplaintStatus, number>
    for (const c of complaints) counts[c.status]++
    return counts
  }, [complaints])

  const byDepartment = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of departments) counts[d.id] = 0
    for (const c of complaints) if (c.department_id) counts[c.department_id] = (counts[c.department_id] ?? 0) + 1
    return counts
  }, [complaints, departments])

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {STATUSES.map((s) => (
            <div key={s} className="flex justify-between text-sm">
              <span className="capitalize text-muted-foreground">{s.replace('_', ' ')}</span>
              <span className="font-medium">{byStatus[s]}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By department</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {departments.map((d) => (
            <div key={d.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium">{byDepartment[d.id] ?? 0}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Wire the routes into `App.tsx`, including the `/admin` index redirect**

```tsx
import { Navigate } from 'react-router-dom'
import { AdminComplaintsPage } from '@/pages/admin/AdminComplaintsPage'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
// ...
<Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Navigate to="complaints" replace />} />
    <Route path="complaints" element={<AdminComplaintsPage />} />
    <Route path="departments" element={<AdminDepartmentsPage />} />
    <Route path="staff" element={<AdminStaffPage />} />
    <Route path="analytics" element={<AdminAnalyticsPage />} />
  </Route>
</Route>
```

(This replaces the single `/admin` route block added in Task 13 — merge the two department/staff routes from Task 13 into this same block rather than duplicating the `ProtectedRoute` wrapper.)

- [ ] **Step 4: Manually verify**

Log in as the demo super admin. Visit `/admin` — confirm it redirects to `/admin/complaints` and lists every complaint across all citizens/departments. Change a complaint's department via the dropdown — confirm its status flips from "Submitted" to "Assigned" (if it was submitted) and the assignment is reflected on the citizen's `/my-reports/:id` history. Visit `/admin/analytics` — confirm the counts match what's in the complaints table.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin all-complaints view with assign/reassign, and analytics page"
```

---

### Task 15: Deployment and Documentation Handoff

**Files:**
- Create: `vercel.json`
- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-08-12-ghana-citizen-complaint-tracker-design.md` (mark implementation complete, no content change needed beyond a status line)
- Create: `Deployment_and_Source_Links.txt`

**Interfaces:**
- Consumes: the fully implemented app from Tasks 1–14.
- Produces: a live Vercel deployment URL; a `Deployment_and_Source_Links.txt` file matching the exact format required by the submission rubric.

- [ ] **Step 1: Add SPA rewrite config for Vercel**

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Write the README with setup/run/deploy instructions**

Create `README.md`:

```markdown
# Ghana Citizen Service & Complaint Tracker

A web platform for citizens to report public-infrastructure issues (potholes, broken
streetlights, overflowing waste bins, drainage problems, damaged infrastructure) and
for departments to assign, track, and resolve them — with a public accountability
dashboard so anyone can see what's happened to a report after submission.

See `docs/superpowers/specs/2026-08-12-ghana-citizen-complaint-tracker-design.md` for
the full design spec (requirements, architecture, data model, effort estimate,
technical debt, testing approach).

## Local setup

1. `npm install`
2. Create a Supabase project. In the SQL editor, run the migrations in order:
   `supabase/migrations/0001_init_schema.sql`, then `0002_security.sql`, then `supabase/seed.sql`.
3. In Supabase Auth settings, disable "Confirm email" (Authentication → Providers → Email).
4. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   from your Supabase project settings.
5. Seed demo accounts: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed`
6. `npm run dev` for the frontend. For the AI classification endpoint locally, run
   `ANTHROPIC_API_KEY=... npx vercel dev` instead (it serves both the SPA and `/api`).

## Testing

`npm run test` runs the unit test suite (category routing, status transitions).

## Deployment

Deployed on Vercel. Environment variables required in the Vercel project settings:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`. The `SUPABASE_SERVICE_ROLE_KEY`
is only needed locally to run the one-time seed script — never set it as a Vercel env var
since it would be readable by the serverless function's build logs/environment unnecessarily
broadly; if re-seeding from CI is ever needed, scope it to a one-off local run instead.
```

- [ ] **Step 3: Deploy to Vercel**

```bash
npx vercel --prod
```

Follow the prompts to link/create the project. In the Vercel dashboard, set the environment variables listed in the README (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`) under Project Settings → Environment Variables, then redeploy (`npx vercel --prod` again) so the build picks them up.

- [ ] **Step 4: Smoke-test the live deployment**

Visit the deployed URL. Repeat the manual verification steps from Tasks 9–14 against production: submit a complaint as the demo citizen, confirm AI classification responds (check the network tab for `/api/classify-complaint` returning 200), update its status as the demo staff account, confirm the public dashboard at `/` reflects it, reassign it as the demo admin.

- [ ] **Step 5: Write `Deployment_and_Source_Links.txt`**

Create `Deployment_and_Source_Links.txt` (fill in the actual values after deploying):

```
Ghana Citizen Service & Complaint Tracker

Live Application URL: <paste Vercel production URL>
Admin URL: <same URL>/admin

Source Code Repository: <paste your git remote URL, e.g. GitHub repo link>

Test Credentials
-----------------
Citizen:
  Email: citizen.demo@example.com
  Password: DemoCitizen123!

Department Staff (Roads & Highways):
  Email: staff.demo@example.com
  Password: DemoStaff123!

Super Admin:
  Email: admin.demo@example.com
  Password: DemoAdmin123!
```

- [ ] **Step 6: Commit**

```bash
git add vercel.json README.md Deployment_and_Source_Links.txt
git commit -m "chore: add deployment config, README, and deployment/source links for submission"
```

---

## After This Plan

The remaining rubric deliverables — `Project_Documentation.pdf`, `SRS.pdf`, `Testing_Report.pdf`,
`Technical_Debt_Plan.pdf`, `User_Manual.pdf` — are documentation artifacts, not code. They should
be written once the app in Tasks 1–15 is deployed and working, since they need real screenshots,
the actual test results from exercising the deployed app, and the final URLs from Task 15. Treat
that as a separate follow-up pass (using the `docx`/`pdf` skills) built directly from this plan's
spec (`docs/superpowers/specs/2026-08-12-ghana-citizen-complaint-tracker-design.md`) plus the
Testing Approach section — do not start it before Task 15 is complete.
