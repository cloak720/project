import React, { useEffect, useState } from "react";
import { Cake, Home as HomeIcon, Mail, Pencil, Phone, ShieldCheck } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLE_LABELS, updateSession } from "../lib/auth";
import { fullName, initials } from "../lib/format";
import { validate, MIN_AGE } from "../lib/validation";
import { useSession, useToast } from "../context/AppContext";
import { Alert, Field, PageHeader, Spinner } from "./ui";

const FIELDS = ["firstName", "lastName", "email", "phoneNo", "age", "houseNo"];

const UserProfileAndEdit = () => {
  const session = useSession();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/user/${session.userId}`)
      .then(({ data }) => setProfile(data))
      .catch((err) => setLoadError(errorMessage(err, "Couldn't load your profile.")));
  }, [session.userId]);

  const startEdit = () => {
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phoneNo: profile.phoneNo || "",
      age: profile.age ?? "",
      houseNo: profile.houseNo || "",
    });
    setErrors({});
    setSaveError("");
    setEditing(true);
  };

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate(form, FIELDS);
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    setSaveError("");
    try {
      // Role is deliberately not sent: people can't change their own role.
      const { data } = await api.put(`/user/${session.userId}`, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNo: form.phoneNo.replace(/[\s-]/g, ""),
        age: Number(form.age),
        houseNo: form.houseNo.trim(),
      });
      const updated = data && typeof data === "object" ? data : { ...profile, ...form };
      setProfile(updated);
      updateSession({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email });
      setEditing(false);
      toast("Profile updated.");
    } catch (err) {
      setSaveError(errorMessage(err, "Couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="container page page--narrow">
        <Alert>{loadError}</Alert>
      </div>
    );
  }
  if (!profile) return <Spinner label="Loading your profile…" />;

  const input = (name, props = {}) => <input id={name} name={name} value={form[name]} onChange={set} {...props} />;

  return (
    <div className="container page page--narrow">
      <PageHeader title="Your profile" subtitle="This is what volunteers and organisers see when you work together." />

      <section className="card card--pad-lg profile">
        <div className="profile__head">
          <span className="avatar avatar--lg">{initials(profile)}</span>
          <div>
            <h2 className="profile__name">{fullName(profile)}</h2>
            <span className="badge badge--primary">
              <ShieldCheck size={12} /> {ROLE_LABELS[profile.role] ?? "Member"}
            </span>
          </div>
          {!editing && (
            <button type="button" className="btn" onClick={startEdit} style={{ marginLeft: "auto" }}>
              <Pencil size={16} /> Edit
            </button>
          )}
        </div>

        {!editing ? (
          <dl className="details">
            <div>
              <dt>
                <Mail size={16} /> Email
              </dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>
                <Phone size={16} /> Phone
              </dt>
              <dd>{profile.phoneNo || "-"}</dd>
            </div>
            <div>
              <dt>
                <HomeIcon size={16} /> House / flat
              </dt>
              <dd>{profile.houseNo || "-"}</dd>
            </div>
            <div>
              <dt>
                <Cake size={16} /> Age
              </dt>
              <dd>{profile.age ?? "-"}</dd>
            </div>
          </dl>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            <Alert>{saveError}</Alert>
            <div className="form-grid">
              <Field label="First name" htmlFor="firstName" error={errors.firstName}>
                {input("firstName", { autoComplete: "given-name" })}
              </Field>
              <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
                {input("lastName", { autoComplete: "family-name" })}
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email} className="span-2">
                {input("email", { type: "email", autoComplete: "email" })}
              </Field>
              <Field label="Phone number" htmlFor="phoneNo" error={errors.phoneNo}>
                {input("phoneNo", { type: "tel", inputMode: "numeric" })}
              </Field>
              <Field label="House / flat number" htmlFor="houseNo" error={errors.houseNo}>
                {input("houseNo")}
              </Field>
              <Field label="Age" htmlFor="age" error={errors.age}>
                {input("age", { type: "number", min: MIN_AGE, max: 120 })}
              </Field>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default UserProfileAndEdit;
