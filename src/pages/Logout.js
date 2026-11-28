import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import { Loading } from "../components/ui";

// Visiting /logout signs you out and returns you to the login page.
const Logout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    logout().then(() => navigate("/login", { replace: true }));
  }, [navigate]);
  return <Loading label="Signing you out…" />;
};

export default Logout;
