import React, { useState } from "react";
import { Cake, Home as HomeIcon, Keyboard, Mail, Monitor, Moon, Pencil, Phone, ShieldCheck, Sun } from "lucide-react";
import api, { errorMessage } from "../../lib/api";
import { ROLE_LABELS, updateSession } from "../../lib/auth";
import { fullName } from "../../lib/format";
import { MIN_AGE, validate } from "../../lib/validation";
import { useDocumentTitle, useResource } from "../../lib/hooks";
import { useSession, useTheme, useToast } from "../../context/AppContext";
import { Alert, Avatar, Field, Kbd, PageHeader, Skeleton, fieldProps } from "../../components/ui";

const FIELDS = ["firstName", "lastName", "email", "phoneNo", "age", "houseNo"];

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const DETAILS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "phoneNo", label: "Phone", icon: Phone },
  { key: "houseNo", label: "House / flat", icon: HomeIcon },
  { key: "age", label: "Age", icon: Cake },
];

const Profile = () => {
  useDocumentTitle("Profile");
  const session = useSession();
  const toast = useToast();
  const { preference, setPreference } = useTheme();
  const { data: profile, error, setData } = useResource(() => api.get(`/user/${session.userId}`).then((r) => r.data), [session.userId]);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

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
      // Role is deliberately not sent: nobody can change their own role.
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNo: form.phoneNo.replace(/[\s-]/g, ""),
        age: Number(form.age),
        houseNo: form.houseNo.trim(),
      };
      const { data } = await api.put(`/user/${session.userId}`, payload);
      const updated = data && typeof data === "object" ? data : { ...profile, ...payload };
      setData(updated);
      updateSession({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email });
      setForm(null);
      toast("Profile updated.");
    } catch (err) {
      setSaveError(errorMessage(err, "Couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  };

  const input = (name, props = {}) => <input {...fieldProps(name, errors[name])} value={form[name]} onChange={set} {...props} />;

  return (
    <>
      <PageHeader title="Profile" subtitle="The details volunteers and organisers see when you work together." />
      <Alert>{error}</Alert>
      <div className="profile-grid">
        <section className="card" aria-labelledby="profile-name">
          <div className="profile-hero">
            <div className="profile-hero__band" aria-hidden="true" />
            <div className="profile-hero__row">
              {profile ? <Avatar person={profile} size="xl" /> : <Skeleton w={72} h={72} r={999} />}
              <div className="profile-hero__text">
                <h2 id="profile-name">{profile ? fullName(profile) : <Skeleton w={160} h={20} />}</h2>
                <span className="badge badge--accent">
                  <ShieldCheck size={12} aria-hidden="true" /> {ROLE_LABELS[session.role]}
                </span>
              </div>
              {profile && !form && (
                <button type="button" className="btn" onClick={startEdit}>
                  <Pencil size={14} /> Edit profile
                </button>
              )}
            </div>
          </div>

          <div className="card__body">
            {!form ? (
              <dl className="details">
                {DETAILS.map((d) => (
                  <div key={d.key}>
                    <dt>
                      <d.icon size={14} aria-hidden="true" /> {d.label}
                    </dt>
                    <dd>{profile ? profile[d.key] ?? "–" : <Skeleton w="60%" />}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <form className="form" onSubmit={handleSubmit} noValidate>
                <Alert>{saveError}</Alert>
                <div className="form-grid">
                  <Field label="First name" htmlFor="firstName" error={errors.firstName}>
                    {input("firstName", { autoComplete: "given-name", autoFocus: true })}
                  </Field>
                  <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
                    {input("lastName", { autoComplete: "family-name" })}
                  </Field>
                  <Field label="Email" htmlFor="email" error={errors.email} className="span-2" hint="Used to log in and for replies to your messages.">
                    {input("email", { type: "email", autoComplete: "email" })}
                  </Field>
                  <Field label="Phone" htmlFor="phoneNo" error={errors.phoneNo}>
                    {input("phoneNo", { type: "tel", inputMode: "numeric", autoComplete: "tel" })}
                  </Field>
                  <Field label="House / flat" htmlFor="houseNo" error={errors.houseNo}>
                    {input("houseNo")}
                  </Field>
                  <Field label="Age" htmlFor="age" error={errors.age}>
                    {input("age", { type: "number", min: MIN_AGE, max: 120 })}
                  </Field>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>
                    Cancel
                  </button>
                  <button type="submit" className={`btn btn--primary ${saving ? "is-loading" : ""}`} disabled={saving}>
                    Save changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <div className="stack">
          <section className="card card--pad" aria-labelledby="appearance-heading">
            <h2 className="card__title" id="appearance-heading">
              Appearance
            </h2>
            <p className="muted small" style={{ margin: "4px 0 14px" }}>
              Saved on this device.
            </p>
            <div className="theme-picker" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={preference === t.id}
                  className={`theme-swatch theme-swatch--${t.id} ${preference === t.id ? "is-active" : ""}`}
                  onClick={() => setPreference(t.id)}
                >
                  <span className="theme-swatch__preview" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                  <span className="theme-swatch__label">
                    <t.icon size={13} aria-hidden="true" /> {t.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="card card--pad" aria-labelledby="keys-heading">
            <h2 className="card__title" id="keys-heading">
              <Keyboard size={15} aria-hidden="true" /> Work faster
            </h2>
            <p className="muted small" style={{ marginTop: 6 }}>
              Press <Kbd keys={["mod", "K"]} /> anywhere to jump to a page, search records or switch theme. Press <Kbd keys={["?"]} /> to
              see every shortcut.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default Profile;
