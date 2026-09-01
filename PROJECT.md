# هم‌ساختمان — Ham-Sakhteman

## Product Vision
A modern, Persian-first (RTL) mobile-first building management application that helps residents and building managers communicate, request services, track expenses, and manage building information with calm, trustworthy design.

## Stack
- **Framework**: Nuxt 4 (Nuxt 3.15+) with Vue 3, TypeScript
- **Styling**: Tailwind CSS v3 + custom design tokens (teal/slate palette)
- **UI Library**: Nuxt Icon (`@nuxt/icon`) for icons; custom reusable components instead of heavy UI libraries (max compatibility)
- **i18n**: `@nuxtjs/i18n` with Persian (`fa`) as default, English (`en`) ready
- **Font**: Vazirmatn via Google Fonts with `font-vazirmatn` class
- **Theme**: Light-first architecture with dark-mode handlers (`class` strategy) ready
- **Deployment**: Static/SPA build (`ssr: false`) for fast mobile experience

## Architecture
- `app/` — root shell, types (`types/`), composables (`composables/`)
- `components/` — design system (`ui/`, `layout/`, `forms/`)
- `layouts/default.vue` — responsive desktop header + mobile bottom navigation
- `pages/` — `index.vue`, `building.vue`, `services.vue`, `profile.vue`
- `locales/` + `i18n/locales/` — Persian and English translations
- `assets/css/main.css` — Tailwind base/components/utilities + RTL utilities

## Design System
- **Primary**: calm teal (`primary-500` `#14b8a6`) with slate neutrals
- **Cards**: soft shadows (`shadow-soft`, `shadow-soft-lg`), `rounded-3xl`, subtle borders
- **Spacing**: generous whitespace, mobile-first (`px-4`, `max-w-5xl`), responsive grid (`grid-cols-2` → `md:grid-cols-4`)
- **Typography**: Vazirmatn, bold weights for hierarchy, clean line-height
- **Navigation**: sticky header (desktop) + fixed bottom nav (mobile) with active-state indicators
- **Components**: `AppHeader`, `AppBottomNavigation`, `PageHeader`, `SectionHeader`, `AppCard`, `EmptyState`, `LoadingState`, `ErrorState`, `StatusBadge`, `UserAvatar`, `ConfirmDialog`, `AppInput`, `AppSelect`

## Key Features Built
- Persian RTL layout (`dir="rtl"`, `lang="fa"`) across all pages
- Mock content in Persian (notifications, events, building units, services)
- Realistic navigation with 4 tabs: خانه / ساختمان / خدمات / حساب من
- Quick actions, building status cards, service request form, profile settings
- Theme toggle button (light/dark architecture ready)
- Reusable form components and confirmation dialog

## Future Phases
1. **Real backend integration** — auth, payments, service tickets
2. **Push notifications** — via service workers
3. **Multi-building** — admin dashboard for facility managers
4. **Advanced reporting** — charts and expense analytics
5. **PWA / mobile app wrapper** — offline mode, native feel

## Known Notes
- Production build passes with Nuxt 3 + Tailwind v3; `@nuxt/ui` v2 can be re-enabled when environment dependencies stabilize.
- All imports, routes, RTL direction, and responsive breakpoints are verified.
- No horizontal overflow: `overflow-x: hidden`, mobile-first sizing, safe-area insets respected.

## Commit
Branch: `arena/01a05c00-ham-sakhteman`

## New Phase — Authentication + Buildings + Units + Members + Invitations

### Auth Architecture
- `useAuth()` composable with `User` state (localStorage), `isManager`, `isResident`, login/register/logout
- Persian RTL login (`/login.vue`) and register (`/register.vue`) with mobile-first cards
- Mock auth supports manager/resident roles; password/OTP architecture ready

### Building Model
- `Building`: name, address, description, unitCount, residentCount, managerId, invitationCode/link
- `BuildingUnit`: number, floor, status (occupied/vacant/maintenance), residentName/residentId
- `BuildingMember`: userId, role, unitId, joinedAt, invitedBy
- `Invitation`: code, link, createdBy, used/usedBy/usedAt

### Manager Capabilities
- Create building with onboarding flow: ساخت ساختمان → افزودن واحدها → دعوت ساکنان
- Add/edit/remove units
- Add/remove members; assign members to units
- Manage building info, edit name/address/description
- Create/share invitation code and link; copy actions
- Building overview with statistics cards (units, residents, invitations)

### Resident Capabilities
- View assigned building, see unit status, notifications
- Join via invitation code/link (`joinByCode`)

### Design Consistency
- All new pages use `AppCard`, `PageHeader`, `StatusBadge`, `UserAvatar`, `EmptyState`, `ConfirmDialog`
- Mobile-first cards replace dense tables
- Persian mock content in all new flows
- No horizontal overflow (`overflow-x: hidden`, responsive grids)

### Routes Added
- `/login`, `/register`
- `/buildings` (list + create + onboarding)
- `/building?id=` (overview + units + members + invitation management)
