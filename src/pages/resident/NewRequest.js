import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Send } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { REQUEST_CATEGORIES, URGENCIES, nowLocalInput, toLocalInput } from "../../lib/format";
import { useDocumentTitle } from "../../lib/hooks";
import { useSession, useToast } from "../../context/AppContext";
import { useShell } from "../../components/shell/AppShell";
import { Alert, ChoiceGroup, Field, PageHeader, fieldProps } from "../../components/ui";
import { categoryIcon } from "../../components/ui/categories";
import RequestCard from "../../components/requests/RequestCard";

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;

const URGENCY_OPTIONS = [
  { value: "Low", title: "Low", text: "Whenever someone's free" },
  { value: "Medium", title: "Medium", text: "In the next few days" },
  { value: "High", title: "High", text: "As soon as possible" },
].filter((o) => URGENCIES.includes(o.value));

const at = (daysAhead, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/** Quick deadline picks; only ones still in the future are offered. */
const presets = () =>
  [
    { label: "This evening", date: at(0, 19) },
    { label: "Tomorrow morning", date: at(1, 10) },
    { label: "In 3 days", date: at(3, 12) },
    { label: "Next week", date: at(7, 12) },
  ].filter((p) => p.date > new Date(Date.now() + 30 * 60000));

const NewRequest = () => {
  useDocumentTitle("New request");
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const shell = useShell();
  const [params] = useSearchParams();
  const initialCategory = REQUEST_CATEGORIES.includes(params.get("category")) ? params.get("category") : "";
  const [form, setForm] = useState({
    requestType: "",
    description: "",
    category: initialCategory,
    deadline: "",
    urgency: "Medium",
    phoneNumber: "",
    houseNo: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill contact details from the profile so people don't retype them every time.
  useEffect(() => {
    api
      .get(`/user/${session.userId}`)
      .then(({ data }) =>
        setForm((f) => ({ ...f, phoneNumber: f.phoneNumber || data?.phoneNo || "", houseNo: f.houseNo || data?.houseNo || "" }))
      )
      .catch(() => {});
  }, [session.userId]);

  const update = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };
  const set = (e) => update(e.target.name, e.target.value);

  const check = () => {
    const er = {};
    if (!form.requestType.trim()) er.requestType = "Give your request a short title.";
    if (!form.description.trim()) er.description = "Describe what you need help with.";
    if (!form.category) er.category = "Choose a category.";
    if (!form.deadline) er.deadline = "Choose when you need this done by.";
    else if (new Date(form.deadline) <= new Date()) er.deadline = "The deadline must be in the future.";
    if (!/^\d{10,15}$/.test(form.phoneNumber.replace(/[\s-]/g, ""))) er.phoneNumber = "Enter 10 to 15 digits.";
    if (!form.houseNo.trim()) er.houseNo = "Enter your house or flat number.";
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const er = check();
    setErrors(er);
    if (Object.keys(er).length) {
      requestAnimationFrame(() => document.querySelector(".field--invalid input, .field--invalid textarea, .field--invalid select")?.focus());
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/requests/create", {
        requestType: form.requestType.trim(),
        description: form.description.trim(),
        category: form.category,
        urgency: form.urgency,
        phoneNumber: form.phoneNumber.replace(/[\s-]/g, ""),
        houseNo: form.houseNo.trim(),
        deadline: new Date(form.deadline).toISOString(),
      });
      toast("Request posted. Volunteers nearby can see it now.");
      shell.refresh();
      navigate(data?.id ? `/requests?highlight=${data.id}` : "/requests");
    } catch (err) {
      setServerError(errorMessage(err, "We couldn't post your request. Please try again."));
      setSubmitting(false);
    }
  };

  const preview = {
    id: "preview",
    requestType: form.requestType.trim() || "Your request title",
    description: form.description.trim() || "Details about what you need will appear here.",
    category: form.category,
    urgency: form.urgency,
    houseNo: form.houseNo.trim() || "?",
    deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    status: "PENDING",
  };

  return (
    <>
      <PageHeader
        eyebrow="New request"
        title="What do you need a hand with?"
        subtitle="Be specific: clear requests get picked up faster. Your phone number is only shared with the volunteer who accepts."
      />
      <div className="composer">
        <form className="card card--pad form" onSubmit={handleSubmit} noValidate>
          <Alert>{serverError}</Alert>

          <Field
            label="Title"
            htmlFor="requestType"
            error={errors.requestType}
            aside={<span className="field__hint mono">{form.requestType.length}/{TITLE_MAX}</span>}
          >
            <input
              {...fieldProps("requestType", errors.requestType)}
              value={form.requestType}
              onChange={set}
              maxLength={TITLE_MAX}
              placeholder="e.g. Pick up a prescription from the pharmacy"
              autoFocus
            />
          </Field>

          <Field
            label="Details"
            htmlFor="description"
            error={errors.description}
            aside={<span className="field__hint mono">{form.description.length}/{DESCRIPTION_MAX}</span>}
          >
            <textarea
              {...fieldProps("description", errors.description)}
              value={form.description}
              onChange={set}
              maxLength={DESCRIPTION_MAX}
              rows={4}
              placeholder="What, where, and anything a volunteer should know."
            />
          </Field>

          <fieldset className="field chip-field" aria-invalid={errors.category ? true : undefined} aria-describedby={errors.category ? "category-error" : undefined}>
            <legend className="label">Category</legend>
            <div className="chip-row">
              {REQUEST_CATEGORIES.map((c) => {
                const Icon = categoryIcon(c);
                const selected = form.category === c;
                return (
                  <label key={c} className={`chip ${selected ? "is-selected" : ""}`}>
                    <input type="radio" name="category" value={c} checked={selected} onChange={() => update("category", c)} className="sr-only" />
                    <Icon size={14} aria-hidden="true" /> {c}
                  </label>
                );
              })}
            </div>
            {errors.category && (
              <p className="field__error" id="category-error">
                {errors.category}
              </p>
            )}
          </fieldset>

          <ChoiceGroup legend="How urgent is it?" name="urgency" value={form.urgency} onChange={(v) => update("urgency", v)} options={URGENCY_OPTIONS} cols={3} />

          <Field label="Needed by" htmlFor="deadline" error={errors.deadline}>
            <input {...fieldProps("deadline", errors.deadline)} type="datetime-local" min={nowLocalInput()} value={form.deadline} onChange={set} />
            <div className="chip-row" aria-label="Quick picks">
              {presets().map((p) => (
                <button key={p.label} type="button" className="chip chip--sm" onClick={() => update("deadline", toLocalInput(p.date))}>
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="form-grid">
            <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber} hint="Shared only with your volunteer.">
              <input {...fieldProps("phoneNumber", errors.phoneNumber, "Shared only with your volunteer.")} type="tel" inputMode="numeric" autoComplete="tel" value={form.phoneNumber} onChange={set} />
            </Field>
            <Field label="House / flat" htmlFor="houseNo" error={errors.houseNo}>
              <input {...fieldProps("houseNo", errors.houseNo)} value={form.houseNo} onChange={set} />
            </Field>
          </div>

          <div className="form-actions">
            <Link to="/requests" className="btn btn--ghost">
              Cancel
            </Link>
            <button type="submit" className={`btn btn--primary ${submitting ? "is-loading" : ""}`} disabled={submitting}>
              <Send size={15} /> Post request
            </button>
          </div>
        </form>

        <aside className="composer__preview" aria-label="Preview">
          <p className="eyebrow">
            <Eye size={13} aria-hidden="true" /> What volunteers will see
          </p>
          <RequestCard request={preview} view="board" />
          <ul className="composer__tips">
            <li>Say exactly where and when, e.g. “pharmacy on Elm St, before 5pm”.</li>
            <li>Mention anything heavy, pets in the house, or access notes.</li>
            <li>Use High urgency only for things that can't wait.</li>
          </ul>
        </aside>
      </div>
    </>
  );
};

export default NewRequest;
