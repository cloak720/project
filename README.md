# NeighborAid

**Help from the people next door.** NeighborAid is a community help platform: residents post requests for a hand (errands, lifts, small repairs, company), volunteers on the same streets pick them up and see them through, and moderators keep the whole thing friendly and safe. Local organizers can also publish community *opportunities* (clean-ups, food drives, clubs) that volunteers sign up for.

The interface is designed like a warm community newspaper turned into an app: editorial typography, a newsprint palette with a lamplit dark "evening edition", and original hand-inked illustrations.

## Features by role

### Residents
- **Front page** with a personal greeting, at-a-glance numbers (waiting, in progress, done, helpers to thank), open requests and what's on nearby.
- **Ask for help** in four short steps: headline and details, an illustrated category picker, deadline (with quick picks such as "Tomorrow morning") and urgency, and contact details prefilled from the profile. A live preview shows exactly how volunteers will see the notice.
- **My requests**: filter by status, follow each request on a Posted → Helper found → Done tracker, see who's helping (with their number once matched), and withdraw anything nobody has accepted yet.
- **Rate a helper** after a request is completed. Only volunteers who actually completed one of your requests can be rated, once each.
- **Contact**: write to the team and read replies in a threaded history.

### Volunteers
- **Dashboard noticeboard** of open requests, sorted by urgency or deadline, with search and category filters. Urgent requests are flagged.
- **Commit to help** through a confirmation step; the task then moves to **My tasks** with the resident's phone number, and can be marked done.
- **Kind words**: average rating and the reviews residents have left.
- **Opportunities**: sign up for community projects, see the ones you've joined (including full or past ones), and withdraw if plans change.

### Admins (moderators)
- **Overview** with a "needs your attention" list (unanswered messages, overdue requests, suspended members), requests by status, requests by category, and upcoming projects.
- **Requests**, **Members**, **Messages** and **Reviews** tabs with search and filters. Suspend or reinstate members, delete accounts, delete requests or reviews, and reply to messages inline.
- **Opportunities**: create, edit and delete listings and see who has signed up. The volunteer limit can't be set below the number already signed up.

### Everywhere
- Light and dark themes (remembered per browser, defaulting to the system setting).
- Notifications derived from real data: requests accepted or completed, replies to your messages, new reviews, and unanswered messages for admins.
- Accessible by design: semantic landmarks, skip link, labelled forms with inline errors, keyboard-navigable tabs and star ratings, native modal dialogs for destructive actions, visible focus states and reduced-motion support.
- Responsive from 360px phones to wide desktops; admin tables become stacked records on small screens.
- If the server session ends (restart or timeout) the app signs you out cleanly and explains why on the login page.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Create React App (react-scripts 5), axios, framer-motion, lucide-react |
| Styling | Hand-written CSS with design tokens (`src/styles`), Google Fonts (Fraunces, Instrument Sans), original inline SVG artwork |
| Backend | Spring Boot 3 (Java 17), Spring Data JPA, MySQL, session-cookie authentication |

## Project structure

```
src/
  App.js                 routes and role guards
  pages/                 one file per screen (Home, Login, Register, MyRequests, VolunteerDashboard, AdminDashboard, ...)
  components/            shared UI (ui.js), RequestCard, EventRow
    layout/              Header, Footer, AuthLayout, ProtectedRoute
    art/                 logo, illustrations and category spot drawings (SVG)
  hooks/                 data and behaviour hooks (notifications, resident data, titles)
  context/AppContext.js  session, theme, toasts and confirm dialog
  lib/                   API client, auth/session helpers, formatting, validation
  styles/                tokens, base, components, art, layout and page styles
NeighborAid/             Spring Boot backend
```

## Running locally

### 1. Backend (Spring Boot + MySQL)

Requirements: Java 17, Maven, and a MySQL server.

1. Create a database (the default config expects MySQL on port 3307):
   ```sql
   CREATE DATABASE neigboraid;
   ```
2. Check the connection settings in `NeighborAid/src/main/resources/application.properties` (URL, username, password). Tables are created automatically on first run.
3. Start the API:
   ```bash
   cd NeighborAid
   mvn spring-boot:run
   ```
   It listens on `http://localhost:8080`, with endpoints under `/api`.

Public sign-up only creates residents and volunteers. To create an admin, register normally and then set that user's `role` to `0` in the `user` table.

> The backend's CORS settings allow `http://localhost:3000`, so run the frontend on port 3000 when using the real backend (or add your origin in `WebConfig.java` and the controllers' `@CrossOrigin` annotations).

### 2. Frontend (React)

Requirements: Node.js 18 or newer.

```bash
npm install
npm start
```

The app opens on `http://localhost:3000`.

### Pointing the frontend at an API: `REACT_APP_API_URL`

The API base URL defaults to `http://localhost:8080/api`. Override it with the `REACT_APP_API_URL` environment variable, for example in a `.env.local` file at the project root:

```
REACT_APP_API_URL=https://api.example.org/api
```

or inline for a single run:

```bash
REACT_APP_API_URL=http://localhost:8181/api npm start
```

Because authentication uses a session cookie, the API must allow credentials from the frontend's origin.

### Production build

```bash
npm run build
```

The optimized site is written to `build/` and can be served by any static host (configure it to serve `index.html` for unknown paths so client-side routes work).

## Roles

| Value | Role | Home screen |
| --- | --- | --- |
| `0` | Admin | `/admin-dashboard` |
| `1` | Resident | `/` |
| `2` | Volunteer | `/volunteer-home` |
