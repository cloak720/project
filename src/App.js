import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppProviders } from "./context/AppContext";
import { ROLES } from "./lib/auth";
import AppShell from "./components/shell/AppShell";
import PublicLayout from "./components/shell/PublicLayout";
import { GuestOnly, RequireRole } from "./components/shell/Guards";

// Each page is its own chunk, so visitors to the landing page don't download the admin console.
const Landing = lazy(() => import("./pages/public/Landing"));
const Login = lazy(() => import("./pages/public/Login"));
const Register = lazy(() => import("./pages/public/Register"));
const Logout = lazy(() => import("./pages/public/Logout"));
const Legal = lazy(() => import("./pages/public/Legal"));
const NotFound = lazy(() => import("./pages/public/NotFound"));

const ResidentHome = lazy(() => import("./pages/resident/ResidentHome"));
const MyRequests = lazy(() => import("./pages/resident/MyRequests"));
const NewRequest = lazy(() => import("./pages/resident/NewRequest"));
const RateVolunteers = lazy(() => import("./pages/resident/RateVolunteers"));

const Board = lazy(() => import("./pages/volunteer/Board"));
const Tasks = lazy(() => import("./pages/volunteer/Tasks"));

const Opportunities = lazy(() => import("./pages/shared/Opportunities"));
const Messages = lazy(() => import("./pages/shared/Messages"));
const Profile = lazy(() => import("./pages/shared/Profile"));

const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminRequests = lazy(() => import("./pages/admin/AdminRequests"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));
const OpportunityEditor = lazy(() => import("./pages/admin/OpportunityEditor"));

const { ADMIN, RESIDENT, VOLUNTEER } = ROLES;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <ScrollToTop />
      {/* Shell and public layouts have their own boundaries; this one only covers the auth screens. */}
      <Suspense fallback={null}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/logout" element={<Logout />} />

          <Route element={<RequireRole />}>
            <Route element={<AppShell />}>
              <Route element={<RequireRole roles={[RESIDENT]} />}>
                <Route path="/home" element={<ResidentHome />} />
                <Route path="/requests" element={<MyRequests />} />
                <Route path="/requests/new" element={<NewRequest />} />
                <Route path="/feedback" element={<RateVolunteers />} />
              </Route>

              <Route element={<RequireRole roles={[VOLUNTEER]} />}>
                <Route path="/board" element={<Board />} />
                <Route path="/tasks" element={<Tasks />} />
              </Route>

              <Route element={<RequireRole roles={[RESIDENT, VOLUNTEER]} />}>
                <Route path="/messages" element={<Messages />} />
              </Route>

              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/profile" element={<Profile />} />

              <Route element={<RequireRole roles={[ADMIN]} />}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/requests" element={<AdminRequests />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/inbox" element={<AdminInbox />} />
                <Route path="/admin/feedback" element={<AdminFeedback />} />
                <Route path="/admin/opportunities/new" element={<OpportunityEditor />} />
                <Route path="/admin/opportunities/:id/edit" element={<OpportunityEditor />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </AppProviders>
);

export default App;
