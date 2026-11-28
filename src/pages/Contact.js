import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import api, { errorMessage, getList } from "../lib/api";
import { ROLES } from "../lib/auth";
import { formatDate, fullName } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import { helpersFrom, useMyRequests, useMyReviews } from "../hooks/useResident";
import useTitle from "../hooks/useTitle";
import { MailboxArt, StarsArt } from "../components/art/Scenes";
import { Alert, Avatar, EmptyState, Field, Loading, PageHead, SectionHead, StarInput, StarRow, TabPanel, Tabs, describedBy, listItem } from "../components/ui";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 1000;

/* ---------- Contact form + the person's own message history ---------- */

const ContactTab = ({ session }) => {
  const toast = useToast();
  const [form, setForm] = useState({ subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState(null);

  const loadHistory = useCallback(
    () =>
      getList("/contact/mine")
        .then((list) => setHistory(list.slice().reverse()))
        .catch(() => setHistory([])),
    []
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const set = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((er) => ({ ...er, [e.target.name]: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.subject.trim()) er.subject = "Add a subject so we know what it's about.";
    if (!form.message.trim()) er.message = "Write your message.";
    setErrors(er);
    if (Object.keys(er).length) {
      document.getElementById(Object.keys(er)[0])?.focus();
      return;
    }
    setServerError("");
    setSending(true);
    try {
      await api.post("/contact", {
        name: fullName(session, ""),
        email: session.email,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setForm({ subject: "", message: "" });
      toast("Message sent. We'll reply here and in your notices.");
      loadHistory();
    } catch (err) {
      setServerError(errorMessage(err, "We couldn't send your message."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="letters">
      <form className="card card--pad-lg form letters__form" onSubmit={submit} noValidate>
        <div>
          <h2>Write to the team</h2>
          <p className="small text-2 letters__from">
            Sending as <strong>{session.email || "your account"}</strong>. Questions, problems, ideas: all welcome.
          </p>
        </div>
        <Alert>{serverError}</Alert>
        <Field label="Subject" htmlFor="subject" error={errors.subject}>
          <input id="subject" name="subject" value={form.subject} onChange={set} maxLength={SUBJECT_MAX} placeholder="What's it about?" {...describedBy("subject", errors.subject)} />
        </Field>
        <Field label="Message" htmlFor="message" error={errors.message} hint={`${form.message.length}/${MESSAGE_MAX}`}>
          <textarea id="message" name="message" value={form.message} onChange={set} rows={7} maxLength={MESSAGE_MAX} placeholder="Tell us more…" {...describedBy("message", errors.message, true)} />
        </Field>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={sending}>
            <Send size={16} /> {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>

      <section aria-labelledby="history-title">
        <SectionHead id="history-title" title="Your conversations" count={history?.length || undefined} />
        {history === null ? (
          <Loading label="Opening the post…" />
        ) : history.length === 0 ? (
          <EmptyState art={MailboxArt} title="No letters yet">
            Messages you send, and our replies, will be kept here.
          </EmptyState>
        ) : (
          <ul className="threads">
            {history.map((m, i) => (
              <motion.li key={m.id} className="thread" {...listItem(i)}>
                <div className="thread__head">
                  <strong className="thread__subject">{m.subject}</strong>
                  {m.reply ? <span className="badge badge--success">Replied</span> : <span className="badge badge--warning">Awaiting reply</span>}
                </div>
                <p className="thread__msg">{m.message}</p>
                {m.reply && (
                  <div className="thread__reply">
                    <span className="thread__from">The NeighborAid team</span>
                    <p>{m.reply}</p>
                  </div>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/* ---------- Rate a volunteer (residents only) ---------- */

const FeedbackTab = ({ session, preselect }) => {
  const toast = useToast();
  const { requests } = useMyRequests();
  const { reviews, ratedIds, addReview, available } = useMyReviews(session.userId);
  const [volunteerId, setVolunteerId] = useState(preselect || "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // You can only rate volunteers who actually completed one of your requests, once each.
  const helpers = useMemo(() => helpersFrom(requests), [requests]);
  const toRate = helpers.filter((v) => !ratedIds.has(String(v.id)));
  const nameOf = (id) => fullName(helpers.find((h) => String(h.id) === String(id)), "A volunteer");
  const selected = toRate.find((v) => String(v.id) === String(volunteerId));

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return setError("Choose who you'd like to rate.");
    if (!rating) return setError("Pick a star rating.");
    setError("");
    setSending(true);
    try {
      const { data } = await api.post("/feedback", { volunteerId: Number(selected.id), rating, comment: comment.trim() });
      addReview(data && typeof data === "object" ? data : { id: Date.now(), volunteerId: selected.id, rating, comment: comment.trim() });
      toast(`Thank you! ${selected.firstName} will appreciate that.`);
      setRating(0);
      setComment("");
      setVolunteerId("");
    } catch (err) {
      setError(errorMessage(err, "We couldn't send your rating."));
    } finally {
      setSending(false);
    }
  };

  if (requests === null) return <Loading />;

  if (helpers.length === 0) {
    return (
      <EmptyState
        art={StarsArt}
        title="Nobody to rate yet"
        action={
          <Link to="/my-requests" className="btn btn--sm">
            See my requests
          </Link>
        }
      >
        Once a volunteer completes one of your requests, you can thank them with a rating here.
      </EmptyState>
    );
  }

  return (
    <div className="letters">
      {toRate.length === 0 ? (
        <EmptyState art={StarsArt} title="You've rated everyone who helped you">
          Thank you. Ratings like yours help good volunteers get recognized.
        </EmptyState>
      ) : (
        <form className="card card--pad-lg form letters__form" onSubmit={submit} noValidate>
          <div>
            <h2>Rate a helper</h2>
            <p className="small text-2 letters__from">Honest feedback helps good volunteers get recognized and keeps the community safe.</p>
          </div>
          <Alert>{error}</Alert>
          <fieldset className="field">
            <legend className="label">Who helped you?</legend>
            <div className="helper-picks">
              {toRate.map((v) => (
                <label key={v.id} className={`choice choice--row ${String(volunteerId) === String(v.id) ? "is-selected" : ""}`}>
                  <input type="radio" name="volunteer" value={v.id} checked={String(volunteerId) === String(v.id)} onChange={() => setVolunteerId(String(v.id))} />
                  <Avatar person={v} size="sm" />
                  <span>
                    <span className="choice__title">{fullName(v)}</span>
                    <span className="choice__text">
                      {v.tasks.map((t) => `${t.requestType} (${formatDate(t.deadline)})`).join(" · ")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <span className="label" id="rating-label">
              How did it go?
            </span>
            <StarInput id="rating-label" value={rating} onChange={setRating} />
          </div>
          <Field label="A few words" htmlFor="comment" optional hint={`${comment.length}/500`}>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="What did they do well? Anything to improve?"
              aria-describedby="comment-hint"
            />
          </Field>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={sending}>
              {sending ? "Sending…" : "Send rating"}
            </button>
          </div>
        </form>
      )}

      {(available || reviews.length > 0) && (
        <section aria-labelledby="my-reviews">
          <SectionHead id="my-reviews" title="Ratings you've given" count={reviews.length || undefined} />
          {reviews.length === 0 ? (
            <p className="small text-2">Ratings you send will be listed here.</p>
          ) : (
            <ul className="threads">
              {reviews.map((f) => (
                <li key={f.id} className="thread">
                  <div className="thread__head">
                    <strong className="thread__subject">{nameOf(f.volunteerId)}</strong>
                    <StarRow value={f.rating} />
                  </div>
                  {f.comment && <p className="thread__msg">“{f.comment}”</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

const Contact = () => {
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const canRate = session.role === ROLES.USER;
  const tab = canRate && params.get("tab") === "feedback" ? "feedback" : "contact";
  useTitle(tab === "feedback" ? "Rate a helper" : "Contact");

  return (
    <div className="container page">
      <PageHead
        kicker="Letters"
        title={canRate ? "Contact & thanks" : "Contact us"}
        lede="A real person reads every message. Replies arrive here and in your notices."
      />
      {canRate ? (
        <>
          <div className="toolbar">
            <Tabs
              idBase="contact"
              label="Contact sections"
              active={tab}
              onChange={(id) => setParams(id === "feedback" ? { tab: "feedback" } : {}, { replace: true })}
              tabs={[
                { id: "contact", label: "Write to us" },
                { id: "feedback", label: "Rate a helper" },
              ]}
            />
          </div>
          <TabPanel idBase="contact" active={tab}>
            {tab === "feedback" ? <FeedbackTab session={session} preselect={params.get("volunteer")} /> : <ContactTab session={session} />}
          </TabPanel>
        </>
      ) : (
        <ContactTab session={session} />
      )}
    </div>
  );
};

export default Contact;
