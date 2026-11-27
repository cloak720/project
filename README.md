# NeighborAid

NeighborAid is a community help platform. Residents post requests for everyday help (groceries, lifts to appointments, small repairs), volunteers who live nearby pick them up, and organisers keep the community healthy and run projects that volunteers can sign up for.

The frontend is a React single-page app with a product-grade interface: a command menu, keyboard shortcuts, optimistic updates with undo, skeleton loading states, and light and dark themes. The backend is a Spring Boot API backed by MySQL with session-cookie authentication.

## Features

### Residents
- **Overview**: live counts (open, in progress, completed, to rate), active requests with progress, quick-start category chips, upcoming community projects.
- **Post a request**: title, details, category, urgency, deadline presets and contact details prefilled from the profile, with a live preview of what volunteers will see.
- **My requests**: filter by status, search, follow each request from posted to accepted to done. Open requests can be withdrawn (with a five-second undo); accepted ones show the volunteer and a call button.
- **Rate volunteers**: only volunteers who completed one of your requests can be rated; past ratings and organiser replies are shown.
- **Messages** to the NeighborAid team, with replies threaded underneath.

### Volunteers
- **Request board**: open requests sorted by urgency, deadline or recency, with search and category filters. Accepting asks for confirmation (it can't be handed back), then moves the request into your queue instantly.
- **My tasks**: the resident's name and phone number, one-click "mark as done", completed history and the reviews you've received.
- **Opportunities**: join community projects (spots update instantly) and leave with undo.

### Organisers (admins)
- **Overview**: request pipeline, requests by category, completion rate, membership, unanswered messages, average rating, a "needs attention" list (overdue or urgent requests, unanswered messages) and the most helpful volunteers.
- **Requests**: searchable, filterable table of every request with delete (and undo).
- **Members**: suspend or reinstate accounts instantly, delete accounts with a clear warning about what goes with them. Admin accounts and your own account are protected.
- **Opportunities**: create and edit with a live preview, see who has joined, delete. The volunteer limit can't drop below the number already signed up.
- **Inbox**: two-pane inbox with Ctrl/Cmd+Enter to send; after replying it moves to the next unanswered message.
- **Feedback**: rating summary and distribution, reply to or remove feedback.

### Everyone
- **Command menu** (Ctrl/Cmd+K): jump to any page, run actions, switch theme, and search your requests, opportunities, members and more.
- **Keyboard shortcuts**: `G` then a letter to navigate (`G H` home, `G O` opportunities, `G P` profile…), `N` for the main "create" action, `/` to search the current page, `T` to toggle the theme, `[` to collapse the sidebar, `?` for the full list.
- **Notifications** for acceptances, completions, replies and (for volunteers) urgent requests.
- Light, dark and "match system" themes, remembered per device.
- Responsive from phone to wide desktop; tables turn into stacked cards on small screens.
- Accessible: semantic landmarks, labelled fields with linked error messages, visible focus rings, keyboard-operable menus and dialogs (native `<dialog>`), reduced-motion support.
- If the server session expires, the app signs you out cleanly and returns you to the login page.

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, React Router 7, Create React App (react-scripts 5), axios, framer-motion, lucide-react, recharts |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`), Geist and Geist Mono from Google Fonts |
| Backend | Spring Boot 3, Spring Data JPA, MySQL, Java 17, Maven |
| Auth | Server-side HTTP session (cookie) set by `POST /api/user/login` |

All illustrations (logo, neighborhood map, empty states) are original inline SVG.

## Project structure

```
src/
  App.js                  routes (pages are lazy-loaded per route)
  context/AppContext.js   session, theme, toasts (with undo), confirm dialog
  lib/                    api client, auth/session helpers, formatting, validation, hooks
  components/
    shell/                app shell, sidebar, command menu, shortcuts, notifications, route guards
    ui/                   design-system primitives (fields, badges, tabs, dialog, skeletons…)
    art/                  logo and SVG illustrations
    requests/, opportunities/   domain cards
  pages/
    public/   landing, login, register, legal, 404
    resident/ overview, new request, my requests, rate volunteers
    volunteer/ request board, my tasks
    shared/   opportunities, messages, profile
    admin/    overview, requests, members, inbox, feedback, opportunity editor
  styles/     tokens, base, components, shell, pages
NeighborAid/  Spring Boot backend
```

## Running locally

### Backend

Requirements: Java 17+, Maven, and MySQL.

1. Create a database (the default URL is `jdbc:mysql://localhost:3307/neigboraid`, user `root`, password `root`). Change these in `NeighborAid/src/main/resources/application.properties` if your setup differs.
2. Start the API:
   ```bash
   cd NeighborAid
   ./mvnw spring-boot:run      # or: mvn spring-boot:run
   ```
   It listens on `http://localhost:8080`. Tables are created automatically (`ddl-auto=update`).
3. Admin accounts are not created through sign-up. Register a user, then set `role = 0` for it in the `user` table.

The backend only allows CORS requests from `http://localhost:3000`. If you serve the frontend from another origin, add it in `NeighborAid/src/main/java/com/marian/project/WebConfig.java`.

### Frontend

Requirements: Node 18+.

```bash
npm install
npm start          # http://localhost:3000
```

The API location defaults to `http://localhost:8080/api`. Point the app elsewhere with `REACT_APP_API_URL`, either inline or in a `.env.local` file:

```bash
REACT_APP_API_URL=https://api.example.org/api npm start
```

Production build:

```bash
npm run build      # outputs to build/
```

Because the app uses client-side routing, configure your static host to serve `index.html` for unknown paths.

## Roles

| Value | Role | Signs up via |
| --- | --- | --- |
| 0 | Admin (organiser) | Set in the database |
| 1 | Resident | Registration ("I need help") |
| 2 | Volunteer | Registration ("I want to help") |

## API overview

The frontend uses these endpoints (all under `/api`):

- `user`: `POST /login`, `POST /logout`, `POST /register`, `GET|PUT /{id}`, `GET /all`, `PUT /{id}/ban`, `PUT /{id}/unban`, `DELETE /{id}`
- `requests`: `POST /create`, `GET /user`, `GET /pending`, `GET /accepted`, `GET /all`, `PUT /{id}/accept`, `PUT /{id}/complete`, `DELETE /{id}`
- `opportunities`: `GET /available`, `GET /mine`, `GET /all`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`
- `volunteers`: `POST /opportunities/{id}/accept`, `DELETE /opportunities/{id}/cancel`
- `contact`: `POST`, `GET`, `GET /mine`, `PUT /{id}/reply`
- `feedback`: `POST`, `GET`, `GET /user/{id}`, `GET /volunteer/{id}`, `PUT /{id}/reply`, `DELETE /{id}`

Optional endpoints (`/feedback/user/{id}`, `/feedback/volunteer/{id}`) are used for rating history; if a server doesn't provide them, the related sections degrade gracefully instead of failing.
