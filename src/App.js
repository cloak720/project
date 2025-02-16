// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import VolunteerHomePage from "./components/VolunteerHomePage";
import Adashboard from "./components/Adashboard";
import Ulogin from "./components/Ulogin";
import Uregister from "./components/Uregister";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import UserProfileAndEdit from "./components/UserProfileAndEdit";
import RequestPage from "./components/RequestPage";
import SubmissionDetails from "./components/SubmissionDetails";
import Header from "./components/Header";
import Contact from "./components/Contact";
import Logout from "./components/Logout";
import VolunteerOpportunities from "./components/VolunteerOpportunities";
import CreateOpportunity from "./components/CreateOpportunity";
import EditOpportunity from "./components/EditOpportunity"; // Added route for editing opportunity

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Ulogin />} />
        <Route path="/register" element={<Uregister />} />
        <Route path="/user-profile" element={<UserProfileAndEdit />} />
        <Route path="/user-request" element={<RequestPage />} />
        <Route path="/submission/:requestId" element={<SubmissionDetails />} />
        <Route path="/volunteer-home" element={<VolunteerHomePage />} />
        <Route path="/volunteer-opportunities" element={<VolunteerOpportunities />} />
        <Route path="/edit-opportunity/:id" element={<EditOpportunity />} /> {/* New Edit Opportunity Route */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/create-opportunity" element={<CreateOpportunity />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin-dashboard" element={<Adashboard />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
};

export default App;
