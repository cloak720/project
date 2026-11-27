import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { homePathFor, saveSession } from "../../lib/auth";
import { useDocumentTitle } from "../../lib/hooks";
import { Alert, Field, fieldProps } from "../../components/ui";
import AuthLayout from "./AuthLayout";

const Login = () => {
  useDocumentTitle("Log in");
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      // Return to the page that sent us here; the route guard redirects if it doesn't suit this role.
      const from = location.state?.from;
      navigate(from && from !== "/login" ? from : homePathFor(role), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError("That email and password don't match. Check them and try again.");
      else if (status === 403 && /banned/i.test(err.response.data?.message || ""))
        setError("This account has been suspended. Send us a message if you think this is a mistake.");
      else setError(errorMessage(err, "Couldn't log you in. Please try again."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your requests and what's happening on your street."
      footer={
        <>
          New to NeighborAid? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {location.state?.registered && <Alert tone="success">Your account is ready. Log in to get started.</Alert>}
        <Alert>{error}</Alert>
        <Field label="Email" htmlFor="email">
          <div className="input-affix">
            <Mail size={15} aria-hidden="true" />
            <input
              {...fieldProps("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={!email}
              required
            />
          </div>
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="input-affix">
            <Lock size={15} aria-hidden="true" />
            <input
              {...fieldProps("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={!!email}
              required
            />
            <button
              type="button"
              className="icon-btn input-affix__action"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <button type="submit" className={`btn btn--primary btn--lg btn--block ${loading ? "is-loading" : ""}`} disabled={loading}>
          Log in <ArrowRight size={16} />
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
