# NeighborAid: Pre-Launch Implementation Report

Date: 2026-11-28. Branch: `human-design`. Findings this responds to: `PRE_LAUNCH_AUDIT.md`.
Item-by-item status: `PRE_LAUNCH_CHECKLIST.md`. How to deploy: `DEPLOYMENT_GUIDE.md`.

## Launch-readiness verdict: **CONDITIONALLY READY**

- All four **P0** findings are fixed and verified by automated tests against the real backend and database.
- Eight of nine **P1** findings are fixed and verified.
- One P1 item remains open: **P1-9** (password reset / email verification), which needs an email provider.
- The app has **never been deployed**: no domain, host, managed database, backups, monitoring or CI exist yet.

So: no known critical blocker in the code, but it is **not production-ready until the external setup is done and P1-9 is closed.**

---

## 1. What changed

### Security (backend)

| Finding | Change |
|---|---|
| P0-1 weak password hashing | BCrypt (cost 12) for all new passwords. Old unsalted SHA-256 and plain-text passwords still work and are **re-hashed with BCrypt on the user's next successful login**. The password is now checked before the ban, so a wrong password no longer reveals that an account exists or is suspended. |
| P0-2 personal data on public endpoints | Opportunity listings and request payloads no longer serialise email, phone, age, house number, role or ban status of the people involved. The admin roster now gets contact details from the admin-only member list. `GET /api/volunteers` is admin-only. |
| P0-3 unauthenticated read/write endpoints | Removed `NotificationController`/`NotificationService` (anyone could read or create notifications for any user) and `ReportController`/`ReportService` (fake data, unused). |
| P0-4 credentials in config | Every setting reads an environment variable. New `prod` profile has **no** credential defaults and refuses to start without them. Dev defaults stay for local use only. |
| P1-1 no rate limiting | `RateLimitFilter`: login 10 / 5 min, register 10 / hour, contact 5 / 10 min, feedback 10 / 10 min, per client IP; returns 429 with `Retry-After`. |
| P1-2 no server-side validation | Bean Validation enforced on registration, requests and opportunities, plus field limits on users (phone pattern, length caps) and contact/feedback. Validation runs **after** the permission check, so people without access get 403, not hints about the format. |
| P1-3 session fixation | Session ID rotated on every login. |
| P1-4 bans didn't end sessions | `SessionUserInterceptor` ends the session of a suspended or deleted user on their next request, and refreshes role/email from the database. |
| P1-5 phone shown before acceptance | Open requests sent to volunteers have the phone number removed; the volunteer sees it only after accepting. |
| P1-6 inconsistent errors | `ApiExceptionHandler` returns `{"message": ...}` for every error, logs unexpected ones server-side, and never exposes stack traces. |
| P1-8 no production config | Cookies `HttpOnly` + `SameSite=Lax` (+ `Secure` in prod), CORS origins from `CORS_ORIGINS`, SQL logging off, proxy headers trusted in prod. |
| P2-2 no security headers | `SecurityHeadersFilter`: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, restrictive CSP, `Cache-Control: no-store` on API, HSTS over HTTPS. |
| — | `System.out` debug output removed; raw exception text no longer sent to clients. |

### Privacy and legal
- **Self-service account deletion** (`DELETE /api/user/me`, "Delete my account" on the profile). Deleting an account removes the profile, requests, project sign-ups, ratings given and received, and contact messages; requests the person had accepted go back on the noticeboard.
- Privacy notice updated: cookies and local storage, Google Fonts disclosure, retention, self-service deletion, how passwords are stored. **Not legally reviewed.**

### SEO and branding (frontend)
- Open Graph and Twitter tags, `og-image.png` (1200×630, captured from the real landing page), Apple touch icon, canonical URL, `WebSite` structured data.
- `scripts/generate-seo-files.js` writes `sitemap.xml` and `robots.txt` into `build/` after every build, for the domain in `REACT_APP_SITE_URL`.

### Reliability and performance (frontend)
- `ErrorBoundary`: a crashing component shows a recovery screen instead of a blank page.
- Admin screens load on demand (React `lazy`), so residents and volunteers don't download them.
- Removed 8 unused packages; `react-scripts` moved to `devDependencies`.
- Source maps off for production builds (`.env.production`).

### Design (earlier in this branch)
- Hand-drawn editorial design, handwritten notes on the home pages, pinned noticeboard cards.
- Fixed two horizontal-overflow bugs at phone width.

---

## 2. Files

**New**
- **Documentation:** `PRE_LAUNCH_AUDIT.md`, `PRE_LAUNCH_CHECKLIST.md`, `IMPLEMENTATION_REPORT.md`, `DEPLOYMENT_GUIDE.md`.
- **Config:** `.env`, `.env.production`, `NeighborAid/src/main/resources/application-prod.properties`.
- **Scripts:** `scripts/generate-seo-files.js`, `scripts/api-test.mjs`.
- **Backend code:**
  - `NeighborAid/src/main/java/com/marian/project/ApiExceptionHandler.java`
  - `NeighborAid/src/main/java/com/marian/project/RequestValidation.java`
  - `NeighborAid/src/main/java/com/marian/project/security/RateLimitFilter.java`
  - `NeighborAid/src/main/java/com/marian/project/security/SecurityHeadersFilter.java`
  - `NeighborAid/src/main/java/com/marian/project/security/SessionUserInterceptor.java`
- **Backend tests:**
  - `NeighborAid/src/test/java/com/marian/project/NeighborAidApplicationTests.java` (moved from the wrong package, where it could never run)
  - `NeighborAid/src/test/java/com/marian/project/service/UserServicePasswordTest.java`
  - `NeighborAid/src/test/java/com/marian/project/security/RateLimitFilterTest.java`
  - `NeighborAid/src/test/resources/application.properties`
- **Frontend:** `src/components/ErrorBoundary.js`, `src/lib/validation.test.js`, `src/lib/format.test.js`, `src/lib/auth.test.js`.
- **Assets:** `public/og-image.png`, `public/apple-touch-icon.png`.

**Modified**
- **Backend:**
  - `pom.xml`
  - `application.properties`
  - `WebConfig.java`
  - Controllers: `UserController`, `RequestController`, `OpportunityController`, `VolunteerController`, `ContactController`, `FeedbackController`
  - Models: `User`, `Request`, `Volunteer`
  - `UserService`
  - `ContactMessageRepository`
- **Frontend:** `package.json`, `package-lock.json`, `public/index.html`, `public/manifest.json`, `src/App.js`, `src/index.js`, `src/pages/Legal.js`, `src/pages/Opportunities.js`, `src/pages/Profile.js`, `src/styles/pages.css`.
- **Repo:** `.gitignore`.

**Deleted:** `NotificationController`, `NotificationService`, `ReportController`, `ReportService`, `com/marian/demo/NeighborAidApplicationTests.java` (the misplaced test).

## 3. Dependencies

| Change | Package |
|---|---|
| Added (backend) | `spring-security-crypto` (BCrypt only; no Spring Security auto-config), `spring-boot-starter-actuator` (health endpoint) |
| Removed (frontend) | `@fortawesome/fontawesome-svg-core`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `@googlemaps/js-api-loader`, `@react-google-maps/api`, `react-icons`, `recharts`, `cra-template` |
| Moved | `react-scripts` → `devDependencies` |
| Upgraded | `axios` 1.7.9 → 1.21.1, `react-router-dom` 7.1.3 → 7.18.7 (fixes all runtime `npm audit` advisories; tests and build re-run, routing re-checked in the browser) |

## 4. Tests executed (all actually run; results as printed)

| Suite | Command | Result |
|---|---|---|
| Frontend unit | `CI=true npx react-scripts test --watchAll=false` | **21 passed / 21** (3 suites). Jest warned that one worker didn't exit cleanly. |
| Backend unit + context | `mvn test` (Eclipse's embedded Maven 3.9.7, JDK 22) | **10 passed / 10**: 6 password tests, 3 rate-limit tests, 1 full application boot on MySQL `neigboraid_test`. |
| API end-to-end, real backend + MySQL | `node scripts/api-test.mjs` against Spring Boot on :8090 with `neigboraid_test` | **63 passed / 63** (final run). Earlier runs found 3 real issues, all fixed: registration limit too tight, and validation before authorization on opportunity and request creation. |
| Production build | `CI=true npm run build` | Compiled with **zero warnings**; sitemap/robots generated; no source maps. |
| Browser (manual, Chromium) | — | Landing, resident home, volunteer board, mobile 375px, light/dark (mock API); admin roster, home note, account deletion end to end (**real backend**). |

The API run also confirmed the legacy-hash upgrade on real data: the test admin was inserted with an
unsalted SHA-256 password and was stored as BCrypt (`$2a$…`, 60 characters) after logging in.

## 5. Known limitations

- **Rate limiting is per instance and in memory.** Fine for one server; use a shared store if you scale out.
- **No schema migrations.** `ddl-auto=update` in dev; production defaults to `validate`, with a manual procedure documented.
- **Only Chromium was tested.** No Firefox, Safari, Edge or real phones.
- **No Lighthouse, accessibility (axe) or contrast audit was run.**
- **Social previews are unverified on real platforms** (needs a public URL).
- **Google Fonts** still loads from Google (disclosed); self-hosting would remove the third-party request.
- **Sessions:** a user suspended while logged in loses access on their next request, not instantly in an already-loaded page.
- **The legal pages' contact link** needs an account; there is no public contact address.

## 6. Remaining work (in priority order)

1. **P1-9, password reset and email verification.** Choose an email provider; then add token-based reset (`/user/forgot-password`, `/user/reset-password`) and verification on sign-up.
2. **Infrastructure:**
   - Domain, HTTPS, hosting, managed MySQL with backups (test a restore).
   - `/actuator/health` uptime monitor, error tracking.
   - A CI pipeline running the three test suites.
3. **Testing:**
   - Cross-browser and real-device testing.
   - Lighthouse and axe audits on the deployed site.
   - Social preview debuggers.
4. **Legal review** of the terms and privacy notice, and a public contact email.
5. **Hardening (P3):**
   - Flyway migrations.
   - Self-hosted fonts.
   - A move off Create React App (unmaintained) to Vite.
