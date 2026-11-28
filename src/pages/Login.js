import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { consumeSessionExpired, homePathFor, saveSession } from "../lib/auth";
import { useSession } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import AuthLayout from "../components/layout/AuthLayout";
import { Alert, Field } from "../components/ui";

const Login = () => {
  useTitle("Log in");
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  // Shown once if the server ended our session (consumed so a refresh doesn't repeat it).
  useEffect(() => {
    if (consumeSessionExpired()) setExpired(true);
  }, []);

  if (session) return <Navigate to={homePathFor(session.role)} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/user/login", { email: email.trim().toLowerCase(), password });
      const role = Number(data.role);
      saveSession({ userId: data.userId, role, email: data.email, firstName: data.firstName, lastName: data.lastName });
      const from = location.state?.from;
      navigate(from && !from.startsWith("/login") ? from : homePathFor(role), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError("That email and password don't match. Check them and try again.");
      else if (status === 403 && /banned/i.test(err.response.data?.message || ""))
        setError("This account has been suspended by a moderator. If you think that's a mistake, contact the NeighborAid team.");
      else setError(errorMessage(err, "We couldn't log you in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Welcome back"
      title="Good to see you again."
      lede="Log in to check on your requests and see what's happening on your street."
      footer={
        <>
          New to NeighborAid? <Link to="/register">Create a free account</Link>
        </>
      }
    >
      {location.state?.registered && <Alert tone="success">Your account is ready. Log in to get started.</Alert>}
      {expired && <Alert tone="info">For your security we signed you out. Please log in again.</Alert>}
      <Alert>{error}</Alert>
      <form className="form" onSubmit={handleLogin} noValidate>
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus={!email}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="input-with-action">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus={!!email}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
          {loading ? "Checking your details…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
