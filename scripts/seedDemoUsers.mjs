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

    // Upsert, not insert: the handle_new_user trigger (added in
    // 0003_final_review_fixes.sql) already creates a default citizen-role
    // profile row as soon as createUser() above inserts into auth.users, so
    // a plain insert here would conflict on the primary key. Upsert
    // overwrites that placeholder with the correct demo role/department.
    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: created.user.id,
        full_name: demoUser.full_name,
        role: demoUser.role,
        department_id: departmentId,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error(`Failed to create profile for ${demoUser.email}:`, profileError.message)
      continue
    }

    console.log(`Created ${demoUser.role}: ${demoUser.email} / ${demoUser.password}`)
  }
}

main().then(() => process.exit(0))
