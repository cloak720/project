import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../context/AppContext";
import { homePathFor } from "../../lib/auth";

/**
 * Sends logged-out visitors to /login (remembering where they were going) and
 * people with the wrong role to their own home page.
 */
export const RequireRole = ({ roles }) => {
  const session = useSession();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(session.role)) return <Navigate to={homePathFor(session.role)} replace />;
  return <Outlet />;
};

/** Login and registration make no sense when already signed in. */
export const GuestOnly = ({ children }) => {
  const session = useSession();
  return session ? <Navigate to={homePathFor(session.role)} replace /> : children;
};
