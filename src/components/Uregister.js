import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { HandHeart, Home as HomeIcon } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES, homePathFor } from "../lib/auth";
import { validate, passwordStrength, MIN_AGE } from "../lib/validation";
import { useSession } from "../context/AppContext";
import AuthLayout from "./AuthLayout";
import { Alert, Field } from "./ui";

const FIELDS = ["firstName", "lastName", "email", "password", "houseNo", "phoneNo", "age"];

const ROLE_OPTIONS = [
  { value: ROLES.USER, icon: HomeIcon, title: "I need help", text: "Post requests to neighbors" },
  { value: ROLES.VOLUNTEER, icon: HandHeart, title: "I want to help", text: "Volunteer in my area" },
];

const Uregister = () => {
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    houseNo: "",
    phoneNo: "",
    age: "",
    role: params.get("role") === "2" ? ROLES.VOLUNTEER : ROLES.USER,
  });
  const [touched, setTouched] = useState({});
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to={homePathFor(session.role)} replace />;

  // Errors are derived from current values, so fixing one field never wipes another's message.
  const errors = validate(values, FIELDS);
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords don't match.";
  if (!agree) errors.agree = "Please accept the terms to continue.";
  const show = (f) => (submitted || touched[f]) && errors[f];

  const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (Object.keys(errors).length) {
      const first = document.querySelector(".field--invalid input, .field--invalid select");
      first?.focus();
      return;
    }
    setLoading(true);
    try {
      await api.post("/user/register", {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        houseNo: values.houseNo.trim(),
        phoneNo: values.phoneNo.replace(/[\s-]/g, ""),
        age: Number(values.age),
        role: values.role,
      });
      navigate("/login", { state: { registered: true, email: values.email.trim().toLowerCase() } });
    } catch (err) {
      setServerError(errorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(values.password);

  const input = (name, props = {}) => (
    <input
      id={name}
      name={name}
      value={values[name]}
      onChange={set}
      onBlur={blur}
      aria-invalid={!!show(name)}
      aria-describedby={show(name) ? `${name}-error` : undefined}
      {...props}
    />
  );

  return (
    <AuthLayout
      title="Join your neighborhood"
      subtitle="It takes a minute. You can change these details later."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <Alert>{serverError}</Alert>
      <form className="form" onSubmit={handleRegister} noValidate>
        <fieldset className="role-picker">
          <legend className="label">I'm joining because…</legend>
          <div className="role-picker__options">
            {ROLE_OPTIONS.map((o) => (
              <label key={o.value} className={`role-option ${values.role === o.value ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value={o.value}
                  checked={values.role === o.value}
                  onChange={() => setValues((v) => ({ ...v, role: o.value }))}
                />
                <o.icon size={20} aria-hidden="true" />
                <span className="role-option__title">{o.title}</span>
                <span className="role-option__text">{o.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid">
          <Field label="First name" htmlFor="firstName" error={show("firstName")}>
            {input("firstName", { autoComplete: "given-name" })}
          </Field>
          <Field label="Last name" htmlFor="lastName" error={show("lastName")}>
            {input("lastName", { autoComplete: "family-name" })}
          </Field>
          <Field label="Email" htmlFor="email" error={show("email")} className="span-2">
            {input("email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
          </Field>
          <Field
            label="Password"
            htmlFor="password"
            error={show("password")}
            hint={values.password ? `Strength: ${strength.label}` : "8+ characters with a number and a symbol."}
          >
            {input("password", { type: "password", autoComplete: "new-password" })}
            {values.password && (
              <div className={`strength strength--${strength.score}`} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={show("confirmPassword")}>
            {input("confirmPassword", { type: "password", autoComplete: "new-password" })}
          </Field>
          <Field label="House / flat number" htmlFor="houseNo" error={show("houseNo")}>
            {input("houseNo", { autoComplete: "address-line1", placeholder: "e.g. 12B" })}
          </Field>
          <Field label="Phone number" htmlFor="phoneNo" error={show("phoneNo")}>
            {input("phoneNo", { type: "tel", autoComplete: "tel", inputMode: "numeric", placeholder: "10 digits" })}
          </Field>
          <Field label="Age" htmlFor="age" error={show("age")} hint={`You must be ${MIN_AGE} or older.`}>
            {input("age", { type: "number", min: MIN_AGE, max: 120, inputMode: "numeric" })}
          </Field>
        </div>

        <div className={submitted && errors.agree ? "field--invalid" : ""}>
          <label className="checkbox">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              I agree to the{" "}
              <Link to="/terms" target="_blank">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {submitted && errors.agree && <p className="field__error">{errors.agree}</p>}
        </div>

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Uregister;
