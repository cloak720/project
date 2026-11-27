import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageSquareReply, Send } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { formatDate, fullName, normStatus } from "../../lib/format";
import { useDocumentTitle, useResource } from "../../lib/hooks";
import { useSession, useToast } from "../../context/AppContext";
import { useShell } from "../../components/shell/AppShell";
import { Alert, Avatar, EmptyState, Field, PageHeader, SkeletonRows, StarInput, Stars, fieldProps } from "../../components/ui";

const COMMENT_MAX = 500;

const RateVolunteers = () => {
  useDocumentTitle("Rate volunteers");
  const session = useSession();
  const toast = useToast();
  const shell = useShell();
  const [params, setParams] = useSearchParams();
  const { data, error, loading, setData } = useResource(async () => {
    const [requests, given] = await Promise.all([
      getList("/requests/user"),
      // Older servers may not expose this; without it we simply can't show past ratings.
      getList(`/feedback/user/${session.userId}`).catch(() => []),
    ]);
    return { requests, given };
  }, [session.userId]);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  // Only volunteers who completed one of your requests can be rated.
  const helpers = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    data.requests
      .filter((r) => normStatus(r.status) === "COMPLETED" && r.volunteer)
      .forEach((r) => {
        const entry = map.get(r.volunteer.id) || { volunteer: r.volunteer, tasks: [], review: null };
        entry.tasks.push(r);
        map.set(r.volunteer.id, entry);
      });
    data.given.forEach((f) => {
      const entry = map.get(f.volunteerId);
      if (entry) entry.review = f;
    });
    return [...map.values()].sort((a, b) => !!a.review - !!b.review);
  }, [data]);

  const selectedId = params.get("volunteer") || (helpers.find((h) => !h.review) || helpers[0])?.volunteer.id;
  const selected = helpers.find((h) => String(h.volunteer.id) === String(selectedId));

  const select = (id) => {
    setParams({ volunteer: String(id) }, { replace: true });
    setRating(0);
    setComment("");
    setFormError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setFormError("Choose a star rating.");
    if (!comment.trim()) return setFormError("Add a few words about how it went.");
    setFormError("");
    setSending(true);
    try {
      const { data: saved } = await api.post("/feedback", {
        volunteerId: Number(selected.volunteer.id),
        rating,
        comment: comment.trim(),
      });
      const review = saved && typeof saved === "object" ? saved : { volunteerId: selected.volunteer.id, rating, comment: comment.trim() };
      setData((d) => ({ ...d, given: [...d.given, review] }));
      toast(`Thanks! Your rating for ${selected.volunteer.firstName} was sent.`);
      shell.refresh();
      setRating(0);
      setComment("");
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't send your rating."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Rate volunteers"
        subtitle="Honest ratings help good volunteers get recognised and help organisers keep the community safe."
      />
      <Alert>{error}</Alert>

      {loading && !data ? (
        <SkeletonRows rows={3} />
      ) : data && helpers.length === 0 ? (
        <EmptyState
          art="star"
          title="Nobody to rate yet"
          action={
            <Link to="/requests" className="btn btn--sm">
              See my requests
            </Link>
          }
        >
          Once a volunteer completes one of your requests, you can rate them here.
        </EmptyState>
      ) : data ? (
        <div className="master-detail">
          <section className="card" aria-label="Volunteers who helped you">
            <ul className="pick-list">
              {helpers.map((h) => {
                const active = selected && h.volunteer.id === selected.volunteer.id;
                return (
                  <li key={h.volunteer.id}>
                    <button
                      type="button"
                      className={`pick-list__item ${active ? "is-active" : ""}`}
                      onClick={() => select(h.volunteer.id)}
                      aria-current={active ? "true" : undefined}
                    >
                      <Avatar person={h.volunteer} />
                      <span className="pick-list__text">
                        <strong>{fullName(h.volunteer)}</strong>
                        <span className="muted small">{h.tasks.map((t) => t.requestType).join(", ")}</span>
                      </span>
                      {h.review ? <Stars value={h.review.rating} size={12} /> : <span className="badge badge--accent">To rate</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selected && (
            <section className="card card--pad" aria-labelledby="rate-title">
              <div className="person" style={{ marginBottom: 18 }}>
                <Avatar person={selected.volunteer} size="lg" />
                <div className="person__text">
                  <h2 id="rate-title" style={{ fontSize: "var(--text-lg)" }}>
                    {fullName(selected.volunteer)}
                  </h2>
                  <p className="muted small">
                    Helped with {selected.tasks.map((t) => `${t.requestType} (${formatDate(t.deadline)})`).join(" · ")}
                  </p>
                </div>
              </div>

              {selected.review ? (
                <div className="review">
                  <div className="row row--between">
                    <span className="row small">
                      <CheckCircle2 size={15} className="text-success" aria-hidden="true" /> You rated {selected.volunteer.firstName}
                    </span>
                    <Stars value={selected.review.rating} />
                  </div>
                  <blockquote className="review__quote">{selected.review.comment}</blockquote>
                  {selected.review.reply && (
                    <div className="review__reply">
                      <span className="small muted row">
                        <MessageSquareReply size={13} aria-hidden="true" /> Reply from the NeighborAid team
                      </span>
                      <p>{selected.review.reply}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form className="form" onSubmit={submit} noValidate>
                  <Alert>{formError}</Alert>
                  <div className="field">
                    <span className="label" id="rating-label">
                      How did it go?
                    </span>
                    <StarInput value={rating} onChange={setRating} label="Rating" />
                  </div>
                  <Field
                    label="Comments"
                    htmlFor="comment"
                    aside={<span className="field__hint mono">{comment.length}/{COMMENT_MAX}</span>}
                  >
                    <textarea
                      {...fieldProps("comment")}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={COMMENT_MAX}
                      placeholder="What did they do well? Anything to improve?"
                    />
                  </Field>
                  <div className="form-actions">
                    <button type="submit" className={`btn btn--primary ${sending ? "is-loading" : ""}`} disabled={sending}>
                      <Send size={14} /> Send rating
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>
      ) : null}
    </>
  );
};

export default RateVolunteers;
