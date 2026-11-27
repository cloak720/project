import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Minus, Plus } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { OPPORTUNITY_CATEGORIES, nowLocalInput, toLocalInput } from "../../lib/format";
import { useDocumentTitle } from "../../lib/hooks";
import { useToast } from "../../context/AppContext";
import { Alert, Field, PageHeader, Skeleton, fieldProps } from "../../components/ui";
import OpportunityCard from "../../components/opportunities/OpportunityCard";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const LIMIT_MAX = 500;
const EMPTY = { name: "", description: "", category: "", deadline: "", location: "", volunteerLimit: "6" };

const OpportunityEditor = () => {
  const { id } = useParams();
  const editing = !!id;
  useDocumentTitle(editing ? "Edit opportunity" : "New opportunity");
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(editing ? null : EMPTY);
  const [volunteers, setVolunteers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/opportunities/${id}`)
      .then(({ data }) => {
        setVolunteers(data.volunteers || []);
        // The API returns a timestamp; the input needs local "YYYY-MM-DDTHH:mm".
        setForm({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          deadline: toLocalInput(data.deadline),
          volunteerLimit: String(data.volunteerLimit ?? 1),
        });
      })
      .catch((err) => setLoadError(err.response?.status === 404 ? "This opportunity doesn't exist any more." : errorMessage(err, "Couldn't load this opportunity.")));
  }, [editing, id]);

  const minLimit = Math.max(1, volunteers.length);

  const update = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };
  const set = (e) => update(e.target.name, e.target.value);

  const check = () => {
    const er = {};
    if (!form.name.trim()) er.name = "Give it a name.";
    if (!form.description.trim()) er.description = "Describe what volunteers will do.";
    if (!form.category.trim()) er.category = "Choose a category.";
    if (!form.location.trim()) er.location = "Where is it happening?";
    if (!form.deadline) er.deadline = "Pick a date and time.";
    else if (new Date(form.deadline) <= new Date()) er.deadline = "The date must be in the future.";
    const limit = Number(form.volunteerLimit);
    if (!Number.isInteger(limit) || limit < minLimit || limit > LIMIT_MAX)
      er.volunteerLimit = minLimit > 1 ? `Between ${minLimit} (already joined) and ${LIMIT_MAX}.` : `Between 1 and ${LIMIT_MAX}.`;
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
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      deadline: new Date(form.deadline).toISOString(),
      volunteerLimit: Number(form.volunteerLimit),
    };
    try {
      const { data } = editing ? await api.put(`/opportunities/${id}`, payload) : await api.post("/opportunities", payload);
      toast(editing ? "Changes saved." : "Opportunity published. Volunteers can sign up now.");
      navigate(`/opportunities?highlight=${data?.id ?? id ?? ""}`);
    } catch (err) {
      setServerError(errorMessage(err, editing ? "Couldn't save your changes." : "Couldn't create the opportunity."));
      setSaving(false);
    }
  };

  const categories = !form || !form.category || OPPORTUNITY_CATEGORIES.includes(form.category) ? OPPORTUNITY_CATEGORIES : [form.category, ...OPPORTUNITY_CATEGORIES];
  const limit = Number(form?.volunteerLimit) || 0;

  return (
    <>
      <PageHeader
        eyebrow={editing ? "Edit opportunity" : "New opportunity"}
        title={editing ? form?.name || "Edit opportunity" : "Rally some volunteers"}
        subtitle={
          editing
            ? volunteers.length
              ? `${volunteers.length} volunteer${volunteers.length > 1 ? "s have" : " has"} already joined, so the limit can't go below that.`
              : "Nobody has joined yet."
            : "Volunteers see this on the opportunities page and can sign up until it's full."
        }
        actions={
          <Link to="/opportunities" className="btn btn--ghost">
            <ArrowLeft size={15} /> Back
          </Link>
        }
      />

      {loadError ? (
        <Alert>{loadError}</Alert>
      ) : !form ? (
        <div className="card card--pad stack" role="status" aria-label="Loading">
          <Skeleton w="40%" h={14} />
          <Skeleton h={36} r={8} />
          <Skeleton h={100} r={8} />
          <Skeleton w="60%" h={36} r={8} />
        </div>
      ) : (
        <div className="composer">
          <form className="card card--pad form" onSubmit={handleSubmit} noValidate>
            <Alert>{serverError}</Alert>
            <Field label="Name" htmlFor="name" error={errors.name} aside={<span className="field__hint mono">{form.name.length}/{NAME_MAX}</span>}>
              <input {...fieldProps("name", errors.name)} value={form.name} onChange={set} maxLength={NAME_MAX} placeholder="e.g. Saturday park clean-up" />
            </Field>
            <Field
              label="Description"
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
                placeholder="What will volunteers do? What should they bring?"
              />
            </Field>
            <div className="form-grid">
              <Field label="Category" htmlFor="category" error={errors.category}>
                <select {...fieldProps("category", errors.category)} value={form.category} onChange={set}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location" htmlFor="location" error={errors.location}>
                <input {...fieldProps("location", errors.location)} value={form.location} onChange={set} placeholder="e.g. Riverside Park, north gate" />
              </Field>
              <Field label="Date & time" htmlFor="deadline" error={errors.deadline}>
                <input {...fieldProps("deadline", errors.deadline)} type="datetime-local" min={nowLocalInput()} value={form.deadline} onChange={set} />
              </Field>
              <Field label="Volunteers needed" htmlFor="volunteerLimit" error={errors.volunteerLimit}>
                <div className="stepper-input">
                  <button type="button" className="btn btn--icon" onClick={() => update("volunteerLimit", String(Math.max(minLimit, limit - 1)))} aria-label="Fewer volunteers" disabled={limit <= minLimit}>
                    <Minus size={14} />
                  </button>
                  <input
                    {...fieldProps("volunteerLimit", errors.volunteerLimit)}
                    type="number"
                    inputMode="numeric"
                    min={minLimit}
                    max={LIMIT_MAX}
                    value={form.volunteerLimit}
                    onChange={set}
                  />
                  <button type="button" className="btn btn--icon" onClick={() => update("volunteerLimit", String(Math.min(LIMIT_MAX, limit + 1)))} aria-label="More volunteers" disabled={limit >= LIMIT_MAX}>
                    <Plus size={14} />
                  </button>
                </div>
              </Field>
            </div>
            <div className="form-actions">
              <Link to="/opportunities" className="btn btn--ghost">
                Cancel
              </Link>
              <button type="submit" className={`btn btn--primary ${saving ? "is-loading" : ""}`} disabled={saving}>
                {editing ? "Save changes" : "Publish"}
              </button>
            </div>
          </form>

          <aside className="composer__preview" aria-label="Preview">
            <p className="eyebrow">
              <Eye size={13} aria-hidden="true" /> Preview
            </p>
            <OpportunityCard
              opportunity={{
                id: "preview",
                name: form.name.trim() || "Opportunity name",
                description: form.description.trim() || "What volunteers will do appears here.",
                category: form.category,
                location: form.location.trim(),
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                volunteerLimit: limit || 1,
                volunteers,
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
};

export default OpportunityEditor;
