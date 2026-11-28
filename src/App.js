import React, { Suspense, lazy, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { AppProviders } from "./context/AppContext";
import { ROLES } from "./lib/auth";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import { Terms, Privacy } from "./pages/Legal";
import Profile from "./pages/Profile";
import NewRequest from "./pages/NewRequest";
import MyRequests from "./pages/MyRequests";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import Opportunities from "./pages/Opportunities";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { Loading } from "./components/ui";

// Admin-only screens load on demand, so residents and volunteers never download them.
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CreateOpportunity = lazy(() => import("./pages/OpportunityEditor").then((m) => ({ default: m.CreateOpportunity })));
const EditOpportunity = lazy(() => import("./pages/OpportunityEditor").then((m) => ({ default: m.EditOpportunity })));

const { ADMIN, USER, VOLUNTEER } = ROLES;
const ANY = [ADMIN, USER, VOLUNTEER];

// Old links pointed at /submission/<id>; keep them working.
const LegacySubmissionRedirect = () => {
  const { requestId } = useParams();
  return <Navigate to={`/my-requests?highlight=${requestId}`} replace />;
};

const AUTH_PAGES = ["/login", "/register"];

const guard = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

const Shell = () => {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  const isAuth = AUTH_PAGES.includes(pathname);

  // New page: start at the top and move focus to the content so screen readers announce it.
  useEffect(() => {
    window.scrollTo(0, 0);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!isAuth && <Header />}
      <main id="main" className="app-main" ref={mainRef} tabIndex={-1}>
        <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              <Route path="/user-profile" element={guard(ANY, <Profile />)} />
              <Route path="/volunteer-opportunities" element={guard(ANY, <Opportunities />)} />
              <Route path="/contact" element={guard([USER, VOLUNTEER], <Contact />)} />

              <Route path="/user-request" element={guard([USER], <NewRequest />)} />
              <Route path="/my-requests" element={guard([USER], <MyRequests />)} />
              <Route path="/submission/:requestId" element={<LegacySubmissionRedirect />} />

              <Route path="/volunteer-home" element={guard([VOLUNTEER], <VolunteerDashboard />)} />

              <Route path="/admin-dashboard" element={guard([ADMIN], <AdminDashboard />)} />
              <Route path="/create-opportunity" element={guard([ADMIN], <CreateOpportunity />)} />
              <Route path="/edit-opportunity/:id" element={guard([ADMIN], <EditOpportunity />)} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </main>
      {!isAuth && <Footer />}
    </div>
  );
};

const App = () => (
  <AppProviders>
    <MotionConfig reducedMotion="user">
      <Router>
        <Shell />
      </Router>
    </MotionConfig>
  </AppProviders>
);

export default App;
