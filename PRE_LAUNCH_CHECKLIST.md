# NeighborAid: Pre-Launch Checklist

Status as of 2026-11-28, branch `human-design`.

| Mark | Meaning |
|---|---|
| `[x]` | Completed and verified (evidence given) |
| `[~]` | Implemented, but needs external configuration or verification |
| `[ ]` | Not implemented |
| `[!]` | Failed or blocked |
| `n/a` | Does not apply to this app |

Evidence references:
- **FE-UNIT**: `npm test -- --watchAll=false`, 21 tests passed (`src/lib/*.test.js`).
- **BE-TEST**: `mvnw test`, 10 tests passed (password hashing, rate limiter, full application context on MySQL).
- **API-E2E**: `node scripts/api-test.mjs` against the real Spring backend + MySQL test database, **63/63 checks passed**.
- **BUILD**: `CI=true npm run build` compiled with zero warnings.
- **BROWSER**: checked by hand in Chromium (desktop 1280px and phone 375px, light and dark).

---

## 1. Branding and SEO

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | Favicon | `public/favicon.svg` (original artwork) plus `apple-touch-icon.png` (180px), both in `manifest.json`. |
| `[x]` | Meta titles and descriptions | Site-wide description in `index.html`; each page sets its own `<title>` via `useTitle`. |
| `[x]` | Open Graph + preview image | OG and Twitter tags in `index.html`; `public/og-image.png` (1200×630, 298 KB, captured from the real landing page). BUILD confirmed absolute URLs. |
| `[x]` | Custom 404 page | `src/pages/NotFound.js` for unknown routes. Host must serve `index.html` as SPA fallback (DEPLOYMENT_GUIDE §4). |
| `[x]` | sitemap.xml | Generated at build by `scripts/generate-seo-files.js` from `REACT_APP_SITE_URL`; BUILD produced 5 URLs. |
| `[x]` | robots.txt | Generated at build: allows public pages, disallows signed-in areas, points to the sitemap. |
| `[x]` | Canonical URLs | `<link rel="canonical">` from `REACT_APP_SITE_URL`. Page-level canonicals are not set (client-rendered SPA). |
| `[x]` | URL structure | Readable, stable paths. Legacy `/submission/:id` redirects to `/my-requests`. |
| `[~]` | Test social media previews | Tags and image verified in the build output. Real previews (Facebook/LinkedIn/X debuggers) need a public URL. |
| `[x]` | Structured data | `WebSite` JSON-LD in `index.html`. |

## 2. UI/UX and Accessibility

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | Mobile / tablet / desktop layouts | BROWSER at 375px and 1280px; fixed two horizontal-overflow bugs at 375px (filters, single-column grid). Tablet not checked separately. |
| `[x]` | Loading states | Skeletons and spinners on every data screen; lazy routes show a loading state. |
| `[x]` | Empty states | Illustrated empty states on every list. |
| `[x]` | Meaningful error messages | Backend now returns `{"message": ...}` for every error (`ApiExceptionHandler`); frontend shows it. API-E2E checks readable validation messages. |
| `[x]` | Form success messages | Toasts after every successful action. |
| `[x]` | Images compressed and optimised | All artwork is inline SVG; the only raster images are the OG image (298 KB) and the touch icon (3 KB). |
| `[x]` | Meaningful alt text | Decorative SVGs are `aria-hidden`; informative images have text alternatives; OG image has `og:image:alt`. |
| `[x]` | Keyboard navigation | Skip link, focus moves to main content on navigation, arrow-key tabs, native `<dialog>` confirms (Escape closes, focus trapped). |
| `[x]` | Visible focus states | Global `:focus-visible` ring. |
| `[~]` | Colour contrast | Palette designed for AA; no automated contrast audit tool was run. Recommend axe or Lighthouse before launch. |
| `[x]` | Typography and spacing consistency | Shared tokens (`src/styles/tokens.css`). |
| `[x]` | Buttons, links, navigation | Exercised for all three roles in BROWSER and API-E2E. |
| `[!]` | Cross-browser testing | Only Chromium was available. Firefox, Safari and Edge not tested. |
| `[x]` | Touch target sizes | Buttons and inputs are at least 40px tall; mobile nav items 44px. |
| `[~]` | WCAG 2.2 AA where practical | Semantic structure, labels, focus and reduced-motion support are in place. No formal audit performed. |

## 3. Functionality and Testing

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | Every form tested | Register, login, new request, opportunity create/edit, profile, contact, rating: API-E2E (server) and FE-UNIT (client rules). |
| `[x]` | Client-side and server-side validation | Client: `src/lib/validation.js` (FE-UNIT). Server: Bean Validation on users, requests, opportunities; length caps on contact and feedback (API-E2E). |
| `[x]` | Registration, login, logout | API-E2E. |
| `[x]` | Authentication and authorization | API-E2E: 15+ permission checks (role-only endpoints, other users' data, admin-only lists). |
| `[ ]` | Password reset | Needs an email provider (none configured). Not implemented. |
| `[ ]` | Email verification | Needs an email provider. Not implemented. |
| `[x]` | Roles and permissions | API-E2E: residents can't accept, volunteers can't post, non-admins can't manage, nobody can self-register as admin. |
| `[x]` | CRUD operations | Requests, opportunities, users, feedback, contact messages: API-E2E. |
| `[x]` | All API endpoints | Every endpoint the frontend uses is exercised by API-E2E or by hand. |
| `n/a` | File uploads | The app has none. |
| `[x]` | Search and filtering | Board, opportunities and admin filters exercised in BROWSER. |
| `n/a` | Payment flows | The app has none. |
| `[x]` | Broken links | Internal routes checked in BROWSER; external links are none. |
| `[x]` | Session expiration and handling | 60-minute idle timeout; a suspended or deleted user's live session is ended on the next request (API-E2E); frontend signs out on 401. |
| `[x]` | Edge cases / unexpected input | API-E2E: duplicates, out-of-range values, malformed phone, accepting twice, withdrawing after acceptance, rating before completion. |
| `[x]` | Complete user journeys | API-E2E covers post → accept → complete → rate, join/withdraw, ban, self-delete. |

## 4. Security

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | No secrets in frontend code | Only public URLs in `.env`; checked the bundle config. |
| `[x]` | Sensitive config in environment variables | `application.properties` reads `DB_*`, `CORS_ORIGINS`, etc.; `prod` profile has no credential defaults. |
| `[x]` | `.env` files gitignored | `.env.local`, `.env.*.local` ignored; committed `.env`/`.env.production` contain no secrets. |
| `n/a` | Supabase Row Level Security | Not used. |
| `[x]` | API rate limiting | Login, register, contact, feedback (`RateLimitFilter`); BE-TEST and API-E2E (429 + Retry-After). In-memory: single instance only. |
| `[x]` | Server-side input validation | See section 3. |
| `[x]` | SQL injection | All database access through Spring Data JPA with bound parameters; no string-built queries. |
| `[x]` | XSS | React escapes output; no `dangerouslySetInnerHTML`; API sends `nosniff` and a restrictive CSP. |
| `[x]` | CSRF | Session cookie is `SameSite=Lax`; API only accepts JSON bodies (cross-site forms can't send them without a CORS preflight, which is refused for unknown origins: API-E2E). |
| `[x]` | Secure password hashing | BCrypt (cost 12); legacy SHA-256/plain-text upgraded on next login (BE-TEST; API-E2E confirmed `$2a$` hash after login). |
| `[~]` | HTTPS in production | `prod` profile sets the `Secure` cookie, honours `X-Forwarded-Proto`, and sends HSTS over HTTPS. Certificates and redirects are host configuration. |
| `[x]` | Auth on protected endpoints | API-E2E. |
| `[x]` | CORS configured securely | Single configured origin list; unknown origin refused (API-E2E); only `Content-Type` header allowed. |
| `[x]` | No sensitive data in API responses | Passwords never serialised; public endpoints no longer expose emails, phones or ages (API-E2E); phone hidden until a volunteer accepts. |
| `n/a` | AI API spending limits | No AI APIs. |
| `[x]` | Dependency vulnerabilities | Upgraded `axios` to 1.21.1 and `react-router-dom` to 7.18.7; `npm audit --omit=dev` reports **0 vulnerabilities** in shipped code. Remaining advisories are in build-time tooling (`react-scripts`) only. Backend: no audit tool run. |
| `[x]` | Admin routes protected | Server-side role checks (API-E2E); frontend guards for UX only. |
| `[x]` | Security headers | API: `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP, `no-store`, HSTS on HTTPS (API-E2E). Frontend: recommended headers in DEPLOYMENT_GUIDE §4. |
| `[x]` | Insecure direct object references | Profile read/edit, request delete, task complete all check ownership (API-E2E). |
| `[x]` | Privilege escalation | Can't self-register as admin, can't change own role, can't ban/delete admins (API-E2E). |
| `n/a` | File upload security | No uploads. |
| `[~]` | Secrets in git history | Only the local-development database password `root` (in old `application.properties`). Not a production secret, so the history was not rewritten; **never use it for a real database**. |

## 5. Performance

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | Images optimised / modern formats | SVG everywhere; one PNG for social previews (required format). |
| `[x]` | Lazy loading | Admin screens are separate chunks loaded on demand (BUILD: 2 extra chunks). |
| `[x]` | Remove unnecessary JavaScript | Removed 8 unused packages (Font Awesome, Google Maps, react-icons, recharts, cra-template); no Tailwind. |
| `[x]` | CSS optimised | Minified by the build (13 KB gzipped). |
| `[~]` | Font loading | `display=swap` and preconnect. Self-hosting the three fonts would remove a third-party request (recommended). |
| `[~]` | Browser/server caching | API sends `no-store`; static-asset caching rules documented for the host (DEPLOYMENT_GUIDE §4). |
| `[~]` | GZIP/Brotli | Host configuration (documented). |
| `[x]` | Database queries | Indexed primary/foreign keys via JPA; no N+1 hotspots found at current scale. The ban check adds one primary-key lookup per request (cheap). |
| `[ ]` | Lighthouse audit | Not run (no Lighthouse available offline here). Run on the deployed site. |
| `[ ]` | Core Web Vitals | Need real-user data after launch. |
| `[x]` | Page load measured | Main bundle 166 KB gzipped JS + 13 KB CSS (BUILD). |
| `[~]` | CDN | Host decision (documented). |
| `[x]` | Unnecessary network requests | Removed unused libraries; notifications poll once a minute. |
| `[ ]` | Memory leaks | Not profiled. Jest reported one worker not exiting cleanly (timer in a test helper), not an app leak. |

## 6. Analytics and Monitoring

| | Item | Evidence / notes |
|---|---|---|
| `n/a` | Analytics | None used (and none invented). Adding one requires updating the privacy notice and adding consent first. |
| `[~]` | Error tracking | Hook points ready (`ErrorBoundary`, `ApiExceptionHandler` logs every unexpected error); needs a provider account (e.g. Sentry). |
| `[x]` | Server-side logging | SLF4J logging; unhandled errors logged with stack traces; SQL logging off; no passwords logged. |
| `[~]` | Database backups | Procedure documented (DEPLOYMENT_GUIDE §7); nothing to back up until a host exists. |
| `[~]` | Uptime monitoring | `GET /actuator/health` added (API-E2E); needs a monitor pointed at it. |
| `[~]` | API failure monitoring / alerts | Needs an error-tracking or log service. |
| `[x]` | Avoid logging sensitive data | Removed `System.out` debug prints of session IDs and errors; error responses never include internals. |

## 7. Legal and Privacy

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | Privacy policy | Updated: cookies, local storage, Google Fonts, retention, deletion. **Not legally reviewed.** |
| `[x]` | Terms and conditions | Present. **Not legally reviewed.** |
| `n/a` | Cookie consent banner | Only a strictly necessary session cookie and a local theme preference; no analytics or advertising. Add a banner if that changes. |
| `n/a` | Cookie preference management | As above. |
| `[x]` | Data collection disclosures | In the privacy notice. |
| `[x]` | User data deletion | Self-service "Delete my account" on the profile; removes profile, requests, sign-ups, ratings and messages (API-E2E). |
| `[x]` | Third-party disclosures | Google Fonts disclosed. |
| `[~]` | Contact information | In-app contact form (needs an account). A public contact email is still needed. |
| `[x]` | Copyright notice | Footer. |
| `[~]` | Data protection requirements | Practical GDPR-style basics in place (disclosure, deletion, minimal data). Applicability and compliance need legal review. |

## 8. Deployment and Infrastructure

| | Item | Evidence / notes |
|---|---|---|
| `[!]` | Domain, DNS, www redirect, SSL, custom domain | Blocked: no domain or host. Steps documented. |
| `[~]` | Production environment variables | Defined and documented; `prod` profile refuses to start without them. |
| `[!]` | Frontend / backend / database deployment | Blocked: no hosting. |
| `[~]` | Database migrations | No migration tool; manual procedure documented. Flyway recommended. |
| `[~]` | Backups verified | Blocked until a database host exists. |
| `[ ]` | CI/CD | No CI configured. Commands for a pipeline are in DEPLOYMENT_GUIDE §6. |
| `[x]` | Rollback instructions | DEPLOYMENT_GUIDE §8. |
| `[x]` | Remove console.log | None in app code (the only `console` call is the dev-only error boundary report). |
| `[x]` | Debug mode off in production | `prod` profile: SQL logging off, no stack traces in responses. |
| `[x]` | Source maps not exposed | `GENERATE_SOURCEMAP=false` in `.env.production`; BUILD produced 0 `.map` files. |
| `[x]` | Production build configuration | BUILD with zero warnings. |

## 9. Final QA

| | Item | Evidence / notes |
|---|---|---|
| `[x]` | Complete application tested | FE-UNIT, BE-TEST, API-E2E, BROWSER. |
| `[~]` | Android / iOS layouts | Phone-width emulation only; no real devices. |
| `[!]` | Chrome, Firefox, Safari, Edge | Chromium only. |
| `[ ]` | Slow network | Not tested. |
| `[x]` | API failure scenarios | Error states verified (backend down → readable message; 401 → sign-out; 429 → readable message). |
| `n/a` | Offline behaviour | Online-only app. |
| `[x]` | External integrations | Only Google Fonts. |
| `[x]` | Navigation paths | All routes for all three roles. |
| `[x]` | Spelling and grammar | Reviewed the copy on every page touched. |
| `[x]` | Placeholder content | None in the UI. |
| `[x]` | Broken images | None (all images are local). |
| `[x]` | No exposed credentials | Checked repository and history (only the dev DB default; see section 4). |
| `[x]` | Final security audit | See IMPLEMENTATION_REPORT. |
| `[~]` | Backup and recovery verified | Needs a database host. |
| `[x]` | Production build stability | BUILD. |
