import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AppProviders } from "./context/AppContext";
import { ROLES } from "./lib/auth";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Ulogin from "./components/Ulogin";
import Uregister from "./components/Uregister";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import UserProfileAndEdit from "./components/UserProfileAndEdit";
import RequestPage from "./components/RequestPage";
import SubmissionDetails from "./components/SubmissionDetails";
import VolunteerHomePage from "./components/VolunteerHomePage";
import VolunteerOpportunities from "./components/VolunteerOpportunities";
import CreateOpportunity from "./components/CreateOpportunity";
import EditOpportunity from "./components/EditOpportunity";
import Contact from "./components/Contact";
import Adashboard from "./components/Adashboard";
import Logout from "./components/Logout";
import NotFound from "./components/NotFound";

const { ADMIN, USER, VOLUNTEER } = ROLES;
const ANY = [ADMIN, USER, VOLUNTEER];

// Old links pointed at /submission/<id>; keep them working.
const LegacySubmissionRedirect = () => {
  const { requestId } = useParams();
  return <Navigate to={`/my-requests?highlight=${requestId}`} replace />;
};

const AUTH_PAGES = ["/login", "/register"];

const Shell = () => {
  const { pathname } = useLocation();
  const isAuth = AUTH_PAGES.includes(pathname);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

  return (
    <div className="app-shell">
      {!isAuth && <Header />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Ulogin />} />
          <Route path="/register" element={<Uregister />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          <Route path="/user-profile" element={guard(ANY, <UserProfileAndEdit />)} />
          <Route path="/contact" element={guard(ANY, <Contact />)} />
          <Route path="/volunteer-opportunities" element={guard(ANY, <VolunteerOpportunities />)} />

          <Route path="/user-request" element={guard([USER], <RequestPage />)} />
          <Route path="/my-requests" element={guard([USER], <SubmissionDetails />)} />
          <Route path="/submission/:requestId" element={<LegacySubmissionRedirect />} />

          <Route path="/volunteer-home" element={guard([VOLUNTEER], <VolunteerHomePage />)} />

          <Route path="/admin-dashboard" element={guard([ADMIN], <Adashboard />)} />
          <Route path="/create-opportunity" element={guard([ADMIN], <CreateOpportunity />)} />
          <Route path="/edit-opportunity/:id" element={guard([ADMIN], <EditOpportunity />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuth && <Footer />}
    </div>
  );
};

const App = () => (
  <AppProviders>
    <Router>
      <Shell />
    </Router>
  </AppProviders>
);

export default App;
