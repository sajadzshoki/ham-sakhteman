# Backend — هم‌ساختمان

Nuxt Nitro server, PostgreSQL, and Drizzle. The SPA stays the UI. Domain data is no longer stored in `localStorage`.

## Architecture

- `server/api` — HTTP routes. Success body: `{ success: true, data }`. Error body: `{ success: false, error: { code, message, details } }`.
- `server/services` — business rules (membership checks, join, notifications, payments status).
- `server/repositories` — shared lookups.
- `server/database` — Drizzle schema, SQL migrations, seed, and test reset.
- `shared/schemas` — Zod input schemas.
- `composables` — call these APIs and keep the same page fields.

Authentication is an HTTP-only cookie named `hs_session`. The database stores only `sha256(SESSION_SECRET:token)`. Passwords are bcrypt hashes.

Building reads require a membership, unless the platform role is `admin`. Building mutations require that membership’s role to be `manager` (platform `admin` may also mutate). Register creates platform role `manager`. Joining with a code adds a resident membership and does not change `users.role`.

## Setup

1. Create two local PostgreSQL databases, for example `ham_sakhteman` and `ham_sakhteman_test`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `TEST_DATABASE_URL`, and `SESSION_SECRET`.
3. Install, migrate, and seed:

```bash
npm install
npm run db:migrate
npm run db:seed
```

Demo accounts created by the seed (local only):

| Email | Password | Role |
| --- | --- | --- |
| admin@hamsakhteman.local | admin-demo | admin |
| manager@hamsakhteman.local | manager-demo | manager |
| resident@hamsakhteman.local | resident-demo | resident |

The seeded building invitation code is `NORTH1`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Nuxt dev server and API |
| `npm run db:generate` | Create a SQL migration from the Drizzle schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert demo data if the admin user is missing |
| `npm test` | Backend tests against `TEST_DATABASE_URL` or `DATABASE_URL` |
| `npm run lint` | Nuxt ESLint |
| `npm run typecheck` | `nuxt typecheck` |
| `npm run build` | Production build |
| `npm start` | `node .output/server/index.mjs` |

`npm run generate` still builds a static site and cannot serve these APIs. Production needs the Node server.

Tests refuse any database host that is not `localhost` or `127.0.0.1`, and they truncate every table. Point `TEST_DATABASE_URL` at an empty local database, then run `npm run db:migrate` against that URL once:

```bash
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npm run db:migrate
```

On macOS or Linux, export `DATABASE_URL` the same way for that one command.

## Environment variables

See `.env.example`.

- `DATABASE_URL` — PostgreSQL connection string
- `TEST_DATABASE_URL` — database the test suite truncates
- `SESSION_SECRET` — pepper for session hashes
- `SESSION_TTL_DAYS` — cookie lifetime, default 14
- `APP_BASE_URL` — origin used in invitation links (`/buildings?code=`)
- `NODE_ENV`

## Authentication

- `POST /api/auth/register` — name, email, password (minimum 4, matching the register form). Sets the cookie.
- `POST /api/auth/login` — generic 401 if the email or password is wrong.
- `POST /api/auth/logout` — deletes the session and clears the cookie.
- `GET /api/auth/me` — current user.
- `PATCH /api/me` — name, email, phone.

Login and register are limited to 10 requests per minute per IP in this process. The limit is not shared across multiple Node processes.

The cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when `NODE_ENV` is `production`.

## API overview

Authenticated building routes are under `/api/buildings/:id/...` for units, members, invitations, announcements, problems, charges, and expenses. Detail routes use `/api/announcements/:id`, `/api/problems/:id`, `/api/charges/:id`, and `/api/expenses/:id`.

- `POST /api/invitations/join` with `{ code }` adds the current user as a resident. The code stays reusable.
- `GET /api/providers` is public. `q` searches name, description, and area. `category` filters. `PATCH /api/providers/:id` sets `trusted` and requires platform role `manager` or `admin`.
- `GET /api/notifications`, `PATCH /api/notifications/:id`, and `POST /api/notifications/read-all` belong to the signed-in user.
- `GET /api/admin/overview` requires platform role `admin`.

Creating an announcement, a new problem, or an unpaid charge writes one notification per building member. Image and receipt fields are optional URL strings. There is no file upload and no payment gateway. A manager marks a charge `paid`. Status `late` is stored only when a client sends it.

`unitCount` and `residentCount` are computed. `residentCount` counts every member. Jalali charge and expense dates are text.

## Business rules

- A building’s last manager cannot be removed or demoted.
- Unit numbers are unique inside a building. The “add unit” button sends `۰۰۰` the first time and a distinct number after that.
- Invitation links look like `${APP_BASE_URL}/buildings?code=CODE`.
- Services stay available without login. Building lists are empty until login.
- The home page events block and the static occupancy card stay as designed in the UI.

## Deployment

Run migrations before starting the server. Set `SESSION_SECRET` and `APP_BASE_URL` to the public origin. Do not commit `.env`. The in-memory rate limit resets on restart.

## Clarifications

Items marked `NEEDS CLARIFICATION` in `BACKEND_PLAN.md` use the defaults written there: membership checks, a seeded `admin` role, reusable invitation codes, URL strings instead of uploads, and no OTP.
