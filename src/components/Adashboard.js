import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  HandHeart,
  Inbox,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES, ROLE_LABELS } from "../lib/auth";
import { formatDate, fullName, isPast, normStatus } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge, Tabs, UrgencyBadge } from "./ui";

const ROLE_TONE = { [ROLES.ADMIN]: "danger", [ROLES.USER]: "info", [ROLES.VOLUNTEER]: "primary" };

const matches = (q, ...fields) => !q || fields.join(" ").toLowerCase().includes(q);

const Adashboard = () => {
  const session = useSession();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("requests");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setError("");
    // Load each list independently so one failing endpoint doesn't blank the whole dashboard.
    const get = (url) => api.get(url).then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => null);
    const [opportunities, requests, users, messages, feedback] = await Promise.all([
      get("/opportunities/all"),
      get("/requests/all"),
      get("/user/all"),
      get("/contact"),
      get("/feedback"),
    ]);
    if ([opportunities, requests, users, messages, feedback].every((x) => x === null)) {
      setError("Couldn't load dashboard data. Is the backend running, and are you still logged in?");
    }
    setData({
      opportunities: opportunities || [],
      requests: requests || [],
      users: users || [],
      messages: messages || [],
      feedback: feedback || [],
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (t) => {
    setTab(t);
    setQuery("");
    setFilter("");
  };

  const run = async (key, fn, success, update) => {
    setBusy(key);
    try {
      await fn();
      setData((d) => update(d));
      toast(success);
      return true;
    } catch (err) {
      toast(errorMessage(err), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const setBanned = (u, banned) =>
    run(
      `user-${u.id}`,
      () => api.put(`/user/${u.id}/${banned ? "ban" : "unban"}`),
      banned ? `${fullName(u)} has been suspended.` : `${fullName(u)} can log in again.`,
      (d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, banned } : x)) })
    );

  const deleteUser = (u) =>
    window.confirm(`Permanently delete ${fullName(u)}'s account? This can't be undone.`) &&
    run(`user-${u.id}`, () => api.delete(`/user/${u.id}`), "Account deleted.", (d) => ({ ...d, users: d.users.filter((x) => x.id !== u.id) }));

  const deleteRequest = (r) =>
    window.confirm(`Delete the request "${r.requestType}"?`) &&
    run(`req-${r.id}`, () => api.delete(`/requests/${r.id}`), "Request deleted.", (d) => ({ ...d, requests: d.requests.filter((x) => x.id !== r.id) }));

  const deleteOpportunity = (o) =>
    window.confirm(`Delete "${o.name}"? Volunteers who joined will lose their spot.`) &&
    run(`opp-${o.id}`, () => api.delete(`/opportunities/${o.id}`), "Opportunity deleted.", (d) => ({
      ...d,
      opportunities: d.opportunities.filter((x) => x.id !== o.id),
    }));

  const deleteFeedback = (f) =>
    window.confirm("Delete this feedback?") &&
    run(`fb-${f.id}`, () => api.delete(`/feedback/${f.id}`), "Feedback deleted.", (d) => ({ ...d, feedback: d.feedback.filter((x) => x.id !== f.id) }));

  const sendReply = (m) => {
    const text = replyText.trim();
    if (!text) return toast("Write a reply first.", "error");
    run(`msg-${m.id}`, () => api.put(`/contact/${m.id}/reply`, { reply: text }), `Reply sent to ${m.name || m.email}.`, (d) => ({
      ...d,
      messages: d.messages.map((x) => (x.id === m.id ? { ...x, reply: text } : x)),
    })).then((ok) => {
      if (!ok) return;
      setReplyFor(null);
      setReplyText("");
    });
  };

  const stats = useMemo(() => {
    if (!data) return null;
    const by = (s) => data.requests.filter((r) => normStatus(r.status) === s).length;
    const ratings = data.feedback.map((f) => f.rating).filter((n) => typeof n === "number");
    return {
      pending: by("PENDING"),
      accepted: by("ACCEPTED"),
      completed: by("COMPLETED"),
      residents: data.users.filter((u) => u.role === ROLES.USER).length,
      volunteers: data.users.filter((u) => u.role === ROLES.VOLUNTEER).length,
      upcoming: data.opportunities.filter((o) => !isPast(o.deadline)).length,
      unanswered: data.messages.filter((m) => !m.reply).length,
      avgRating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "-",
    };
  }, [data]);

  const userById = useMemo(() => new Map((data?.users || []).map((u) => [u.id, u])), [data]);

  if (!data) return <Spinner label="Loading dashboard…" />;

  const q = query.trim().toLowerCase();

  const users = data.users.filter(
    (u) => (filter === "" || String(u.role) === filter || (filter === "banned" && u.banned)) && matches(q, u.firstName, u.lastName, u.email, u.phoneNo)
  );
  const requests = data.requests
    .filter((r) => (!filter || normStatus(r.status) === filter) && matches(q, r.requestType, r.description, fullName(r.user, ""), fullName(r.volunteer, "")))
    .sort((a, b) => b.id - a.id);
  const opportunities = data.opportunities.filter((o) => matches(q, o.name, o.location, o.category));
  const messages = data.messages
    .filter((m) => (!filter || (filter === "open" ? !m.reply : !!m.reply)) && matches(q, m.name, m.email, m.subject, m.message))
    .sort((a, b) => (!a.reply === !b.reply ? b.id - a.id : a.reply ? 1 : -1));
  const feedback = data.feedback.filter((f) => matches(q, fullName(userById.get(f.volunteerId), ""), f.comment));

  const filterSelect = (options) => (
    <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Admin"
        title="Community overview"
        subtitle={`Signed in as ${session.email}.`}
        actions={
          <>
            <button type="button" className="btn" onClick={load}>
              <RefreshCw size={16} /> Refresh
            </button>
            <Link to="/create-opportunity" className="btn btn--primary">
              <PlusCircle size={16} /> New opportunity
            </Link>
          </>
        }
      />
      <Alert onClose={() => setError("")}>{error}</Alert>

      <div className="stats" style={{ marginBottom: 28 }}>
        <div className="stat">
          <span className="stat__label">
            <Clock size={16} /> Waiting for help
          </span>
          <span className="stat__value">{stats.pending}</span>
          <span className="stat__hint">{stats.accepted} in progress</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <CheckCircle2 size={16} /> Completed
          </span>
          <span className="stat__value">{stats.completed}</span>
          <span className="stat__hint">of {data.requests.length} requests</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <Users size={16} /> Members
          </span>
          <span className="stat__value">{data.users.length}</span>
          <span className="stat__hint">
            {stats.residents} residents · {stats.volunteers} volunteers
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <Sparkles size={16} /> Upcoming projects
          </span>
          <span className="stat__value">{stats.upcoming}</span>
          <span className="stat__hint">{data.opportunities.length} total</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <MessageCircle size={16} /> Unanswered
          </span>
          <span className="stat__value">{stats.unanswered}</span>
          <span className="stat__hint">contact messages</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <Star size={16} /> Avg. rating
          </span>
          <span className="stat__value">{stats.avgRating}</span>
          <span className="stat__hint">{data.feedback.length} reviews</span>
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          label="Admin sections"
          active={tab}
          onChange={changeTab}
          tabs={[
            { id: "requests", label: "Requests", count: data.requests.length },
            { id: "users", label: "Members", count: data.users.length },
            { id: "opportunities", label: "Opportunities", count: data.opportunities.length },
            { id: "messages", label: "Messages", count: stats.unanswered || undefined },
            { id: "feedback", label: "Feedback", count: data.feedback.length },
          ]}
        />
        <div className="toolbar__filters">
          <label className="search">
            <Search size={16} />
            <span className="sr-only">Search</span>
            <input className="input" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {tab === "requests" &&
            filterSelect([
              ["", "All statuses"],
              ["PENDING", "Pending"],
              ["ACCEPTED", "Accepted"],
              ["COMPLETED", "Completed"],
            ])}
          {tab === "users" &&
            filterSelect([
              ["", "All members"],
              [String(ROLES.USER), "Residents"],
              [String(ROLES.VOLUNTEER), "Volunteers"],
              [String(ROLES.ADMIN), "Admins"],
              ["banned", "Suspended"],
            ])}
          {tab === "messages" &&
            filterSelect([
              ["", "All messages"],
              ["open", "Needs reply"],
              ["done", "Replied"],
            ])}
        </div>
      </div>

      {tab === "requests" &&
        (requests.length === 0 ? (
          <EmptyState icon={Inbox} title="No requests found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Status</th>
                  <th>Posted by</th>
                  <th>Volunteer</th>
                  <th>Deadline</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="cell-main">{r.requestType}</div>
                      <div className="cell-sub">
                        #{r.id} · {r.category} · House {r.houseNo}
                      </div>
                    </td>
                    <td>
                      <div className="badges">
                        <StatusBadge status={r.status} />
                        {normStatus(r.status) === "PENDING" && <UrgencyBadge urgency={r.urgency} />}
                      </div>
                    </td>
                    <td>
                      <div>{fullName(r.user, "-")}</div>
                      <div className="cell-sub">{r.phoneNumber}</div>
                    </td>
                    <td>{r.volunteer ? fullName(r.volunteer) : <span className="muted">-</span>}</td>
                    <td>
                      <span className={normStatus(r.status) !== "COMPLETED" && isPast(r.deadline) ? "text-danger" : ""}>{formatDate(r.deadline)}</span>
                    </td>
                    <td className="cell-actions">
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteRequest(r)} disabled={busy === `req-${r.id}`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "users" &&
        (users.length === 0 ? (
          <EmptyState icon={Users} title="No members found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>House</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = String(u.id) === String(session.userId);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="cell-main">{fullName(u)}</div>
                        <div className="cell-sub">
                          #{u.id} · Age {u.age ?? "-"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge--${ROLE_TONE[u.role] || "neutral"}`}>{ROLE_LABELS[u.role] ?? u.role}</span>
                      </td>
                      <td>
                        <div>{u.email}</div>
                        <div className="cell-sub">{u.phoneNo}</div>
                      </td>
                      <td>{u.houseNo}</td>
                      <td>{u.banned ? <span className="badge badge--danger">Suspended</span> : <span className="badge badge--success">Active</span>}</td>
                      <td className="cell-actions">
                        {u.role !== ROLES.ADMIN && !isSelf && (
                          <>
                            <button type="button" className="btn btn--sm" onClick={() => setBanned(u, !u.banned)} disabled={busy === `user-${u.id}`}>
                              {u.banned ? "Reinstate" : "Suspend"}
                            </button>
                            <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteUser(u)} disabled={busy === `user-${u.id}`}>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "opportunities" &&
        (opportunities.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No opportunities"
            action={
              <Link to="/create-opportunity" className="btn btn--primary btn--sm">
                Create one
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Date</th>
                  <th>Volunteers</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="cell-main">{o.name}</div>
                      <div className="cell-sub">
                        {o.category} · {o.location}
                      </div>
                    </td>
                    <td>
                      {formatDate(o.deadline)}
                      {isPast(o.deadline) && <div className="cell-sub">Past</div>}
                    </td>
                    <td>
                      <strong>
                        {o.volunteers?.length || 0}/{o.volunteerLimit}
                      </strong>
                      {o.volunteers?.length > 0 && <div className="cell-sub cell-clip">{o.volunteers.map((v) => fullName(v.user)).join(", ")}</div>}
                    </td>
                    <td className="cell-actions">
                      <Link to={`/edit-opportunity/${o.id}`} className="btn btn--sm">
                        Edit
                      </Link>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteOpportunity(o)} disabled={busy === `opp-${o.id}`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "messages" &&
        (messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No messages" />
        ) : (
          <ul className="thread-list">
            {messages.map((m) => (
              <li key={m.id} className="thread">
                <div className="row row--between">
                  <div>
                    <strong>{m.subject}</strong>
                    <div className="cell-sub">
                      {m.name} · {m.email}
                    </div>
                  </div>
                  {m.reply ? <span className="badge badge--success">Replied</span> : <span className="badge badge--warning">Needs reply</span>}
                </div>
                <p className="thread__msg">{m.message}</p>
                {m.reply && replyFor !== m.id && (
                  <div className="thread__reply">
                    <span className="thread__from">Your reply</span>
                    <p>{m.reply}</p>
                  </div>
                )}
                {replyFor === m.id ? (
                  <div className="stack" style={{ gap: 10 }}>
                    <textarea
                      className="input"
                      style={{ height: "auto", padding: 12 }}
                      rows={3}
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${m.name || m.email}…`}
                    />
                    <div className="form-actions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReplyFor(null)}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => sendReply(m)} disabled={busy === `msg-${m.id}`}>
                        {busy === `msg-${m.id}` ? "Sending…" : "Send reply"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => {
                        setReplyFor(m.id);
                        setReplyText(m.reply || "");
                      }}
                    >
                      {m.reply ? "Edit reply" : "Reply"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}

      {tab === "feedback" &&
        (feedback.length === 0 ? (
          <EmptyState icon={Star} title="No feedback yet">
            Residents can rate volunteers after a request is completed.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>From</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {feedback.map((f) => (
                  <tr key={f.id}>
                    <td className="cell-main">
                      <HandHeart size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                      {fullName(userById.get(f.volunteerId), `Volunteer #${f.volunteerId}`)}
                    </td>
                    <td>
                      <span className="stars--static" aria-label={`${f.rating} out of 5`}>
                        {"★".repeat(f.rating || 0)}
                        <span className="muted">{"★".repeat(5 - (f.rating || 0))}</span>
                      </span>
                    </td>
                    <td className="cell-clip">{f.comment}</td>
                    <td>{fullName(userById.get(f.userId), `#${f.userId}`)}</td>
                    <td className="cell-actions">
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteFeedback(f)} disabled={busy === `fb-${f.id}`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
};

export default Adashboard;
