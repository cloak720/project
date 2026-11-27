import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, HandHeart, Home as HomeIcon } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { ROLES } from "../../lib/auth";
import { MIN_AGE, passwordStrength, validate } from "../../lib/validation";
import { useDocumentTitle } from "../../lib/hooks";
import { Alert, ChoiceGroup, Field, fieldProps } from "../../components/ui";
import AuthLayout from "./AuthLayout";

const FIELDS = ["firstName", "lastName", "email", "password", "houseNo", "phoneNo", "age"];

const ROLE_OPTIONS = [
  { value: ROLES.RESIDENT, icon: HomeIcon, title: "I need help", text: "Post requests to neighbors" },
  { value: ROLES.VOLUNTEER, icon: HandHeart, title: "I want to help", text: "Volunteer on my street" },
];

const Register = () => {
  useDocumentTitle("Create an account");
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
    role: params.get("role") === "2" ? ROLES.VOLUNTEER : ROLES.RESIDENT,
  });
  const [touched, setTouched] = useState({});
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Errors derive from the current values, so fixing one field never clears another's message.
  const errors = validate(values, FIELDS);
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords don't match.";
  if (!agree) errors.agree = "Please accept the terms to continue.";
  const show = (f) => ((submitted || touched[f]) && errors[f]) || "";

  const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (Object.keys(errors).length) {
      // Move focus to the first problem so keyboard and screen reader users land on it.
      requestAnimationFrame(() => document.querySelector(".field--invalid input, .auth__agree--invalid input")?.focus());
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
      setServerError(errorMessage(err, "Registration failed. Please try again."));
      setLoading(false);
    }
  };

  const strength = passwordStrength(values.password);

  const input = (name, props = {}, hint) => (
    <input {...fieldProps(name, show(name), hint)} value={values[name]} onChange={set} onBlur={blur} {...props} />
  );

  const passwordHint = values.password ? `Strength: ${strength.label}` : "8+ characters with a number and a symbol.";

  return (
    <AuthLayout
      title="Join your neighborhood"
      subtitle="It takes about a minute. You can change these details later."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{serverError}</Alert>
        <ChoiceGroup
          legend="I'm joining because…"
          name="role"
          value={values.role}
          onChange={(role) => setValues((v) => ({ ...v, role }))}
          options={ROLE_OPTIONS}
        />

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
          <Field label="Password" htmlFor="password" error={show("password")} hint={passwordHint}>
            <div className="input-affix">
              {input("password", { type: showPassword ? "text" : "password", autoComplete: "new-password" }, passwordHint)}
              <button
                type="button"
                className="icon-btn input-affix__action"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="meter" data-score={values.password ? strength.score : 0} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={show("confirmPassword")}>
            {input("confirmPassword", { type: showPassword ? "text" : "password", autoComplete: "new-password" })}
          </Field>
          <Field label="House / flat" htmlFor="houseNo" error={show("houseNo")}>
            {input("houseNo", { autoComplete: "address-line1", placeholder: "e.g. 12B" })}
          </Field>
          <Field label="Phone" htmlFor="phoneNo" error={show("phoneNo")}>
            {input("phoneNo", { type: "tel", autoComplete: "tel", inputMode: "numeric", placeholder: "10 digits" })}
          </Field>
          <Field label="Age" htmlFor="age" error={show("age")} hint={`You must be ${MIN_AGE} or older.`} className="span-2">
            {input("age", { type: "number", min: MIN_AGE, max: 120, inputMode: "numeric" }, `You must be ${MIN_AGE} or older.`)}
          </Field>
        </div>

        <div className={submitted && errors.agree ? "auth__agree--invalid" : ""}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              aria-invalid={submitted && errors.agree ? true : undefined}
              aria-describedby={submitted && errors.agree ? "agree-error" : undefined}
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" target="_blank" rel="noreferrer">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank" rel="noreferrer">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {submitted && errors.agree && (
            <p className="field__error" id="agree-error" style={{ marginTop: 6 }}>
              {errors.agree}
            </p>
          )}
        </div>

        <button type="submit" className={`btn btn--primary btn--lg btn--block ${loading ? "is-loading" : ""}`} disabled={loading}>
          Create account <ArrowRight size={16} />
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
