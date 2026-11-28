# NeighborAid: Deployment Guide

NeighborAid is two deployable pieces plus a database:

| Piece | What it is | Build output |
|---|---|---|
| Frontend | React single-page app (Create React App) in the repo root | Static files in `build/` |
| Backend | Spring Boot 3.4 API in `NeighborAid/` | One executable JAR in `NeighborAid/target/` |
| Database | MySQL 8 | — |

Nothing has been deployed yet. Everything below that mentions a domain, host or provider is a step
**you** need to do; no domain, DNS, hosting account or email provider has been set up.

---

## 1. Environment variables

Names and purpose only. Never commit real values; set them in your host's secret settings.

### Backend (runtime)

| Variable | Required in prod | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | yes | Set to `prod`. Turns on secure cookies, proxy header support, schema validation, quiet SQL logging. |
| `DB_URL` | yes | JDBC URL, e.g. `jdbc:mysql://<host>:3306/<database>?sslMode=REQUIRED&serverTimezone=UTC` |
| `DB_USERNAME` | yes | Database user with rights on that schema only (not `root`). |
| `DB_PASSWORD` | yes | That user's password. |
| `CORS_ORIGINS` | yes | Comma-separated frontend origin(s), e.g. `https://neighboraid.example`. Must match exactly, including `https://`. |
| `PORT` | no (default 8080) | Port the API listens on. |
| `SESSION_TIMEOUT` | no (default `60m`) | Idle session lifetime. |
| `JPA_DDL_AUTO` | no (prod default `validate`) | Leave as `validate` in production; see section 5. |

With `SPRING_PROFILES_ACTIVE=prod` the app **refuses to start** if `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD` or `CORS_ORIGINS` is missing. That is deliberate.

### Frontend (build time; values are baked into public JavaScript, so never secrets)

| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL` | Public URL of the API, ending in `/api`, e.g. `https://api.neighboraid.example/api` |
| `REACT_APP_SITE_URL` | Public URL of the site, no trailing slash. Used for canonical links, social previews and the sitemap. |
| `GENERATE_SOURCEMAP` | Already `false` in `.env.production`, so source maps are not published. |

---

## 2. Local development

Prerequisites: Node.js 18+, Java 17+ (any JDK; Eclipse's bundled JDK 22 works), MySQL 8.

```powershell
# Database: the dev defaults expect MySQL on localhost:3307, schema "neigboraid", user root/root.
# Backend
cd NeighborAid
.\mvnw.cmd spring-boot:run
# Frontend (second terminal, repo root)
npm install
npm start
```

The frontend must run on `http://localhost:3000` (the backend's default allowed origin) unless you
set `CORS_ORIGINS` on the backend.

---

## 3. Build

```powershell
# Frontend: writes build/, then generates build/sitemap.xml and build/robots.txt for REACT_APP_SITE_URL
$env:REACT_APP_API_URL = "https://api.neighboraid.example/api"
$env:REACT_APP_SITE_URL = "https://neighboraid.example"
npm run build

# Backend: runs the tests (needs the test database, see section 6) and produces the JAR
cd NeighborAid
.\mvnw.cmd clean package
```

---

## 4. Deploy

Any host that serves static files and any host that runs a Java 17+ process will do. Requirements:

### Frontend host
1. Upload `build/`.
2. **Single-page app fallback:** serve `index.html` for every unknown path, so links like `/my-requests` work on refresh.
3. **HTTPS** with a valid certificate; redirect `http://` to `https://`.
4. Pick one canonical host (`www.` or not) and 301-redirect the other to it; it must match `REACT_APP_SITE_URL`.
5. **Caching:** `build/static/*` files have content hashes, so cache them for a year (`Cache-Control: public, max-age=31536000, immutable`). Serve `index.html`, `manifest.json`, `robots.txt` and `sitemap.xml` with `Cache-Control: no-cache`.
6. **Compression:** enable Brotli or gzip.
7. **Security headers** for the HTML (adjust if you change fonts or the API host):
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Referrer-Policy: strict-origin-when-cross-origin
   Permissions-Policy: camera=(), microphone=(), geolocation=()
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.neighboraid.example; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
   ```
   (`'unsafe-inline'` in `script-src` is needed for the small theme script in `index.html`; replace it with that script's hash if your host supports it.)

### Backend host
1. Run behind a reverse proxy or load balancer that terminates HTTPS and forwards `X-Forwarded-For` / `X-Forwarded-Proto` (the `prod` profile trusts these, which the rate limiter and secure cookies rely on).
2. `java -jar NeighborAid-0.0.1-SNAPSHOT.jar` with the environment variables from section 1.
3. Health check for the load balancer / uptime monitor: `GET /actuator/health` → `{"status":"UP"}`.
4. **One instance**, or add a shared rate-limit store first: the built-in rate limiter is in-memory and per instance.
5. **Cookies across domains:** the session cookie is `SameSite=Lax`. Serve the frontend and API on the **same site** (e.g. `neighboraid.example` and `api.neighboraid.example`) so browsers send it. Completely different domains would need `SameSite=None; Secure` and are not recommended.

---

## 5. Database

### First deployment
1. Create the database and a dedicated user (not `root`) with privileges on that schema only. Require TLS.
2. Create the schema once: start the backend a single time with `JPA_DDL_AUTO=update`, check it started, then remove the override so production runs with `validate`.

### Schema changes later
There is no migration tool yet (`P3`). Until one is added (Flyway is the natural fit for Spring Boot):
take a backup, apply the change with `JPA_DDL_AUTO=update` during a maintenance window, then switch back to `validate`.

### Existing passwords
Accounts created by older versions store unsalted SHA-256 (or plain text). They keep working and are
**re-hashed with BCrypt automatically on each user's next successful login**. To find accounts not yet upgraded:
`SELECT id, email FROM user WHERE password NOT LIKE '$2%';`

---

## 6. Tests

| Suite | Command | Needs |
|---|---|---|
| Frontend unit | `npm test -- --watchAll=false` | nothing |
| Backend unit + context | `cd NeighborAid; .\mvnw.cmd test` | MySQL reachable with a `neigboraid_test` schema (created automatically if the user may create databases). Override with `TEST_DB_URL`. |
| API end-to-end | `node scripts/api-test.mjs` with `API_URL`, `ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | A running backend pointed at a **test** database, and an admin account in it. **Never run it against production**: it creates and deletes users. |

---

## 7. Backups and recovery (to set up; nothing exists yet)

- Enable automated daily backups with at least 7 days of point-in-time recovery on the managed MySQL service, or schedule `mysqldump --single-transaction --routines <db>` to off-site storage.
- **Test a restore** into a scratch database before launch, and then quarterly.
- Recovery: restore the latest good backup to a new instance, point `DB_URL` at it, restart the backend.

---

## 8. Rollback

- **Frontend:** redeploy the previous `build/` (keep the last few builds, or use your host's "promote previous deployment").
- **Backend:** redeploy the previous JAR. If the release changed the schema, restore the pre-release database backup as well.
- Every release should be a git tag so the exact previous version can be rebuilt: `git tag v1.0.0 && git push origin v1.0.0`.

---

## 9. Still needs external setup

| Item | Why it's not done |
|---|---|
| Domain, DNS, SSL, www redirect | No domain has been bought. |
| Hosting for frontend and backend | No hosting account. |
| Managed MySQL + backups | No database host. |
| Email provider (password reset, email verification) | No SMTP / email API account. These features need it and are not implemented. |
| Error tracking (e.g. Sentry) | Needs an account and DSN. Hook points: `src/components/ErrorBoundary.js` and `ApiExceptionHandler`. |
| Uptime monitoring | Point any monitor at `/actuator/health` once deployed. |
| Analytics | None used; if added, the privacy notice and a cookie consent banner must be updated first. |
| CI pipeline | No CI service configured; run the three test suites above on every push. |
| Public contact address | The legal pages link to the in-app contact form, which needs an account. Add a public email address for people without one. |
