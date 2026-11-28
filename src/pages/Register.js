import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Eye, EyeOff } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES, homePathFor } from "../lib/auth";
import { validate, passwordStrength, MIN_AGE } from "../lib/validation";
import { useSession } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import AuthLayout from "../components/layout/AuthLayout";
import CategoryArt from "../components/art/Spots";
import { Alert, Field, describedBy } from "../components/ui";

const FIELDS = ["firstName", "lastName", "email", "password", "houseNo", "phoneNo", "age"];

const ROLE_OPTIONS = [
  { value: ROLES.USER, art: "Groceries", title: "I could use a hand", text: "Post requests for errands, lifts and fix-its." },
  { value: ROLES.VOLUNTEER, art: "Community", title: "I'd like to help", text: "Pick up requests and join community projects." },
];

const Register = () => {
  useTitle("Join");
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
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to={homePathFor(session.role)} replace />;

  // Errors are derived from current values, so fixing one field never wipes another's message.
  const errors = validate(values, FIELDS);
  if (!values.confirmPassword) errors.confirmPassword = "Type your password again.";
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "The passwords don't match.";
  if (!agree) errors.agree = "Please accept the terms to continue.";
  const show = (f) => ((submitted || touched[f]) && errors[f]) || "";

  const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (Object.keys(errors).length) {
      // Wait a frame so the invalid fields have rendered their state, then focus the first.
      requestAnimationFrame(() => document.querySelector(".field--invalid input, [data-invalid='true']")?.focus());
      return;
    }
    setLoading(true);
    const email = values.email.trim().toLowerCase();
    try {
      await api.post("/user/register", {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email,
        password: values.password,
        houseNo: values.houseNo.trim(),
        phoneNo: values.phoneNo.replace(/[\s-]/g, ""),
        age: Number(values.age),
        role: values.role,
      });
      navigate("/login", { state: { registered: true, email } });
    } catch (err) {
      setServerError(errorMessage(err, "We couldn't create your account. Please try again."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(values.password);
  const passwordHint = values.password ? `Strength: ${strength.label}` : "8 or more characters, with a number and a symbol.";

  const input = (name, props = {}, hint) => (
    <input id={name} name={name} value={values[name]} onChange={set} onBlur={blur} {...describedBy(name, show(name), hint)} {...props} />
  );

  return (
    <AuthLayout
      wide
      kicker="Join the neighborhood"
      title="A free account, in about a minute."
      lede="Tell us a little about yourself. You can change any of this later from your profile."
      footer={
        <>
          Already a member? <Link to="/login">Log in</Link>
        </>
      }
    >
      <Alert>{serverError}</Alert>
      <form className="form" onSubmit={handleRegister} noValidate>
        <fieldset className="form-section form-section--first">
          <legend className="form-section__title">
            <span className="form-section__num">1.</span> I'm joining because…
          </legend>
          <div className="choice-grid choice-grid--2">
            {ROLE_OPTIONS.map((o) => (
              <label key={o.value} className={`choice ${values.role === o.value ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value={o.value}
                  checked={values.role === o.value}
                  onChange={() => setValues((v) => ({ ...v, role: o.value }))}
                />
                <span className="choice__check" aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                <CategoryArt category={o.art} className="choice__art" />
                <span className="choice__title">{o.title}</span>
                <span className="choice__text">{o.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">
            <span className="form-section__num">2.</span> About you
          </legend>
          <div className="form-grid">
            <Field label="First name" htmlFor="firstName" error={show("firstName")}>
              {input("firstName", { autoComplete: "given-name" })}
            </Field>
            <Field label="Last name" htmlFor="lastName" error={show("lastName")}>
              {input("lastName", { autoComplete: "family-name" })}
            </Field>
            <Field label="Email address" htmlFor="email" error={show("email")} className="span-2">
              {input("email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
            </Field>
            <Field label="Password" htmlFor="password" error={show("password")} hint={passwordHint}>
              <div className="input-with-action">
                {input("password", { type: showPassword ? "text" : "password", autoComplete: "new-password" }, passwordHint)}
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
              {input("confirmPassword", { type: showPassword ? "text" : "password", autoComplete: "new-password" })}
            </Field>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">
            <span className="form-section__num">3.</span> Where neighbors can find you
          </legend>
          <div className="form-grid">
            <Field label="House or flat number" htmlFor="houseNo" error={show("houseNo")}>
              {input("houseNo", { autoComplete: "address-line1", placeholder: "e.g. 14B" })}
            </Field>
            <Field label="Phone number" htmlFor="phoneNo" error={show("phoneNo")} hint="Only shared with people you're working with.">
              {input("phoneNo", { type: "tel", autoComplete: "tel", inputMode: "numeric", placeholder: "10 digits" }, "Only shared with people you're working with.")}
            </Field>
            <Field label="Age" htmlFor="age" error={show("age")} hint={`Members must be ${MIN_AGE} or older.`}>
              {input("age", { type: "number", min: MIN_AGE, max: 120, inputMode: "numeric" }, `Members must be ${MIN_AGE} or older.`)}
            </Field>
          </div>
        </fieldset>

        <div className={submitted && errors.agree ? "field--invalid" : ""}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              data-invalid={submitted && !!errors.agree}
              aria-describedby={submitted && errors.agree ? "agree-error" : undefined}
            />
            <span>
              I'm over {MIN_AGE} and agree to the{" "}
              <Link to="/terms" target="_blank" rel="noreferrer">
                Terms of use
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank" rel="noreferrer">
                Privacy notice
              </Link>
              .
            </span>
          </label>
          {submitted && errors.agree && (
            <p className="field__error" id="agree-error">
              {errors.agree}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
          {loading ? "Creating your account…" : "Create my account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
