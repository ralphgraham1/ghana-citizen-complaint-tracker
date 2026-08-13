# Ghana Citizen Service & Complaint Tracker — Design Spec

Date: 2026-08-12
Status: Implementation complete (Tasks 1–15 done; deployed to Vercel)

## 1. Problem Statement

Citizens in Ghana encounter recurring public-infrastructure issues — potholes, broken
streetlights, overflowing waste bins, drainage problems, damaged public infrastructure.
The core failure is not reporting; citizens already know how to complain informally.
The failure is what happens *after* a report: no visibility into who owns the issue, no
tracking of progress, and no accountability if nothing happens. This project builds a
web platform that makes the *entire lifecycle* of a complaint — submission, assignment,
progress, resolution — visible to the public and enforced by role-based ownership.

## 2. Stakeholders / Users

| Stakeholder | Role in system | Primary need |
|---|---|---|
| Citizen | Reports issues, tracks own reports | Submit quickly, see what's happening to their report |
| Department Staff | Roads & Highways, Sanitation & Waste, Water & Drainage, Electricity & Streetlighting | See only their department's queue, update status/notes |
| Super Admin | System owner | Manage departments/staff, assign/reassign any complaint, system-wide oversight |
| Public (unauthenticated) | No account | Browse a live accountability dashboard/map of all reported issues and their status |

## 3. Requirements

### 3.1 Functional Requirements (prioritized, MoSCoW)

**Must have (MVP — required for the 48h submission)**
- FR1: Citizen can register and log in (email/password via Supabase Auth)
- FR2: Citizen can submit a complaint: category, title, description, photo upload, location (map pin or GPS)
- FR3: Citizen can view "My Reports" with current status and full status history
- FR4: Public (no login) can browse a read-only map + list of all complaints, filtered by status/category, with citizen personal info excluded
- FR5: Department Staff can log in and see only complaints assigned to their department
- FR6: Department Staff can update a complaint's status and add a note; each change is recorded in status history
- FR7: Super Admin can log in, view all complaints, manage departments, assign/reassign a complaint to a department, and manage staff accounts
- FR8: System auto-suggests a department on submission based on category (Super Admin/Staff can override)
- FR9: All role-based data access is enforced server-side via Supabase Row-Level Security, not just hidden in the UI
- FR10: Input validation on all forms (required fields, file type/size limits on photo upload)
- FR16: As the citizen types a complaint description, an AI classifier (Claude API, text-only) suggests a category and department, pre-filling those fields; the citizen reviews and can change them before final submission. If the AI call fails or times out, the form falls back to manual category selection and submission is never blocked.

**Should have**
- FR11: Search/filter on the public dashboard (by category, status, department)
- FR12: Internal staff comments/notes thread on a complaint
- FR13: Basic counts-by-status/department analytics view for Super Admin

**Could have (stretch, only if time remains)**
- FR14: CSV export of complaints for Super Admin
- FR15: Flag likely-duplicate nearby complaints at submission time

**Won't have (explicitly out of scope — documented as future evolution)**
- Email/SMS notifications
- Native mobile app
- Multi-language support (English only)
- Budget/payment tracking integration
- ML-based prioritization or routing

### 3.2 Non-Functional Requirements

- NFR1 (Security): Authentication via Supabase Auth; authorization via RLS policies scoped per role; no PII exposed on the public/unauthenticated dashboard; file uploads restricted by type/size.
- NFR2 (Responsiveness): Mobile-first responsive UI — most citizens will report issues from a phone.
- NFR3 (Performance): Complaint list/map queries indexed and paginated; acceptable load time on a typical mobile connection.
- NFR4 (Availability): Deployed on free-tier infrastructure (Vercel + Supabase) with reasonable uptime for demo/grading purposes.
- NFR5 (Usability): Complaint submission completable in under 2 minutes by a first-time user.
- NFR6 (Auditability): Every status change is immutably logged (who, when, old→new, note) — this is the accountability mechanism the whole project exists to provide.
- NFR7 (Maintainability): Role/permission logic centralized in RLS policies and a small number of shared hooks/services, not duplicated across components.
- NFR8 (Graceful degradation): The AI classification call is non-blocking and has a timeout; its failure never prevents complaint submission.
- NFR9 (Secrets handling): The Claude API key is never exposed to the browser — it is only read server-side, inside the serverless classification function.

## 4. Architecture

**Stack:** Vite + React + TypeScript SPA, React Router for client-side routing, TailwindCSS + shadcn/ui (via the `ui-ux-pro-max` design skill) for styling and components, Supabase (Postgres + Auth + Storage + Row-Level Security) as the backend-as-a-service, react-leaflet + OpenStreetMap tiles for maps (no API key required), deployed as a static SPA on Vercel.

Supabase provides auth, database, file storage, and enforces authorization directly at the data layer via RLS — no custom CRUD backend is built. The one exception is a single Vercel serverless function that proxies the AI classification call, because the Claude API key must never be shipped to the browser. This is what makes a real auth/DB/security-control/API-integration system achievable solo within 48 hours, while still satisfying the rubric's front-end/back-end/database/auth/authorization/API/validation/security requirements.

```
Browser (React SPA)
  ├─ Public pages: landing, public dashboard/map, complaint detail (read-only)
  ├─ Citizen pages: login/register, submit complaint (with AI-suggested category), my reports
  ├─ Staff pages: login, department queue, complaint detail (update)
  └─ Admin pages: login, all complaints, departments, staff management, analytics
        │
        ├──────────────────────────────┐
        ▼                              ▼
  Supabase client SDK            Vercel serverless function
  (auth, postgrest queries,      POST /api/classify-complaint
   storage upload)                     │
        │                              ▼
        ▼                        Claude API (Anthropic),
  Supabase (Postgres + Auth +    key read from server env var
  Storage + RLS policies)
```

**AI classification flow:** citizen types a description → client debounces and calls `POST /api/classify-complaint` with `{ description }` → the serverless function calls the Claude API with a short classification prompt constrained to the fixed category/department enums → returns `{ category, department, confidence }` → the form pre-fills category + department fields, citizen reviews/edits before submitting → the complaint row stores both the AI suggestion and the final citizen-confirmed values (see Data Model) so mis-classifications are auditable.

## 5. Data Model

- **profiles** (1:1 with `auth.users`) — id, full_name, phone, role (`citizen` / `department_staff` / `super_admin`), department_id (nullable, staff only), created_at
- **departments** — id, name, description (seeded: Roads & Highways, Sanitation & Waste Management, Water & Drainage, Electricity & Streetlighting)
- **complaints** — id, citizen_id, category, title, description, photo_url (nullable), latitude, longitude, address_text, status, department_id (nullable until assigned), assigned_staff_id (nullable), ai_suggested_category (nullable), ai_suggested_department_id (nullable), ai_confidence (nullable), created_at, updated_at
- **complaint_status_history** — id, complaint_id, old_status, new_status, changed_by, note, created_at
- **complaint_comments** — id, complaint_id, author_id, comment, created_at

Category → department default routing (overridable): pothole/damaged infrastructure → Roads & Highways; streetlight → Electricity & Streetlighting; waste bin → Sanitation & Waste Management; drainage → Water & Drainage.

## 6. Roles & Permissions (RLS-enforced)

- **Citizen:** INSERT own complaints; SELECT/UPDATE only rows where `citizen_id = auth.uid()`
- **Department Staff:** SELECT/UPDATE only complaints where `department_id` matches their profile's `department_id`
- **Super Admin:** full SELECT/UPDATE/INSERT/DELETE across complaints, departments, profiles
- **Public (anon):** SELECT via a restricted view exposing status/category/location/timestamps only — no citizen_id, name, or contact info

## 7. Complaint Lifecycle

`Submitted → Assigned → In Progress → Resolved → Closed`, with a `Rejected` branch for invalid/duplicate reports. Every transition writes a row to `complaint_status_history` capturing who made the change and an optional note. This history is visible to the citizen who filed it, the assigned department, the super admin, and (status + timestamp only) the public.

## 8. Key Screens

1. Public landing + accountability dashboard (map + filterable list, no login)
2. Complaint detail (public read-only view: category, status, timeline, location, photo)
3. Citizen: register/login, submit complaint form, "My Reports" list + detail
4. Staff: login, department queue (list + filters), complaint detail with status/notes update
5. Super Admin: login, all-complaints view, department management, staff account management, assign/reassign, basic analytics (counts by status/department)

## 9. Effort Estimation

**Technique: Expert Estimation with a use-case-based task breakdown.**

Justification: COCOMO/COCOMO II and Function Point Analysis are calibrated for larger, multi-person efforts and require detailed complexity/transaction analysis whose overhead would itself consume a meaningful share of a 48-hour solo budget without adding proportional value. Use Case Points have the same issue at this scale. Expert estimation against a concrete, enumerated task list is fast, directly actionable, and defensible as "another justified approach" — the estimator (developer) has direct familiarity with the stack (Supabase/React) and the task sizes.

| Module | Estimated hours |
|---|---|
| Project setup, Supabase schema + RLS policies, seed data | 3 |
| Auth (register/login, role-aware routing/guards) | 3 |
| Complaint submission form (incl. map pin + photo upload) | 4 |
| AI classification (serverless function + Claude API integration + form wiring) | 2.5 |
| Citizen "My Reports" view | 2 |
| Public dashboard (map + list + filters) | 4 |
| Staff queue + status update + notes | 3 |
| Super Admin (departments, staff mgmt, assign/reassign, analytics) | 5 |
| Styling/UI polish pass (`ui-ux-pro-max`, responsive) | 4 |
| Testing (unit + manual functional/system/UAT, documented) | 4 |
| Deployment + seed demo accounts | 1.5 |
| Documentation (SRS, testing report, tech debt plan, user manual, consolidated doc) | 6 |
| Buffer / debugging contingency | 3 |
| **Total** | **~45.5 hours** |

**Assumptions:** solo developer, working familiarity with React/Supabase, no custom backend server, free-tier hosting is sufficient, no design assets need to be created from scratch (icons/illustrations sourced or generated via design skill).

**Constraints:** 48-hour hard deadline, solo effort, free-tier infrastructure only, must produce both a working deployed app *and* a full documentation set.

**Influence on scope:** the ~45.5-hour estimate against a 48-hour window leaves very little slack, which is why notifications, native mobile, i18n, and further ML features (beyond the one AI classification call) were placed in Won't Have — they would consume the buffer needed for documentation and testing, both of which are graded deliverables in their own right. The AI feature itself was scoped as narrowly as possible (single text-only classification call, not a chatbot or multimodal pipeline) specifically to fit this budget.

## 10. Testing Approach

- Unit tests (Vitest) for pure logic: status-transition validity, category→department routing.
- Manual, documented functional/integration/system tests for the golden path per role (citizen submits → auto-routes → staff updates → citizen sees update → public sees update).
- Manual UAT walkthrough per role, documented as a checklist with pass/fail.
- Manual security testing: attempt cross-tenant access (citizen reading another citizen's complaint, staff reading another department's queue) and confirm RLS denies it; confirm the Claude API key is absent from all browser network requests and bundle output.
- Manual test of the AI classification fallback: simulate the classification endpoint failing/timing out and confirm the form still allows manual category selection and submission.
- Each test documented as: Test case → Expected result → Actual result → Pass/Fail → Defects identified → Corrective action.

## 11. Technical Debt (anticipated, to be finalized during build)

| Debt | Cause | Impact | Priority | Proposed Resolution |
|---|---|---|---|---|
| No automated test suite beyond a few unit tests | 48h time constraint | Regressions possible on future changes | Scheduled | Add integration test suite (e.g. Playwright) post-submission |
| No email/SMS notifications | Scope cut for time | Citizens must check the app manually for updates | Acceptable temporarily | Add transactional email (Resend/Supabase) in v2 |
| Manual (non-self-service) staff account creation | Scope cut for time | Super Admin must create staff accounts directly | Acceptable temporarily | Build staff invite flow in v2 |
| No pagination/rate-limiting on list views | Scope cut for time | Could degrade at scale | Scheduled | Add before any real-world pilot deployment |
| No image moderation/optimization on uploads | Scope cut for time | Storage cost/abuse risk at scale | Scheduled | Add image resizing + basic moderation before public launch |
| Minimal accessibility audit | Time constraint | May not fully meet WCAG | Scheduled | Full accessibility pass post-submission |
| No i18n (English only) | Scope cut for time | Excludes non-English speakers | Acceptable temporarily | Add Twi/other local language support in v2 |
| AI classification prompt not extensively tuned/evaluated against edge cases | 48h time constraint | Occasional mis-categorization; mitigated by citizen review step before submit | Acceptable temporarily | Build an evaluation set of real complaint text and iterate on the prompt post-submission |
| No retry/circuit-breaker on the Claude API call; single provider dependency | Scope cut for time | If Anthropic API is unavailable, classification silently falls back to manual entry (by design) but has no retry | Acceptable temporarily | Add retry with backoff and provider fallback in v2 |

## 12. Deployment Plan

Deployed as a static SPA on Vercel; Supabase project hosts Postgres/Auth/Storage. Seed data includes one demo account per role (citizen, department staff, super admin) so credentials can be handed to the grader alongside the live URL and source repo link, per submission requirements.

## 13. Documentation Deliverables (produced after/alongside implementation)

This spec seeds the following deliverables required for submission: Project_Documentation.pdf, SRS.pdf, Testing_Report.pdf, Technical_Debt_Plan.pdf, User_Manual.pdf, Deployment_and_Source_Links.txt. These are generated once the implementation is functional enough to document accurately (screenshots, real test results, final deployment URLs).
