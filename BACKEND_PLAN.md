# Backend plan — هم‌ساختمان

Phase 0 audit of the existing Nuxt SPA. The product spec is `PROJECT.md` (there is no `projects.md`). This document is the contract for the Nitro + PostgreSQL backend. Proposed defaults below are the ones the implementation follows where the frontend and spec disagree.

The current app does not call a server. There is no `server/` directory, no ORM, no Zod, and no tests. Domain data lives in composables and `localStorage`.

## 1. Application overview

Persian-first, mobile-first building management for residents and managers: buildings, units, members, invitations, announcements, problem reports, charges, expenses, a public service-provider directory, notifications, profile, and a lightweight super-admin overview.

Not in the current UI, and not invented by this backend: push notifications, payment gateway, service booking/tickets, charts, PWA, OTP.

## 2. Existing frontend architecture

- Pages: `pages/index.vue`, `login.vue`, `register.vue`, `buildings.vue`, `building.vue`, `announcements.vue`, `problems.vue`, `problems/new.vue`, `charges.vue`, `expenses.vue`, `services.vue`, `service-provider.vue`, `notifications.vue`, `profile.vue`, `admin.vue`.
- Data layer: `composables/useAuth.ts`, `useBuildings.ts`, `useAnnouncements.ts`, `useProblems.ts`, `useFinance.ts`, `useProviders.ts`, `useNotifications.ts`. Types in `types/index.ts`.
- Persistence keys: `hs-user`, `hs-buildings`, `hs-announcements`, `hs-problems`, `hs-charges`, `hs-expenses`, `hs-providers`, `hs-notifications`. Units, members, and invitations are memory-only and disappear on refresh.
- No route middleware. Auth is a `localStorage` user object. Passwords are ignored. Login role is `resident` when the email contains `resident`, otherwise `manager`. Register always creates a `manager`.
- Current building is almost always `buildings[0]`. Charges and expenses also accept `?buildingId=`.
- `layouts/default.vue` nav is Home, Building, Services, Profile.
- Locale cookie `i18n_redirected` already exists. Theme and notification-sound toggles are not persisted.
- `ServiceItem` is unused. Dashboard events, the status card (24 / 98% / 12), and a second hardcoded notification list on the home page are static copy, separate from `/notifications`.
- Stack: Nuxt 3.21, Vue 3, TypeScript, Tailwind, `@nuxtjs/i18n`. `ssr: false`.

## 3. Required backend modules

- Auth and sessions
- Users and profile
- Buildings, units, members, invitations
- Announcements
- Problem reports
- Charges and expenses (the dashboard sums these lists itself)
- Service providers (global directory)
- Notifications (one row per member, read/unread)
- Admin overview
- Shared validation, errors, and building-access checks

## 4. Required database entities

PostgreSQL via Drizzle. IDs are UUIDs returned as strings. `unitCount` and `residentCount` are computed in API responses (`residentCount` = all members, matching the current composable). No soft delete. No JSON columns for relations. No events table. No payments table.

- `users`: id, name, email unique, phone nullable, password_hash, role `resident | manager | admin`, avatar_initials nullable, created_at, updated_at
- `sessions`: id, user_id FK, token_hash unique, expires_at, created_at
- `buildings`: id, name, address, description nullable, manager_id FK, invitation_code unique, created_at, updated_at
- `building_units`: id, building_id FK, number, floor, status `occupied | vacant | maintenance`, resident_name nullable, resident_user_id nullable, unique (building_id, number)
- `building_members`: id, building_id FK, user_id FK, unit_id nullable, role `manager | resident`, joined_at, invited_by nullable, unique (building_id, user_id)
- `invitations`: id, building_id, code, created_by, used, used_by nullable, used_at nullable, created_at
- `announcements`: id, building_id, title, description, importance `normal | important`, image_url nullable, created_by, created_at
- `problem_reports`: id, building_id, category, title, description, image_url nullable, status `new | in-progress | resolved`, created_by, assigned_to nullable, created_at, updated_at
- `charges`: id, building_id, title, amount integer (toman), period text, due_date text, description nullable, status `unpaid | paid | late`, paid_at text nullable, paid_by nullable, note nullable, created_at, created_by
- `expenses`: id, building_id, title, amount integer, category, date text, description nullable, receipt_url nullable, created_at, created_by
- `service_providers`: id, name, category, description, rating numeric, phone, area, working_hours, image_url nullable, trusted boolean, created_at, created_by nullable
- `notifications`: id, user_id, type `announcement | problem | charge | service`, title, message, link nullable, unread, created_at, source_id nullable, unique (user_id, type, source_id)

Jalali-looking `dueDate`, `period`, `paidAt`, and expense `date` stay text because the forms are free-text Persian dates. `createdAt` is `timestamptz`.

Indexes: unique email, unique invitation code, unique (building, unit number), unique (building, user), FK indexes on building_id and user_id, provider category, notifications (user_id, unread).

## 5. Entity relationships

- A user has many sessions, memberships, and notifications.
- A building has one manager user, many units, members, invitation logs, announcements, problems, charges, and expenses.
- A unit may be assigned to members. Deleting a unit nulls that assignment.
- Service providers are global and are not tied to a building.
- Invitation links are computed as `${APP_BASE_URL}/buildings?code=CODE`. The building code is reusable. Invitation rows are a log that copies that code. Join does not mark the code used.

## 6–9. API endpoints

Success: `{ "success": true, "data": ... }`. Composables unwrap `data`.

Error: `{ "success": false, "error": { "code", "message", "details" } }`. Database errors are never returned.

Auth is an HTTP-only session cookie named `hs_session`. No token in JSON or `localStorage`.

Authorization default: building data requires a session and a `building_members` row, unless `users.role` is `admin`. Manager mutations require that membership role to be `manager` (or platform `admin`). Register creates platform role `manager`. Join does not change `users.role`; it only inserts `building_members.role = resident`.

### POST /api/auth/register

- Purpose: create a manager account and session
- Authentication: public
- Authorization: none
- Body: `name`, `email`, `password`, optional `confirmPassword`
- Validation: name required, email format, password min 4, confirm must match when sent
- Response: `201` `{ user }` and `Set-Cookie`
- Errors: 422 validation, 409 duplicate email, 429 rate limit
- DB: insert user and session

### POST /api/auth/login

- Purpose: open a session
- Authentication: public
- Body: `email`, `password`
- Validation: email and password required
- Response: `200` `{ user }` and `Set-Cookie`
- Errors: 401 generic failure (same message if the email is unknown), 422, 429
- DB: verify hash, insert session

### POST /api/auth/logout

- Purpose: end the session
- Authentication: optional (always clears the cookie)
- Response: `200` `{ ok: true }`
- DB: delete session when the cookie matches

### GET /api/auth/me

- Purpose: current user
- Authentication: required
- Response: `200` `{ user }` without password hash
- Errors: 401
- DB: read session and user

### PATCH /api/me

- Purpose: edit profile (name, email, phone)
- Authentication: required
- Body: optional `name`, `email`, `phone`
- Validation: email format, lengths
- Response: `200` `{ user }`
- Errors: 401, 409 email taken, 422
- DB: update user
- The profile form’s first and last name inputs map to one `name` column.

### GET /api/buildings

- Purpose: buildings the user belongs to; admin sees all
- Authentication: required
- Response: `Building[]` with computed `unitCount`, `residentCount`, `invitationCode`, `invitationLink`
- Errors: 401
- DB: select buildings and counts

### POST /api/buildings

- Purpose: create a building and onboarding shell
- Authentication: required
- Authorization: platform role `manager` or `admin`
- Body: `name` required, `address`, `description`. `unitCount` is accepted and ignored as a stored counter (the UI does not create that many units).
- Response: `201` building
- Errors: 401, 403, 422
- DB: insert building, generate unique invitation code, insert manager membership

### GET /api/buildings/:id

- Purpose: one building
- Authentication: required
- Authorization: member or admin
- Errors: 404 missing, 403 not a member, 422 bad id
- DB: select building and counts

### PATCH /api/buildings/:id

- Purpose: edit name, address, description
- Authentication: required
- Authorization: building manager or admin
- Errors: 401, 403, 404, 422
- DB: update building

### GET /api/buildings/:id/units

- Purpose: list units
- Authentication: required
- Authorization: member or admin
- Response: `BuildingUnit[]`
- DB: select units

### POST /api/buildings/:id/units

- Purpose: add a unit
- Authorization: building manager or admin
- Body: `number`, `floor`, `status`, optional `residentName`
- Errors: 409 duplicate number in the building
- Response: `201` unit
- DB: insert unit

### PATCH /api/buildings/:id/units/:unitId

- Purpose: edit a unit (composable has this; the page does not call it yet)
- Authorization: building manager or admin
- DB: update unit

### DELETE /api/buildings/:id/units/:unitId

- Purpose: remove a unit
- Authorization: building manager or admin
- DB: delete unit, memberships keep the row with `unit_id` null

### GET /api/buildings/:id/members

- Purpose: list members with nested `user` (`id`, `name`, `avatarInitials` only)
- Authorization: member or admin
- DB: select members join users

### POST /api/buildings/:id/members

- Purpose: add an existing user
- Authorization: building manager or admin
- Body: `userId` or `email`, `role`, optional `unitId`
- Errors: 404 user, 409 already a member, 422 unit not in this building
- DB: insert member

### PATCH /api/buildings/:id/members/:memberId

- Purpose: assign a unit or change role (spec capability; no button in the UI)
- Authorization: building manager or admin
- Errors: 409 when the change would remove the last manager
- DB: update member

### DELETE /api/buildings/:id/members/:memberId

- Purpose: remove a member (composable only; no button)
- Authorization: building manager or admin
- Errors: 409 last manager
- DB: delete member

### GET /api/buildings/:id/invitations

- Purpose: invitation log
- Authorization: building manager or admin
- DB: select invitations

### POST /api/buildings/:id/invitations

- Purpose: log another share of the building code, matching `invite()`
- Authorization: building manager or admin
- Response: `201` invitation. Code stays reusable and `used` stays false.
- DB: insert invitation

### POST /api/invitations/join

- Purpose: join by code
- Authentication: required
- Body: `code`
- Validation: case-insensitive match on `buildings.invitation_code`
- Response: building
- Errors: 404 unknown code, 409 already a member
- DB: insert resident membership. Does not change `users.role`. Does not set `used`.
- No page calls this yet. The link is `${APP_BASE_URL}/buildings?code=`.

### GET /api/buildings/:id/announcements

- Purpose: list, newest `createdAt` first
- Authorization: member or admin

### GET /api/announcements/:id

- Purpose: detail
- Authorization: member of that building or admin

### POST /api/buildings/:id/announcements

- Purpose: create
- Authorization: building manager or admin
- Body: `title` required, `description`, `importance`, optional `imageUrl` string
- Response: `201`
- DB: insert announcement and one notification per member

### PATCH /api/announcements/:id

- Purpose: edit (composable only; no edit form)
- Authorization: building manager or admin

### DELETE /api/announcements/:id

- Purpose: delete
- Authorization: building manager or admin

### GET /api/buildings/:id/problems

- Purpose: list, newest first
- Query: `category` enum or `all` or omitted
- Authorization: member or admin

### GET /api/problems/:id

- Purpose: detail
- Authorization: member or admin

### POST /api/buildings/:id/problems

- Purpose: resident or manager report
- Authorization: any member
- Body: `category`, `title` required, `description`, optional `imageUrl`
- Status is forced to `new`
- DB: insert report and notifications

### PATCH /api/problems/:id

- Purpose: manager updates status
- Authorization: building manager or admin
- Body: `status` `new | in-progress | resolved`
- Residents cannot change status

### DELETE /api/problems/:id

- Purpose: delete (composable only)
- Authorization: building manager or admin

### GET /api/buildings/:id/charges

- Purpose: list, `dueDate` text descending
- Authorization: member or admin

### POST /api/buildings/:id/charges

- Purpose: create an unpaid charge
- Authorization: building manager or admin
- Body: `title`, `amount` integer > 0, `period`, `dueDate`, `description`
- `createdBy` is the session user
- DB: insert charge and notifications
- No per-unit billing and no payment gateway

### PATCH /api/charges/:id

- Purpose: manager marks paid (or sets `late` / `unpaid` if sent)
- Authorization: building manager or admin
- Body: `status`, optional `paidAt`, `paidBy`, `note`
- `late` is stored only when sent. There is no scheduler.

### GET /api/buildings/:id/expenses

- Purpose: list, `date` text descending
- Authorization: member or admin

### POST /api/buildings/:id/expenses

- Purpose: create
- Authorization: building manager or admin
- Body: `title`, `amount` > 0, `category`, `date`, `description`, optional `receiptUrl` string

### DELETE /api/expenses/:id

- Purpose: delete (composable only; the page has no delete button)
- Authorization: building manager or admin

There is no finance summary endpoint. The dashboard sums paid charges minus expenses.

### GET /api/providers

- Purpose: public directory search
- Authentication: public
- Query: `q` matches name, description, and area; `category` exact enum or `all`
- DB: select providers

### GET /api/providers/:id

- Purpose: public detail

### PATCH /api/providers/:id

- Purpose: set the global trusted flag
- Authentication: required
- Authorization: platform `manager` or `admin`
- Body: `{ trusted: boolean }`
- No create or delete. Providers come from seed data.

### GET /api/notifications

- Purpose: the signed-in user’s rows
- The page groups by `type` itself
- `service` rows are not created by the current flows

### PATCH /api/notifications/:id

- Purpose: mark one row read
- Authorization: owner only. Other users’ ids return 404

### POST /api/notifications/read-all

- Purpose: mark all of the user’s rows read

### GET /api/admin/overview

- Purpose: counts and the lists the admin page renders
- Authorization: platform `admin` only
- Response: counts for buildings, users, providers, announcements, problems, plus building and provider lists
- Errors: 403

## 10. Validation requirements

Zod on every external input (params, query, body). Enums match `types/index.ts`. Amounts are positive integers. Email is trimmed and lowercased. Invitation codes match case-insensitively. Empty image and receipt strings are stored as null. Client rules preserved: register password min 4, titles required, charge and expense amount > 0, building name required.

## 11. Authentication requirements

Register, login, logout, current user. Passwords hashed with bcrypt. Session token is random; only `sha256(SESSION_SECRET + token)` is stored. Cookie is HTTP-only, `SameSite=Lax`, `Secure` in production, lifetime `SESSION_TTL_DAYS` (default 14). Expired sessions are rejected. The frontend stops writing `hs-user`.

## 12. Authorization / RBAC

- Platform roles: `manager`, `resident`, `admin`. `admin` exists because `pages/admin.vue` and PROJECT.md describe a super admin. No UI creates admins. Seed one admin.
- Building role lives on `building_members` and is what gates building mutations.
- Frontend `isManager` is not sufficient. The server checks membership on every building id.
- A member cannot read another building’s charges, problems, or announcements.
- The last manager of a building cannot be removed or demoted.
- Provider trust is a single global flag any platform manager can toggle.

## 13. File upload requirements

The UI has no file picker. `imageUrl` and `receiptUrl` are optional URL strings. This backend does not accept multipart uploads.

`NEEDS CLARIFICATION` if real file storage is required later.

## 14. Search / filter / sort requirements

- Providers: `q` + category. No sort control.
- Problems: category, including `all`.
- Announcements: `createdAt` descending.
- Charges: `dueDate` descending. Expenses: `date` descending.
- Notifications: grouped in the client.
- `%` and `_` in search text are escaped.

## 15. Pagination requirements

No page in the UI paginates. Endpoints return full lists. No page controls are added.

## 16. Error handling requirements

- `VALIDATION_ERROR` 422
- `UNAUTHORIZED` 401
- `FORBIDDEN` 403
- `NOT_FOUND` 404
- `CONFLICT` 409
- `RATE_LIMITED` 429
- `INTERNAL` 500 with a generic message

The UI prints one `message` string. Empty lists use `EmptyState`. Failed loads use `ErrorState` or the existing error line. Failures do not fall back to fake records.

## 17. Security requirements

- Cookie session, hashed passwords, Zod, Drizzle queries (no string-built SQL from user input).
- Same-origin SPA. No open CORS. `SameSite=Lax` for this first-party app.
- Login and register rate limit: 10 requests per minute per IP, in memory, single Node process only.
- Login uses a dummy hash when the email is missing so the response does not reveal whether the account exists.
- Building isolation and notification owner checks.
- No secrets in the repo. Generic 500s.
- Client redirects are UX only.

## 18. Environment variables

`.env` is gitignored. `.env.example` documents:

- `DATABASE_URL` — PostgreSQL connection string
- `TEST_DATABASE_URL` — optional database used by tests (truncated)
- `SESSION_SECRET` — pepper for session token hashes
- `SESSION_TTL_DAYS` — default 14
- `APP_BASE_URL` — origin used to build invitation links
- `NODE_ENV`

## 19. Seed data requirements

One admin, one manager (`علی رضایی`), one resident (`سارا محمدی`), one building (`ساختمان شمالی هم‌ساختمان`) with a stable id, four units, two members, two announcements, two problems, two charges, two expenses, ten providers, and derived notifications. Demo passwords are local-only and documented in `BACKEND.md`. Re-running the seed does nothing if the admin email already exists.

## 20. Migration requirements

Drizzle Kit SQL migrations in `server/database/migrations`. Production and local setup run `npm run db:migrate` then `npm run db:seed`.

## 21. Frontend-to-backend integration points

Pages, components, styles, and routes stay. Composables call the APIs and keep the same fields.

- `useAuth`: cookie session. Stop writing `hs-user`.
- `useBuildings` and the other domain composables: load and mutate via the APIs. Remove mock seeds.
- `pages/profile.vue`: bind name, phone, and email; save with `PATCH /api/me`.
- `pages/admin.vue`: counts from `GET /api/admin/overview`. Non-admins see an empty access state. The server still returns 403.
- Home finance, announcements, and open problems already read composables. The static events block and the static 24 / 98% / 12 card stay as they are.
- Logged-out building lists are empty. The services directory stays public.
- Adding a second unit from the building page sends a distinct number when `۰۰۰` is already used, so the unique (building, number) constraint does not block the existing button.

## 22. Risks

- `ssr: false` and the Netlify README describe a static host. These APIs need `nuxt build` and `node .output/server/index.mjs`. `npm run generate` cannot serve them.
- Logged-out dashboard lists no longer show mock seeds.
- Any platform `manager` still sees manager buttons in the UI. The server rejects actions on buildings where their membership is not `manager`.
- In-memory rate limits reset on restart and are not shared across instances.
- Jalali date strings do not sort as calendar dates.
- Announcement and problem mocks used to look for building id `b-1`, which `createBuilding` never created. Seed data uses the real building id.

## 23. Items that require clarification

These were unclear. The implementation uses the default in parentheses.

- `NEEDS CLARIFICATION` Per-building membership vs a global manager who can edit every building. (Enforce membership.)
- `NEEDS CLARIFICATION` Platform `admin` role. (Yes, seed only.)
- `NEEDS CLARIFICATION` Whether join changes `users.role` to `resident`. (No.)
- `NEEDS CLARIFICATION` No `/join` page, and the old link host was hardcoded. (API + `APP_BASE_URL/buildings?code=`, no new page.)
- `NEEDS CLARIFICATION` Reusable codes that never become `used`. (Keep that behavior.)
- `NEEDS CLARIFICATION` File upload vs URL strings. (URL strings only.)
- `NEEDS CLARIFICATION` Charge status `late` is never computed. (Store it only when sent.)
- `NEEDS CLARIFICATION` Profile first and last name vs one `name`, and phone missing on `User`. (Add `phone`, keep one `name`.)
- `NEEDS CLARIFICATION` Notification sound and theme persistence. (Leave as local UI.)
- `NEEDS CLARIFICATION` Binding the static occupancy card to real unit counts. (Leave the card static.)
- `NEEDS CLARIFICATION` Shipping member PATCH and unused deletes without buttons. (Ship the endpoints, do not add buttons.)
- `NEEDS CLARIFICATION` Password minimum of 4 characters. (Match the register form.)
- `NEEDS CLARIFICATION` OTP. (Do not build.)
