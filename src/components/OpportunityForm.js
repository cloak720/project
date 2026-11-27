import React, { useState } from "react";
import { Link } from "react-router-dom";
import { OPPORTUNITY_CATEGORIES, nowLocalInput } from "../lib/format";
import { Alert, Field } from "./ui";

const DESCRIPTION_MAX = 500;

export const EMPTY_OPPORTUNITY = { name: "", description: "", category: "", deadline: "", location: "", volunteerLimit: "5" };

/** Shared by Create and Edit. `minLimit` stops admins shrinking below the volunteers who already joined. */
const OpportunityForm = ({ initial, submitLabel, busyLabel, onSubmit, serverError, minLimit = 1 }) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = "Give it a name.";
    if (!form.description.trim()) er.description = "Describe what volunteers will do.";
    if (!form.category.trim()) er.category = "Choose a category.";
    if (!form.location.trim()) er.location = "Where is it happening?";
    if (!form.deadline) er.deadline = "Pick a date.";
    else if (new Date(form.deadline) <= new Date()) er.deadline = "The date must be in the future.";
    const limit = Number(form.volunteerLimit);
    if (!Number.isInteger(limit) || limit < minLimit)
      er.volunteerLimit = minLimit > 1 ? `At least ${minLimit}: that many people have already joined.` : "At least 1 volunteer.";
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        location: form.location.trim(),
        deadline: new Date(form.deadline).toISOString(),
        volunteerLimit: Number(form.volunteerLimit),
      });
    } finally {
      setBusy(false);
    }
  };

  const categories = OPPORTUNITY_CATEGORIES.includes(form.category) || !form.category
    ? OPPORTUNITY_CATEGORIES
    : [form.category, ...OPPORTUNITY_CATEGORIES];

  return (
    <form className="card card--pad-lg form" onSubmit={handleSubmit} noValidate>
      <Alert>{serverError}</Alert>
      <Field label="Name" htmlFor="name" error={errors.name}>
        <input id="name" name="name" value={form.name} onChange={set} maxLength={100} placeholder="e.g. Saturday park clean-up" />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description} hint={`${form.description.length}/${DESCRIPTION_MAX}`}>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={set}
          maxLength={DESCRIPTION_MAX}
          rows={5}
          placeholder="What will volunteers do? What should they bring?"
        />
      </Field>
      <div className="form-grid">
        <Field label="Category" htmlFor="category" error={errors.category}>
          <select id="category" name="category" value={form.category} onChange={set}>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location}>
          <input id="location" name="location" value={form.location} onChange={set} placeholder="e.g. Riverside Park, north gate" />
        </Field>
        <Field label="Date & time" htmlFor="deadline" error={errors.deadline}>
          <input id="deadline" name="deadline" type="datetime-local" min={nowLocalInput()} value={form.deadline} onChange={set} />
        </Field>
        <Field label="Volunteers needed" htmlFor="volunteerLimit" error={errors.volunteerLimit}>
          <input id="volunteerLimit" name="volunteerLimit" type="number" min={minLimit} max={500} value={form.volunteerLimit} onChange={set} />
        </Field>
      </div>
      <div className="form-actions">
        <Link to="/volunteer-opportunities" className="btn btn--ghost">
          Cancel
        </Link>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default OpportunityForm;
