import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { homePathFor, saveSession } from "../lib/auth";
import { useSession } from "../context/AppContext";
import AuthLayout from "./AuthLayout";
import { Alert, Field } from "./ui";

const Ulogin = () => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to={homePathFor(session.role)} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/user/login", { email: email.trim(), password });
      const role = Number(data.role);
      saveSession({ userId: data.userId, role, email: data.email, firstName: data.firstName, lastName: data.lastName });
      // Go back to the page that sent us here, if it suits this role; otherwise the role's home.
      const from = location.state?.from;
      navigate(from && from !== "/login" ? from : homePathFor(role), { replace: true });
    } catch (err) {
      if (err.response?.status === 401) setError("That email and password don't match. Please try again.");
      else if (err.response?.status === 403)
        setError(err.response.data?.message === "User is banned" ? "This account has been suspended. Contact support for help." : errorMessage(err));
      else setError(errorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your requests and what's happening nearby."
      footer={
        <>
          New to NeighborAid? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {location.state?.registered && <Alert tone="success">Account created. Log in to get started.</Alert>}
      <Alert>{error}</Alert>
      <form className="form" onSubmit={handleLogin} noValidate={false}>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="input-with-action">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Ulogin;
