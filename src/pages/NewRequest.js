import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Eye } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { CATEGORIES, addDays, nowLocalInput, toLocalInput } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import CategoryArt from "../components/art/Spots";
import RequestCard from "../components/RequestCard";
import { Alert, Field, PageHead, describedBy, fadeUp } from "../components/ui";

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;

const CATEGORY_HINTS = {
  Groceries: "Shopping & deliveries",
  Medical: "Prescriptions & check-ins",
  Transport: "Lifts & appointments",
  Household: "Repairs & heavy lifting",
  Companionship: "A visit or a chat",
  Other: "Anything else",
};

const URGENCIES = [
  { value: "Low", hint: "Whenever someone's free", tone: "var(--forest)", soft: "var(--forest-soft)" },
  { value: "Medium", hint: "In the next few days", tone: "var(--ochre-ink)", soft: "var(--ochre-soft)" },
  { value: "High", hint: "As soon as possible", tone: "var(--danger)", soft: "var(--danger-soft)" },
];

const quickTimes = () => {
  const now = new Date();
  const options = [];
  if (now.getHours() < 16) options.push({ label: "This evening", date: addDays(0, 18) });
  options.push({ label: "Tomorrow morning", date: addDays(1, 10) });
  options.push({ label: "In 3 days", date: addDays(3, 12) });
  options.push({ label: "Next week", date: addDays(7, 12) });
  return options.map((o) => ({ ...o, value: toLocalInput(o.date) }));
};

const NewRequest = () => {
  useTitle("Ask for help");
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    requestType: "",
    description: "",
    category: "",
    deadline: "",
    urgency: "Medium",
    phoneNumber: "",
    houseNo: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quick] = useState(quickTimes);

  // Prefill contact details from the profile so people don't retype them every time.
  useEffect(() => {
    api
      .get(`/user/${session.userId}`)
      .then(({ data }) =>
        setForm((f) => ({ ...f, phoneNumber: f.phoneNumber || data.phoneNo || "", houseNo: f.houseNo || data.houseNo || "" }))
      )
      .catch(() => {});
  }, [session.userId]);

  const update = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };
  const set = (e) => update(e.target.name, e.target.value);

  const validateForm = () => {
    const er = {};
    if (!form.requestType.trim()) er.requestType = "Give your request a short headline.";
    if (!form.description.trim()) er.description = "Describe what you need so volunteers know what they're signing up for.";
    if (!form.category) er.category = "Choose the closest category.";
    if (!form.deadline) er.deadline = "Choose when you need this done by.";
    else if (new Date(form.deadline) <= new Date()) er.deadline = "That time has already passed. Pick a time in the future.";
    if (!/^\d{10,15}$/.test(form.phoneNumber.replace(/[\s-]/g, ""))) er.phoneNumber = "Enter a phone number with 10 to 15 digits.";
    if (!form.houseNo.trim()) er.houseNo = "Enter your house or flat number.";
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const er = validateForm();
    setErrors(er);
    const firstInvalid = Object.keys(er)[0];
    if (firstInvalid) {
      document.getElementsByName(firstInvalid)[0]?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/requests/create", {
        ...form,
        requestType: form.requestType.trim(),
        description: form.description.trim(),
        phoneNumber: form.phoneNumber.replace(/[\s-]/g, ""),
        houseNo: form.houseNo.trim(),
        deadline: new Date(form.deadline).toISOString(),
      });
      toast("Your request is up on the noticeboard. Volunteers nearby can see it now.");
      navigate(data?.id ? `/my-requests?highlight=${data.id}` : "/my-requests");
    } catch (err) {
      setServerError(errorMessage(err, "We couldn't post your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const preview = {
    id: "preview",
    requestType: form.requestType.trim() || "Your headline goes here",
    description: form.description.trim() || "A couple of sentences about what you need, where, and anything a helper should know.",
    category: form.category || "Other",
    deadline: form.deadline ? new Date(form.deadline).toISOString() : addDays(1, 10).toISOString(),
    urgency: form.urgency,
    houseNo: form.houseNo || "—",
    status: "PENDING",
    user: { firstName: session.firstName },
  };

  return (
    <div className="container page">
      <PageHead
        kicker="New request"
        title="What could a neighbor help with?"
        lede="Clear, specific requests get picked up fastest. Your phone number is only shared with the volunteer who accepts."
      />

      <div className="compose">
        <form className="card card--pad-lg form compose__form" onSubmit={handleSubmit} noValidate>
          <Alert>{serverError}</Alert>

          <fieldset className="form-section form-section--first">
            <legend className="form-section__title">
              <span className="form-section__num">1.</span> The request
            </legend>
            <Field
              label="Headline"
              htmlFor="requestType"
              error={errors.requestType}
              hint={`${form.requestType.length}/${TITLE_MAX}`}
            >
              <input
                id="requestType"
                name="requestType"
                value={form.requestType}
                onChange={set}
                maxLength={TITLE_MAX}
                placeholder="e.g. Pick up a prescription from Elm St pharmacy"
                {...describedBy("requestType", errors.requestType, true)}
              />
            </Field>
            <Field
              label="Details"
              htmlFor="description"
              error={errors.description}
              hint={`${form.description.length}/${DESCRIPTION_MAX} characters`}
            >
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={set}
                maxLength={DESCRIPTION_MAX}
                rows={5}
                placeholder="What do you need, where, and is there anything a volunteer should know?"
                {...describedBy("description", errors.description, true)}
              />
            </Field>
          </fieldset>

          <fieldset className="form-section" aria-describedby={errors.category ? "category-error" : undefined}>
            <legend className="form-section__title">
              <span className="form-section__num">2.</span> Category
            </legend>
            <div className="choice-grid choice-grid--cats">
              {CATEGORIES.map((c) => (
                <label key={c} className={`choice choice--compact ${form.category === c ? "is-selected" : ""}`}>
                  <input type="radio" name="category" value={c} checked={form.category === c} onChange={set} />
                  <span className="choice__check" aria-hidden="true">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <CategoryArt category={c} className="choice__art" />
                  <span className="choice__title">{c}</span>
                  <span className="choice__text">{CATEGORY_HINTS[c]}</span>
                </label>
              ))}
            </div>
            {errors.category && (
              <p className="field__error" id="category-error">
                {errors.category}
              </p>
            )}
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section__title">
              <span className="form-section__num">3.</span> Timing
            </legend>
            <Field label="Needed by" htmlFor="deadline" error={errors.deadline}>
              <input
                id="deadline"
                name="deadline"
                type="datetime-local"
                min={nowLocalInput()}
                value={form.deadline}
                onChange={set}
                {...describedBy("deadline", errors.deadline)}
              />
            </Field>
            <div className="chips" role="group" aria-label="Quick picks for the deadline">
              {quick.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className={`chip ${form.deadline === q.value ? "is-active" : ""}`}
                  aria-pressed={form.deadline === q.value}
                  onClick={() => update("deadline", q.value)}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <div className="field">
              <span className="label" id="urgency-label">
                How urgent is it?
              </span>
              <div className="segmented" role="radiogroup" aria-labelledby="urgency-label">
                {URGENCIES.map((u) => (
                  <label
                    key={u.value}
                    className={`segmented__option ${form.urgency === u.value ? "is-selected" : ""}`}
                    style={{ "--tone": u.tone, "--tone-soft": u.soft }}
                  >
                    <input type="radio" name="urgency" value={u.value} checked={form.urgency === u.value} onChange={set} />
                    <strong>{u.value}</strong>
                    <span>{u.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section__title">
              <span className="form-section__num">4.</span> How a volunteer reaches you
            </legend>
            <div className="form-grid">
              <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber}>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.phoneNumber}
                  onChange={set}
                  {...describedBy("phoneNumber", errors.phoneNumber)}
                />
              </Field>
              <Field label="House or flat number" htmlFor="houseNo" error={errors.houseNo}>
                <input id="houseNo" name="houseNo" value={form.houseNo} onChange={set} {...describedBy("houseNo", errors.houseNo)} />
              </Field>
            </div>
          </fieldset>

          <div className="form-actions">
            <Link to="/my-requests" className="btn btn--ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
              {submitting ? "Posting…" : "Post my request"}
            </button>
          </div>
        </form>

        <motion.aside className="compose__preview" aria-label="Preview" {...fadeUp}>
          <p className="kicker kicker--plain">
            <Eye size={14} aria-hidden="true" /> How volunteers will see it
          </p>
          <RequestCard request={preview} view="board" />
          <p className="small muted">Volunteers see your first name and house number. Your phone number appears only after someone commits to help.</p>
        </motion.aside>
      </div>
    </div>
  );
};

export default NewRequest;
