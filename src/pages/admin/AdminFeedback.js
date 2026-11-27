import React, { useMemo, useState } from "react";
import { HandHeart, MessageSquareReply, Search, Trash2 } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { fullName, matches, plural } from "../../lib/format";
import { useDocumentTitle, useResource } from "../../lib/hooks";
import { useToast } from "../../context/AppContext";
import { Alert, Avatar, EmptyState, PageHeader, SkeletonCards, Stars, Tabs } from "../../components/ui";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "low", label: "3 stars or less", test: (f) => (f.rating || 0) <= 3 },
  { id: "unanswered", label: "No reply", test: (f) => !f.reply?.trim() },
];

const AdminFeedback = () => {
  useDocumentTitle("Feedback");
  const toast = useToast();
  const { data, error, loading, setData } = useResource(async () => {
    const [feedback, users] = await Promise.all([getList("/feedback"), getList("/user/all").catch(() => [])]);
    return { feedback, users };
  });
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [replyFor, setReplyFor] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const people = useMemo(() => new Map((data?.users || []).map((u) => [u.id, u])), [data]);
  const nameOf = (id, fallback) => fullName(people.get(id), fallback);

  const summary = useMemo(() => {
    const list = data?.feedback || [];
    const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: list.filter((f) => f.rating === n).length }));
    const avg = list.length ? list.reduce((s, f) => s + (f.rating || 0), 0) / list.length : 0;
    return { dist, avg, total: list.length, max: Math.max(1, ...dist.map((d) => d.count)) };
  }, [data]);

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return (data?.feedback || [])
      .filter(f.test)
      .filter((x) => matches(query, x.comment, fullName(people.get(x.volunteerId), ""), fullName(people.get(x.userId), "")))
      .sort((a, b) => b.id - a.id);
  }, [data, filter, query, people]);

  const setFeedback = (fn) => setData((d) => ({ ...d, feedback: fn(d.feedback) }));

  const remove = (f) => {
    setFeedback((list) => list.filter((x) => x.id !== f.id));
    toast.undoable({
      message: "Feedback deleted.",
      commit: () => api.delete(`/feedback/${f.id}`),
      undo: () => setFeedback((list) => (list.some((x) => x.id === f.id) ? list : [...list, f])),
      errorFallback: "Couldn't delete that feedback, so it has been restored.",
    });
  };

  const sendReply = async (f) => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await api.put(`/feedback/${f.id}/reply`, { reply: text });
      setFeedback((list) => list.map((x) => (x.id === f.id ? { ...x, reply: text } : x)));
      setReplyFor(null);
      toast("Reply saved. The resident will see it with their rating.");
    } catch (err) {
      toast(errorMessage(err, "Couldn't save the reply."), { tone: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Quality" title="Feedback" subtitle="Ratings residents left for volunteers. Reply to say thanks, or remove anything abusive." />
      <Alert>{error}</Alert>
      {loading && !data ? (
        <SkeletonCards count={3} />
      ) : data ? (
        <div className="split split--rev">
          <aside className="card card--pad rating-summary" aria-label="Rating summary">
            <div className="rating-summary__big tabular">{summary.total ? summary.avg.toFixed(1) : "–"}</div>
            <Stars value={Math.round(summary.avg)} size={16} />
            <p className="muted small">{plural(summary.total, "rating")}</p>
            <ul className="histogram">
              {summary.dist.map((d) => (
                <li key={d.n}>
                  <span className="mono small">{d.n}★</span>
                  <span className="histogram__track" aria-hidden="true">
                    <span style={{ width: `${(d.count / summary.max) * 100}%` }} />
                  </span>
                  <span className="mono small muted">{d.count}</span>
                </li>
              ))}
            </ul>
          </aside>

          <section>
            <div className="toolbar">
              <Tabs label="Filter" tabs={FILTERS.map((f) => ({ id: f.id, label: f.label, count: data.feedback.filter(f.test).length }))} active={filter} onChange={setFilter} />
              <label className="search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search feedback</span>
                <input className="input" data-page-search placeholder="Search feedback" value={query} onChange={(e) => setQuery(e.target.value)} />
                <kbd>/</kbd>
              </label>
            </div>
            {rows.length === 0 ? (
              <EmptyState art="star" title={data.feedback.length ? "Nothing matches" : "No feedback yet"} compact>
                {data.feedback.length ? "Try another filter." : "Residents can rate volunteers after a request is completed."}
              </EmptyState>
            ) : (
              <ul className="feedback-list">
                {rows.map((f) => {
                  const volunteer = people.get(f.volunteerId);
                  return (
                    <li key={f.id} className="card card--pad feedback-item">
                      <div className="row row--between">
                        <span className="person">
                          {volunteer ? <Avatar person={volunteer} size="sm" /> : <HandHeart size={16} aria-hidden="true" />}
                          <span className="person__text">
                            <strong>{nameOf(f.volunteerId, `Volunteer #${f.volunteerId}`)}</strong>
                            <span className="muted small"> · rated by {nameOf(f.userId, `member #${f.userId}`)}</span>
                          </span>
                        </span>
                        <Stars value={f.rating || 0} />
                      </div>
                      <blockquote className="review__quote">{f.comment || <span className="muted">No comment.</span>}</blockquote>
                      {f.reply?.trim() && replyFor !== f.id && (
                        <div className="review__reply">
                          <span className="small muted row">
                            <MessageSquareReply size={13} aria-hidden="true" /> Your reply
                          </span>
                          <p>{f.reply}</p>
                        </div>
                      )}
                      {replyFor === f.id ? (
                        <form
                          className="stack"
                          style={{ gap: 10 }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            sendReply(f);
                          }}
                        >
                          <label htmlFor={`fb-reply-${f.id}`} className="sr-only">
                            Reply
                          </label>
                          <textarea
                            id={`fb-reply-${f.id}`}
                            className="input"
                            rows={3}
                            maxLength={500}
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Write a short reply…"
                          />
                          <div className="form-actions">
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReplyFor(null)}>
                              Cancel
                            </button>
                            <button type="submit" className={`btn btn--primary btn--sm ${sending ? "is-loading" : ""}`} disabled={sending || !draft.trim()}>
                              Save reply
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="row">
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => {
                              setReplyFor(f.id);
                              setDraft(f.reply || "");
                            }}
                          >
                            <MessageSquareReply size={13} /> {f.reply?.trim() ? "Edit reply" : "Reply"}
                          </button>
                          <button type="button" className="btn btn--sm btn--danger" onClick={() => remove(f)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
};

export default AdminFeedback;
