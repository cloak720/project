# NeighborAid: Pre-Launch Audit (initial findings)

Audit date: 2026-11-28. Branch audited: `human-design` (commit `7c8c4bd`).
This document records the state of the project **before** pre-launch changes. What was changed
afterwards is in `IMPLEMENTATION_REPORT.md`; the item-by-item status is in `PRE_LAUNCH_CHECKLIST.md`.

## 1. What the project is

A community help platform. Residents post requests for help, volunteers accept and complete them,
admins moderate, and volunteers can join community "opportunities".

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19, Create React App (`react-scripts` 5), react-router-dom 7, axios, framer-motion, lucide-react | Single-page app in the repo root. Talks to the API with cookies (`withCredentials`). |
| Backend | Spring Boot 3.4.2, Java 17+, Spring Web, Spring Data JPA, Hibernate, Bean Validation | `NeighborAid/`. No Spring Security; authorization is hand-written session checks in each controller. |
| Database | MySQL 8 (local, port 3307, schema `neigboraid`) | Schema managed by `spring.jpa.hibernate.ddl-auto=update`; no migration tool. |
| Auth | HTTP session (JSESSIONID cookie) storing `userId`, `role`, `userEmail` | Roles: 0 admin, 1 resident, 2 volunteer. |
| Third parties | Google Fonts (CSS + font files loaded from Google) | No analytics, payments, email, file uploads or AI APIs. |
| Deployment | None | No Dockerfile, CI, hosting config, domain, or production profile exist. |
| Tests | None | No frontend tests (CRA test runner unused); the only backend test is the Spring Initializr `contextLoads` stub. |

## 2. Findings

### P0: Critical

| # | Finding | Where |
|---|---|---|
| P0-1 | **Weak password storage.** Passwords are unsalted SHA-256 (existing accounts) with a plain-text fallback. Unsalted fast hashes are cracked quickly if the database leaks. | `UserService.hashPassword/checkPassword` |
| P0-2 | **Personal data exposed to anyone, without logging in.** `GET /api/opportunities/available` and `GET /api/opportunities/{id}` embed each signed-up volunteer's full user record: email, phone, age, house number, role, ban status. `GET /api/volunteers` returns every sign-up with the same data. | `Opportunity.volunteers` → `Volunteer.user` serialization; `VolunteerController.getAllVolunteers` |
| P0-3 | **Unauthenticated endpoints that read or write other users' data.** `/api/notifications/**` lets anyone list or create notifications for any user ID. `/api/reports/summary` is open and returns hard-coded fake numbers. | `NotificationController`, `ReportController` |
| P0-4 | **Database credentials committed to the repository** (`spring.datasource.password=root`) and present in git history. They are local development defaults, but a production deployment must not use or ship them. | `application.properties` |

### P1: Essential

| # | Finding |
|---|---|
| P1-1 | No rate limiting: login, registration and the contact form can be brute-forced or spammed. |
| P1-2 | No server-side validation enforcement. Entities have Bean Validation annotations but controllers never use `@Valid`, so invalid data (blank names, bad phone numbers, short passwords) reaches the database. |
| P1-3 | Session fixation: the session ID is not rotated on login. |
| P1-4 | Suspended or deleted users keep a working session until it expires. Bans only block new logins. |
| P1-5 | Requests shown to volunteers include the resident's full user record (email, age) and the contact phone number before anyone has accepted the request. The privacy policy says the phone is shared only with the volunteer who accepts. |
| P1-6 | Errors from unexpected exceptions return Spring's default 500 page; there is no consistent JSON error format. |
| P1-7 | Frontend runtime dependencies with known vulnerabilities: `axios` (high, via `form-data` critical and `follow-redirects`), `react-router` / `react-router-dom` (high). |
| P1-8 | No production configuration: CORS origin, cookie flags (`Secure`, `SameSite`), SQL logging (`spring.jpa.show-sql=true` logs every query) and DB settings are hard-coded for local development. |
| P1-9 | No password reset and no email verification. Both need an email provider, which does not exist yet. |

### P2: Important

| # | Finding |
|---|---|
| P2-1 | SEO: no Open Graph / Twitter tags, no preview image, no structured data, no sitemap, no canonical URL, `robots.txt` is the CRA default. |
| P2-2 | No security headers on API responses (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.). |
| P2-3 | No frontend error boundary: a rendering error blanks the whole app. |
| P2-4 | Unused dependencies ship in `package.json`: Font Awesome (3 packages), Google Maps (2), `react-icons`, `recharts`, `cra-template`. Build tooling (`react-scripts`) is listed as a runtime dependency, which inflates `npm audit` results. |
| P2-5 | Privacy: Google Fonts is loaded from Google's servers, which shares visitors' IP addresses with Google. Not disclosed in the privacy policy. |
| P2-6 | No self-service account deletion; users must message an admin. |
| P2-7 | No observability: no health endpoint, no structured logging config, no error tracking, no uptime monitoring, no documented backups. |
| P2-8 | `mvnw` wrapper was broken until commit `6601739` (missing `.mvn/`). |

### P3: Enhancement

| # | Finding |
|---|---|
| P3-1 | Dead backend code: `NotificationService` (in-memory, buggy filter), `ReportService` (fake numbers), unused repository methods. |
| P3-2 | No database migrations (`ddl-auto=update` is risky for production schema changes). |
| P3-3 | Create React App is unmaintained; a move to Vite would modernise the toolchain (not required for launch). |

## 3. What already works well (keep)

- Role-based routing on the frontend and per-endpoint role checks on most backend routes (admin-only lists, owner-only deletes, volunteer-only accept/complete).
- Passwords are never returned in API responses (`@JsonProperty(WRITE_ONLY)`).
- Users cannot change their own role through the profile endpoint.
- Consistent loading, empty and error states across pages; accessible confirm dialogs; keyboard-navigable tabs; visible focus styles.
- Original SVG artwork only (no third-party images to license or optimise).
- Production build compiles with zero warnings (`CI=true npx react-scripts build`).

## 4. Out of scope or impossible to verify here

- Deployment, DNS, SSL, CDN, backups, uptime monitoring: there is no hosting environment or domain yet.
- Real browsers other than Chromium; real iOS/Android devices.
- Email-based flows: there is no email provider.
- Payments, file uploads, AI APIs, Supabase: the app has none of these.
