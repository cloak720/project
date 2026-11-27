import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../context/AppContext";
import { homePathFor } from "../lib/auth";

/**
 * Sends logged-out visitors to /login (remembering where they were going) and
 * people with the wrong role to their own home page.
 */
const ProtectedRoute = ({ roles, children }) => {
  const session = useSession();
  const location = useLocation();

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(session.role)) return <Navigate to={homePathFor(session.role)} replace />;
  return children;
};

export default ProtectedRoute;
