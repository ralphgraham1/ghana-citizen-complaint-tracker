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
