import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircle, Send, Star } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES } from "../lib/auth";
import { formatDate, fullName, normStatus } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import { Alert, EmptyState, Field, PageHeader, Tabs } from "./ui";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Outstanding"];

const StarInput = ({ value, onChange }) => (
  <div className="stars" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        className={value >= n ? "is-on" : ""}
        onClick={() => onChange(n)}
      >
        <Star size={28} fill={value >= n ? "currentColor" : "none"} />
      </button>
    ))}
    {value > 0 && <span className="stars__word">{RATING_WORDS[value]}</span>}
  </div>
);

/* ---------- Contact form + the person's own message history ---------- */

const ContactTab = ({ session }) => {
  const toast = useToast();
  const [form, setForm] = useState({ subject: "", message: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState(null);

  const loadHistory = () =>
    api
      .get("/contact/mine")
      .then((r) => setHistory(Array.isArray(r.data) ? r.data.slice().reverse() : []))
      .catch(() => setHistory([]));

  useEffect(() => {
    loadHistory();
  }, []);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Add a subject and a message.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await api.post("/contact", {
        name: fullName(session, ""),
        email: session.email,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setForm({ subject: "", message: "" });
      toast("Message sent. We'll reply here and in your notifications.");
      loadHistory();
    } catch (err) {
      setError(errorMessage(err, "Couldn't send your message."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-layout">
      <form className="card card--pad-lg form" onSubmit={submit} noValidate>
        <div>
          <h2>Send us a message</h2>
          <p className="text-2 small" style={{ marginTop: 4 }}>
            Questions, problems or ideas. We reply from {session.email ? <strong>{session.email}</strong> : "your account"}.
          </p>
        </div>
        <Alert>{error}</Alert>
        <Field label="Subject" htmlFor="subject">
          <input id="subject" name="subject" value={form.subject} onChange={set} maxLength={120} placeholder="What's it about?" />
        </Field>
        <Field label="Message" htmlFor="message">
          <textarea id="message" name="message" value={form.message} onChange={set} rows={6} maxLength={1000} placeholder="Tell us more…" />
        </Field>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={sending}>
            <Send size={16} /> {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>

      <section>
        <h2 style={{ marginBottom: 14 }}>Your conversations</h2>
        {history === null ? (
          <p className="muted">Loading…</p>
        ) : history.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No messages yet">
            Messages you send and our replies will appear here.
          </EmptyState>
        ) : (
          <ul className="thread-list">
            {history.map((m) => (
              <li key={m.id} className="thread">
                <div className="row row--between">
                  <strong>{m.subject}</strong>
                  {m.reply ? <span className="badge badge--success">Replied</span> : <span className="badge">Awaiting reply</span>}
                </div>
                <p className="thread__msg">{m.message}</p>
                {m.reply && (
                  <div className="thread__reply">
                    <span className="thread__from">NeighborAid team</span>
                    <p>{m.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/* ---------- Volunteer feedback (residents only) ---------- */

const FeedbackTab = ({ preselect }) => {
  const toast = useToast();
  const [requests, setRequests] = useState(null);
  const [volunteerId, setVolunteerId] = useState(preselect || "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get("/requests/user")
      .then((r) => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRequests([]));
  }, []);

  // You can only rate volunteers who actually completed one of your requests.
  const volunteers = useMemo(() => {
    const map = new Map();
    (requests || [])
      .filter((r) => normStatus(r.status) === "COMPLETED" && r.volunteer)
      .forEach((r) => {
        const v = map.get(r.volunteer.id) || { ...r.volunteer, tasks: [] };
        v.tasks.push(r);
        map.set(r.volunteer.id, v);
      });
    return Array.from(map.values());
  }, [requests]);

  const selected = volunteers.find((v) => String(v.id) === String(volunteerId));

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return setError("Choose the volunteer you want to rate.");
    if (!rating) return setError("Pick a star rating.");
    if (!comment.trim()) return setError("Add a few words about how it went.");
    setError("");
    setSending(true);
    try {
      await api.post("/feedback", { volunteerId: Number(selected.id), rating, comment: comment.trim() });
      toast(`Thanks! Your feedback for ${selected.firstName} was sent.`);
      setRating(0);
      setComment("");
      setVolunteerId("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't send your feedback."));
    } finally {
      setSending(false);
    }
  };

  if (requests === null) return <p className="muted">Loading…</p>;

  if (volunteers.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Nobody to rate yet"
        action={
          <Link to="/my-requests" className="btn btn--sm">
            See my requests
          </Link>
        }
      >
        Once a volunteer completes one of your requests, you can rate them here.
      </EmptyState>
    );
  }

  return (
    <form className="card card--pad-lg form page--narrow" style={{ padding: 32 }} onSubmit={submit} noValidate>
      <div>
        <h2>Rate a volunteer</h2>
        <p className="text-2 small" style={{ marginTop: 4 }}>
          Honest feedback helps good volunteers get recognised and helps us keep the community safe.
        </p>
      </div>
      <Alert>{error}</Alert>
      <Field label="Volunteer" htmlFor="volunteer">
        <select id="volunteer" value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)}>
          <option value="">Choose who helped you</option>
          {volunteers.map((v) => (
            <option key={v.id} value={v.id}>
              {fullName(v)} · {v.tasks.map((t) => t.requestType).join(", ")}
            </option>
          ))}
        </select>
      </Field>
      {selected && (
        <p className="small muted">
          Helped with: {selected.tasks.map((t) => `${t.requestType} (${formatDate(t.deadline)})`).join(" · ")}
        </p>
      )}
      <div className="field">
        <span className="label">Rating</span>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <Field label="Comments" htmlFor="comment">
        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={500} placeholder="What did they do well? Anything to improve?" />
      </Field>
      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={sending}>
          {sending ? "Sending…" : "Submit feedback"}
        </button>
      </div>
    </form>
  );
};

const Contact = () => {
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const canRate = session.role === ROLES.USER;
  const tab = canRate && params.get("tab") === "feedback" ? "feedback" : "contact";

  return (
    <div className="container page">
      <PageHeader
        title={canRate ? "Contact & feedback" : "Contact us"}
        subtitle="We read every message. Replies show up below and in your notifications."
      />
      {canRate && (
        <div className="toolbar">
          <Tabs
            label="Contact sections"
            active={tab}
            onChange={(id) => setParams(id === "feedback" ? { tab: "feedback" } : {})}
            tabs={[
              { id: "contact", label: "Contact us" },
              { id: "feedback", label: "Rate a volunteer" },
            ]}
          />
        </div>
      )}
      {tab === "feedback" ? <FeedbackTab preselect={params.get("volunteer")} /> : <ContactTab session={session} />}
    </div>
  );
};

export default Contact;
