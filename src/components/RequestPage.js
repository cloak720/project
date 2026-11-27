import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../lib/api";
import { CATEGORIES, nowLocalInput } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import { Alert, Field, PageHeader } from "./ui";

const DESCRIPTION_MAX = 500;
const URGENCIES = [
  { value: "Low", hint: "Whenever someone is free" },
  { value: "Medium", hint: "In the next few days" },
  { value: "High", hint: "As soon as possible" },
];

const RequestPage = () => {
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

  // Prefill contact details from the profile so people don't retype them every time.
  useEffect(() => {
    api
      .get(`/user/${session.userId}`)
      .then(({ data }) =>
        setForm((f) => ({ ...f, phoneNumber: f.phoneNumber || data.phoneNo || "", houseNo: f.houseNo || data.houseNo || "" }))
      )
      .catch(() => {});
  }, [session.userId]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validateForm = () => {
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
    const er = validateForm();
    setErrors(er);
    if (Object.keys(er).length) return;

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
      toast("Request posted. Volunteers nearby can see it now.");
      navigate(`/my-requests?highlight=${data?.id ?? ""}`);
    } catch (err) {
      setServerError(errorMessage(err, "We couldn't post your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page page--narrow">
      <PageHeader
        eyebrow="New request"
        title="What do you need help with?"
        subtitle="Be specific. Clear requests get picked up faster. Your phone number is only shown to volunteers."
      />
      <form className="card card--pad-lg form" onSubmit={handleSubmit} noValidate>
        <Alert>{serverError}</Alert>

        <Field label="Title" htmlFor="requestType" error={errors.requestType}>
          <input
            id="requestType"
            name="requestType"
            value={form.requestType}
            onChange={set}
            maxLength={100}
            placeholder="e.g. Pick up a prescription from the pharmacy"
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
            placeholder="What, where, and anything a volunteer should know."
          />
        </Field>

        <div className="form-grid">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <select id="category" name="category" value={form.category} onChange={set}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Needed by" htmlFor="deadline" error={errors.deadline}>
            <input id="deadline" name="deadline" type="datetime-local" min={nowLocalInput()} value={form.deadline} onChange={set} />
          </Field>
        </div>

        <fieldset className="segmented">
          <legend className="label">How urgent is it?</legend>
          <div className="segmented__options">
            {URGENCIES.map((u) => (
              <label key={u.value} className={`segmented__option ${form.urgency === u.value ? "is-selected" : ""} urgency-${u.value.toLowerCase()}`}>
                <input type="radio" name="urgency" value={u.value} checked={form.urgency === u.value} onChange={set} />
                <strong>{u.value}</strong>
                <span>{u.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid">
          <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber}>
            <input id="phoneNumber" name="phoneNumber" type="tel" inputMode="numeric" value={form.phoneNumber} onChange={set} />
          </Field>
          <Field label="House / flat number" htmlFor="houseNo" error={errors.houseNo}>
            <input id="houseNo" name="houseNo" value={form.houseNo} onChange={set} />
          </Field>
        </div>

        <div className="form-actions">
          <Link to="/my-requests" className="btn btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Posting…" : "Post request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestPage;
