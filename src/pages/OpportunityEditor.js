import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { OPPORTUNITY_CATEGORIES, addDays, toDateInput } from "../lib/format";
import { useToast } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import { SignpostArt } from "../components/art/Scenes";
import EventRow from "../components/EventRow";
import { Alert, EmptyState, Field, Loading, PageHead, describedBy } from "../components/ui";

const DESCRIPTION_MAX = 500;
const EMPTY = { name: "", description: "", category: "", deadline: "", location: "", volunteerLimit: "6" };

/**
 * Shared by create and edit. The backend stores the date as a calendar day and lists an
 * opportunity while that day is still ahead, so new dates must be tomorrow or later.
 * `minLimit` stops admins shrinking below the volunteers who already joined.
 */
const OpportunityForm = ({ initial, submitLabel, busyLabel, onSubmit, serverError, minLimit = 1 }) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const tomorrow = toDateInput(addDays(1));

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = "Give it a name volunteers will recognize.";
    if (!form.description.trim()) er.description = "Describe what volunteers will be doing.";
    if (!form.category) er.category = "Choose a category.";
    if (!form.location.trim()) er.location = "Where is it happening?";
    if (!form.deadline) er.deadline = "Pick the date.";
    else if (form.deadline !== initial.deadline && form.deadline < tomorrow) er.deadline = "Choose a date from tomorrow onwards.";
    const limit = Number(form.volunteerLimit);
    if (!Number.isInteger(limit) || limit < minLimit)
      er.volunteerLimit = minLimit > 1 ? `At least ${minLimit}: that many people have already signed up.` : "At least 1 volunteer.";
    else if (limit > 500) er.volunteerLimit = "That's a lot of people. Keep it to 500 or fewer.";
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    const first = Object.keys(er)[0];
    if (first) {
      document.getElementsByName(first)[0]?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        deadline: form.deadline,
        volunteerLimit: Number(form.volunteerLimit),
      });
    } finally {
      setBusy(false);
    }
  };

  const categories = OPPORTUNITY_CATEGORIES.includes(form.category) || !form.category ? OPPORTUNITY_CATEGORIES : [form.category, ...OPPORTUNITY_CATEGORIES];

  const preview = {
    id: "preview",
    name: form.name.trim() || "Your opportunity's name",
    description: form.description.trim() || "What volunteers will do, and what to bring.",
    category: form.category || "Community",
    location: form.location.trim() || "Somewhere nearby",
    deadline: form.deadline || tomorrow,
    volunteerLimit: Number(form.volunteerLimit) || 1,
    volunteers: Array.from({ length: minLimit > 1 ? minLimit : 0 }, (_, i) => ({ id: i })),
  };

  return (
    <div className="compose">
      <form className="card card--pad-lg form compose__form" onSubmit={handleSubmit} noValidate>
        <Alert>{serverError}</Alert>
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input id="name" name="name" value={form.name} onChange={set} maxLength={100} placeholder="e.g. Saturday park clean-up" {...describedBy("name", errors.name)} />
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
            {...describedBy("description", errors.description, true)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <select id="category" name="category" value={form.category} onChange={set} {...describedBy("category", errors.category)}>
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Location" htmlFor="location" error={errors.location}>
            <input id="location" name="location" value={form.location} onChange={set} placeholder="e.g. Riverside Park, north gate" {...describedBy("location", errors.location)} />
          </Field>
          <Field label="Date" htmlFor="deadline" error={errors.deadline} hint="Sign-ups close the day before.">
            <input id="deadline" name="deadline" type="date" min={tomorrow} value={form.deadline} onChange={set} {...describedBy("deadline", errors.deadline, true)} />
          </Field>
          <Field label="Volunteers needed" htmlFor="volunteerLimit" error={errors.volunteerLimit}>
            <input
              id="volunteerLimit"
              name="volunteerLimit"
              type="number"
              inputMode="numeric"
              min={minLimit}
              max={500}
              value={form.volunteerLimit}
              onChange={set}
              {...describedBy("volunteerLimit", errors.volunteerLimit)}
            />
          </Field>
        </div>
        <div className="form-actions">
          <Link to="/volunteer-opportunities" className="btn btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
            {busy ? busyLabel : submitLabel}
          </button>
        </div>
      </form>
      <aside className="compose__preview" aria-label="Preview">
        <p className="kicker kicker--plain">How it will be listed</p>
        <EventRow opportunity={preview} />
      </aside>
    </div>
  );
};

export const CreateOpportunity = () => {
  useTitle("New opportunity");
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState("");

  const handleCreate = async (payload) => {
    setError("");
    try {
      await api.post("/opportunities", payload);
      toast("Published. Volunteers can sign up now.");
      navigate("/volunteer-opportunities");
    } catch (err) {
      setError(errorMessage(err, "We couldn't create the opportunity."));
    }
  };

  return (
    <div className="container page">
      <PageHead
        kicker="New listing"
        title="Rally some volunteers"
        lede="Volunteers will see this on the opportunities page and can sign up until it's full."
      />
      <OpportunityForm initial={EMPTY} submitLabel="Publish" busyLabel="Publishing…" onSubmit={handleCreate} serverError={error} />
    </div>
  );
};

export const EditOpportunity = () => {
  useTitle("Edit opportunity");
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [initial, setInitial] = useState(null);
  const [joined, setJoined] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/opportunities/${id}`)
      .then(({ data }) => {
        setJoined(data.volunteers?.length || 0);
        setInitial({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          deadline: toDateInput(data.deadline),
          volunteerLimit: String(data.volunteerLimit ?? 1),
        });
      })
      .catch((err) =>
        setLoadError(err.response?.status === 404 ? "This opportunity doesn't exist any more." : errorMessage(err, "We couldn't load this opportunity."))
      );
  }, [id]);

  const handleSave = async (payload) => {
    setError("");
    try {
      await api.put(`/opportunities/${id}`, payload);
      toast("Changes saved.");
      navigate("/volunteer-opportunities");
    } catch (err) {
      setError(errorMessage(err, "We couldn't save your changes."));
    }
  };

  if (loadError) {
    return (
      <div className="container page page--narrow">
        <EmptyState
          art={SignpostArt}
          title={loadError}
          action={
            <Link to="/volunteer-opportunities" className="btn btn--sm">
              <ArrowLeft size={15} /> Back to opportunities
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <PageHead
        kicker="Edit listing"
        title={initial?.name || "Edit opportunity"}
        lede={joined ? `${joined} volunteer${joined > 1 ? "s have" : " has"} already signed up, so the limit can't go below that.` : "Nobody has signed up yet."}
      />
      {initial ? (
        <OpportunityForm initial={initial} minLimit={Math.max(1, joined)} submitLabel="Save changes" busyLabel="Saving…" onSubmit={handleSave} serverError={error} />
      ) : (
        <Loading label="Opening the listing…" />
      )}
    </div>
  );
};
