import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cake, Home as HomeIcon, Mail, Pencil, Phone, ShieldCheck } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES, ROLE_LABELS, clearSession, updateSession } from "../lib/auth";
import { fullName } from "../lib/format";
import { validate, MIN_AGE } from "../lib/validation";
import { useConfirm, useSession, useToast } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import { LogoMark } from "../components/art/Logo";
import { Alert, Avatar, Field, Loading, PageHead, describedBy } from "../components/ui";

const FIELDS = ["firstName", "lastName", "email", "phoneNo", "age", "houseNo"];

const ROLE_BLURB = {
  [ROLES.USER]: "Posts requests when a hand would help.",
  [ROLES.VOLUNTEER]: "Picks up requests and joins community projects.",
  [ROLES.ADMIN]: "Keeps the neighborhood friendly and safe.",
};

const Profile = () => {
  useTitle("Your profile");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    const ok = await confirm({
      kicker: "Delete account",
      title: "Delete your NeighborAid account?",
      body: "Your profile, your requests and your project sign-ups are removed for good. Requests you were helping with go back on the noticeboard. This can't be undone.",
      confirmLabel: "Delete my account",
      cancelLabel: "Keep my account",
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete("/user/me");
      clearSession();
      toast("Your account has been deleted. Thank you for being a neighbor.");
      navigate("/", { replace: true });
    } catch (err) {
      toast(errorMessage(err, "We couldn't delete your account."), "error");
      setDeleting(false);
    }
  };
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/user/${session.userId}`)
      .then(({ data }) => setProfile(data))
      .catch((err) => setLoadError(errorMessage(err, "We couldn't load your profile.")));
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
    const first = Object.keys(er)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
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
      setForm(null);
      toast("Profile updated.");
    } catch (err) {
      setSaveError(errorMessage(err, "We couldn't save your changes."));
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
  if (!profile) return <Loading label="Finding your details…" />;

  const input = (name, props = {}) => <input id={name} name={name} value={form[name]} onChange={set} {...describedBy(name, errors[name])} {...props} />;

  return (
    <div className="container page page--narrow">
      <PageHead kicker="Your account" title="Profile" lede="These details help volunteers and residents reach each other once you're working together." />

      <section className="member-card" aria-label="Member card">
        <div className="member-card__head">
          <span className="member-card__label">NeighborAid member</span>
          <LogoMark className="member-card__mark" />
        </div>
        <div className="member-card__who">
          <Avatar person={profile} size="lg" />
          <div>
            <h2 className="member-card__name">{fullName(profile)}</h2>
            <p className="row member-card__role">
              <span className="badge badge--brick">
                <ShieldCheck size={12} aria-hidden="true" /> {ROLE_LABELS[profile.role] ?? "Member"}
              </span>
              <span className="small text-2">{ROLE_BLURB[profile.role]}</span>
            </p>
          </div>
        </div>

        {!form ? (
          <>
            <dl className="details">
              <div>
                <dt>
                  <Mail size={15} aria-hidden="true" /> Email
                </dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>
                  <Phone size={15} aria-hidden="true" /> Phone
                </dt>
                <dd>{profile.phoneNo || "Not given"}</dd>
              </div>
              <div>
                <dt>
                  <HomeIcon size={15} aria-hidden="true" /> House / flat
                </dt>
                <dd>{profile.houseNo || "Not given"}</dd>
              </div>
              <div>
                <dt>
                  <Cake size={15} aria-hidden="true" /> Age
                </dt>
                <dd>{profile.age ?? "Not given"}</dd>
              </div>
            </dl>
            <div className="form-actions">
              <button type="button" className="btn btn--ink" onClick={startEdit}>
                <Pencil size={16} /> Edit details
              </button>
            </div>
          </>
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
              <Field label="Email address" htmlFor="email" error={errors.email} className="span-2">
                {input("email", { type: "email", autoComplete: "email" })}
              </Field>
              <Field label="Phone number" htmlFor="phoneNo" error={errors.phoneNo}>
                {input("phoneNo", { type: "tel", inputMode: "numeric", autoComplete: "tel" })}
              </Field>
              <Field label="House or flat number" htmlFor="houseNo" error={errors.houseNo}>
                {input("houseNo", { autoComplete: "address-line1" })}
              </Field>
              <Field label="Age" htmlFor="age" error={errors.age}>
                {input("age", { type: "number", min: MIN_AGE, max: 120, inputMode: "numeric" })}
              </Field>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </section>

      {session.role !== ROLES.ADMIN && (
        <section className="card card--pad danger-zone" aria-labelledby="danger-title">
          <h2 id="danger-title" className="danger-zone__title">Leaving NeighborAid?</h2>
          <p className="small text-2">
            You can delete your account and everything attached to it at any time. Admin accounts are removed by another admin.
          </p>
          <button type="button" className="btn btn--danger" onClick={deleteAccount} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </section>
      )}
    </div>
  );
};

export default Profile;
