import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, MessageCircle, PlusCircle, RefreshCw, Search, Star, Users } from "lucide-react";
import api, { errorMessage, getList } from "../lib/api";
import { ROLES, ROLE_LABELS } from "../lib/auth";
import { CATEGORIES, formatDate, fullName, isPast, normStatus, plural } from "../lib/format";
import { useConfirm, useSession, useToast } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import { MailboxArt, NoticeboardArt, StarsArt, TeacupArt } from "../components/art/Scenes";
import { Alert, Avatar, EmptyState, Loading, Numbers, SectionHead, StarRow, StatusBadge, TabPanel, Tabs, UrgencyBadge, fadeUp, listItem } from "../components/ui";

const TABS = ["overview", "requests", "members", "messages", "reviews"];
const ROLE_TONE = { [ROLES.ADMIN]: "brick", [ROLES.USER]: "info", [ROLES.VOLUNTEER]: "success" };
const STATUSES = [
  { id: "PENDING", label: "Waiting", tone: "var(--ochre)" },
  { id: "ACCEPTED", label: "In progress", tone: "var(--sky)" },
  { id: "COMPLETED", label: "Done", tone: "var(--forest)" },
];

const matches = (q, ...fields) => !q || fields.join(" ").toLowerCase().includes(q);

/* ---------- Overview ---------- */

/** One stacked bar showing how requests split across statuses, with a legend that carries the numbers. */
const StatusBar = ({ requests }) => {
  const total = requests.length;
  const counts = STATUSES.map((s) => ({ ...s, n: requests.filter((r) => normStatus(r.status) === s.id).length }));
  return (
    <figure className="chart">
      <figcaption className="chart__title">Requests by status</figcaption>
      {total === 0 ? (
        <p className="small muted">No requests yet.</p>
      ) : (
        <>
          <div className="stackbar" role="img" aria-label={counts.map((c) => `${c.label}: ${c.n}`).join(", ")}>
            {counts
              .filter((c) => c.n > 0)
              .map((c) => (
                <span key={c.id} style={{ flexGrow: c.n, background: c.tone }} />
              ))}
          </div>
          <ul className="legend">
            {counts.map((c) => (
              <li key={c.id}>
                <span className="legend__swatch" style={{ background: c.tone }} aria-hidden="true" />
                {c.label}
                <strong className="tabular">{c.n}</strong>
                <span className="muted tabular">{Math.round((c.n / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </figure>
  );
};

/** Horizontal bars, sorted, labelled directly. */
const CategoryBars = ({ requests }) => {
  const rows = useMemo(() => {
    const names = Array.from(new Set([...CATEGORIES, ...requests.map((r) => r.category || "Other")]));
    return names
      .map((name) => ({ name, n: requests.filter((r) => (r.category || "Other") === name).length }))
      .filter((r) => r.n > 0)
      .sort((a, b) => b.n - a.n);
  }, [requests]);
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <figure className="chart">
      <figcaption className="chart__title">What people ask for</figcaption>
      {rows.length === 0 ? (
        <p className="small muted">No requests yet.</p>
      ) : (
        <ul className="bars">
          {rows.map((r) => (
            <li key={r.name} className="bars__row">
              <span className="bars__label">{r.name}</span>
              <span className="bars__track" aria-hidden="true">
                <motion.span className="bars__fill" initial={{ width: 0 }} animate={{ width: `${(r.n / max) * 100}%` }} transition={{ duration: 0.6 }} />
              </span>
              <span className="bars__value tabular">{r.n}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
};

const Overview = ({ data, goTo }) => {
  const unanswered = data.messages.filter((m) => !m.reply);
  const overdue = data.requests.filter((r) => normStatus(r.status) === "PENDING" && isPast(r.deadline));
  const waiting = data.requests.filter((r) => normStatus(r.status) === "PENDING");
  const suspended = data.users.filter((u) => u.banned);
  const upcoming = data.opportunities.filter((o) => !isPast(o.deadline)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const todo = [
    unanswered.length > 0 && { key: "msg", tone: "brick", text: `${plural(unanswered.length, "message")} waiting for a reply`, action: () => goTo("messages") },
    overdue.length > 0 && { key: "late", tone: "danger", text: `${plural(overdue.length, "request")} past the deadline with no helper`, action: () => goTo("requests", "PENDING") },
    waiting.length > 0 && { key: "wait", tone: "warning", text: `${plural(waiting.length, "request")} still on the noticeboard`, action: () => goTo("requests", "PENDING") },
    suspended.length > 0 && { key: "ban", tone: "outline", text: `${plural(suspended.length, "member")} currently suspended`, action: () => goTo("members", "banned") },
  ].filter(Boolean);

  return (
    <div className="overview">
      <section className="overview__todo" aria-labelledby="todo-title">
        <SectionHead id="todo-title" title="Needs your attention" />
        {todo.length === 0 ? (
          <EmptyState art={TeacupArt} title="All quiet on the street">
            No unanswered messages and no overdue requests.
          </EmptyState>
        ) : (
          <ul className="todo">
            {todo.map((t, i) => (
              <motion.li key={t.key} {...listItem(i)}>
                <button type="button" className="todo__item" onClick={t.action}>
                  <span className={`todo__pip todo__pip--${t.tone}`} aria-hidden="true" />
                  <span>{t.text}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
      <section className="overview__charts" aria-label="Activity">
        <StatusBar requests={data.requests} />
        <CategoryBars requests={data.requests} />
      </section>
      <section className="overview__events" aria-labelledby="next-title">
        <SectionHead
          id="next-title"
          title="Coming up"
          action={
            <Link to="/volunteer-opportunities" className="arrow-link">
              Manage <ArrowRight size={15} />
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <p className="small text-2">No upcoming opportunities.</p>
        ) : (
          <ul className="mini-list">
            {upcoming.slice(0, 4).map((o) => (
              <li key={o.id}>
                <span className="mini-list__date">{formatDate(o.deadline)}</span>
                <strong>{o.name}</strong>
                <span className="small muted">
                  {o.volunteers?.length || 0} of {o.volunteerLimit} volunteers
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/* ---------- Dashboard ---------- */

const AdminDashboard = () => {
  useTitle("Admin dashboard");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "overview";
  const filter = params.get("filter") || "";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(null);

  const goTo = (t, f = "") => {
    setQuery("");
    setParams(t === "overview" ? {} : f ? { tab: t, filter: f } : { tab: t }, { replace: true });
  };
  const setFilter = (f) => setParams(f ? { tab, filter: f } : { tab }, { replace: true });

  const load = useCallback(async () => {
    // Load each list independently so one failing endpoint doesn't blank the whole dashboard.
    const get = (url) => getList(url).catch(() => null);
    const [opportunities, requests, users, messages, feedback] = await Promise.all([
      get("/opportunities/all"),
      get("/requests/all"),
      get("/user/all"),
      get("/contact"),
      get("/feedback"),
    ]);
    const failed = [opportunities, requests, users, messages, feedback].filter((x) => x === null).length;
    setError(
      failed === 5
        ? "We couldn't load the dashboard. Check the server is running and that you're still logged in."
        : failed
        ? "Some sections couldn't be loaded and may be incomplete."
        : ""
    );
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

  const setBanned = async (u, banned) => {
    if (banned) {
      const ok = await confirm({
        kicker: "Suspend member",
        title: `Suspend ${fullName(u)}?`,
        body: "They won't be able to log in until you reinstate them. Their requests and sign-ups stay as they are.",
        confirmLabel: "Suspend",
        tone: "danger",
      });
      if (!ok) return;
    }
    run(
      `user-${u.id}`,
      () => api.put(`/user/${u.id}/${banned ? "ban" : "unban"}`),
      banned ? `${fullName(u)} has been suspended.` : `${fullName(u)} can log in again.`,
      (d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, banned } : x)) })
    );
  };

  const deleteUser = async (u) => {
    const ok = await confirm({
      kicker: "Delete account",
      title: `Permanently delete ${fullName(u)}?`,
      body:
        u.role === ROLES.VOLUNTEER
          ? "Their sign-ups are removed and any requests they were helping with go back on the noticeboard. This can't be undone."
          : "Their requests are removed with the account. This can't be undone.",
      confirmLabel: "Delete account",
      tone: "danger",
    });
    if (!ok) return;
    const done = await run(`user-${u.id}`, () => api.delete(`/user/${u.id}`), "Account deleted.", (d) => ({ ...d, users: d.users.filter((x) => x.id !== u.id) }));
    if (done) load(); // Requests and sign-ups changed server-side too.
  };

  const deleteRequest = async (r) => {
    const ok = await confirm({
      kicker: "Remove request",
      title: `Delete “${r.requestType}”?`,
      body: r.volunteer ? `${fullName(r.volunteer)} is helping with this one. It will disappear for them too.` : "It will be taken off the noticeboard.",
      confirmLabel: "Delete request",
      tone: "danger",
    });
    if (ok) run(`req-${r.id}`, () => api.delete(`/requests/${r.id}`), "Request deleted.", (d) => ({ ...d, requests: d.requests.filter((x) => x.id !== r.id) }));
  };

  const deleteFeedback = async (f) => {
    const ok = await confirm({ kicker: "Remove review", title: "Delete this review?", body: "It will no longer count towards the volunteer's rating.", confirmLabel: "Delete review", tone: "danger" });
    if (ok) run(`fb-${f.id}`, () => api.delete(`/feedback/${f.id}`), "Review deleted.", (d) => ({ ...d, feedback: d.feedback.filter((x) => x.id !== f.id) }));
  };

  const sendReply = async (m) => {
    const text = replyText.trim();
    if (!text) return toast("Write a reply first.", "error");
    const ok = await run(`msg-${m.id}`, () => api.put(`/contact/${m.id}/reply`, { reply: text }), `Reply sent to ${m.name || m.email}.`, (d) => ({
      ...d,
      messages: d.messages.map((x) => (x.id === m.id ? { ...x, reply: text } : x)),
    }));
    if (ok) {
      setReplyFor(null);
      setReplyText("");
    }
  };

  const userById = useMemo(() => new Map((data?.users || []).map((u) => [String(u.id), u])), [data]);

  if (!data) return <Loading label="Laying out the dashboard…" />;

  const q = query.trim().toLowerCase();
  const by = (s) => data.requests.filter((r) => normStatus(r.status) === s).length;
  const ratings = data.feedback.map((f) => f.rating).filter((n) => typeof n === "number");
  const unanswered = data.messages.filter((m) => !m.reply).length;

  const users = data.users
    .filter((u) => (filter === "" || String(u.role) === filter || (filter === "banned" && u.banned)) && matches(q, u.firstName, u.lastName, u.email, u.phoneNo))
    .sort((a, b) => a.role - b.role || fullName(a).localeCompare(fullName(b)));
  const requests = data.requests
    .filter((r) => (!filter || normStatus(r.status) === filter) && matches(q, r.requestType, r.description, r.category, fullName(r.user, ""), fullName(r.volunteer, "")))
    .sort((a, b) => b.id - a.id);
  const messages = data.messages
    .filter((m) => (!filter || (filter === "open" ? !m.reply : !!m.reply)) && matches(q, m.name, m.email, m.subject, m.message))
    .sort((a, b) => (!a.reply === !b.reply ? b.id - a.id : a.reply ? 1 : -1));
  const feedback = data.feedback.filter((f) => matches(q, fullName(userById.get(String(f.volunteerId)), ""), f.comment)).sort((a, b) => b.id - a.id);

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
      <motion.header className="front" {...fadeUp}>
        <div>
          <p className="kicker">Moderator's desk</p>
          <h1 className="front__title">
            The neighborhood, <em className="accent">at a glance</em>.
          </h1>
          <p className="lede">Signed in as {session.email}. Keep requests moving, answer messages and look after members.</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/create-opportunity" className="btn btn--primary">
            <PlusCircle size={16} /> New opportunity
          </Link>
        </div>
      </motion.header>
      <Alert tone={error.startsWith("Some") ? "warning" : "error"} onClose={() => setError("")}>
        {error}
      </Alert>

      <Numbers
        label="Community numbers"
        items={[
          { label: "Waiting", icon: Clock, value: by("PENDING"), hint: `${by("ACCEPTED")} in progress`, onClick: () => goTo("requests", "PENDING") },
          { label: "Completed", icon: CheckCircle2, value: by("COMPLETED"), hint: `of ${plural(data.requests.length, "request")}`, onClick: () => goTo("requests", "COMPLETED") },
          {
            label: "Members",
            icon: Users,
            value: data.users.length,
            hint: `${data.users.filter((u) => u.role === ROLES.USER).length} residents · ${data.users.filter((u) => u.role === ROLES.VOLUNTEER).length} volunteers`,
            onClick: () => goTo("members"),
          },
          { label: "Unanswered", icon: MessageCircle, value: unanswered, hint: "messages", onClick: () => goTo("messages", "open") },
          {
            label: "Avg. rating",
            icon: Star,
            value: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "–",
            hint: plural(ratings.length, "review"),
            onClick: () => goTo("reviews"),
          },
        ]}
      />

      <div className="toolbar toolbar--spaced">
        <Tabs
          idBase="admin"
          label="Dashboard sections"
          active={tab}
          onChange={(t) => goTo(t)}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "requests", label: "Requests", count: data.requests.length },
            { id: "members", label: "Members", count: data.users.length },
            { id: "messages", label: "Messages", count: unanswered || undefined, alert: unanswered > 0 },
            { id: "reviews", label: "Reviews", count: data.feedback.length },
          ]}
        />
        {tab !== "overview" && (
          <div className="toolbar__filters" role="search">
            <label className="search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search {tab}</span>
              <input className="input" placeholder={`Search ${tab}…`} value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {tab === "requests" && filterSelect([["", "All statuses"], ...STATUSES.map((s) => [s.id, s.label])])}
            {tab === "members" &&
              filterSelect([
                ["", "Everyone"],
                [String(ROLES.USER), "Residents"],
                [String(ROLES.VOLUNTEER), "Volunteers"],
                [String(ROLES.ADMIN), "Admins"],
                ["banned", "Suspended"],
              ])}
            {tab === "messages" &&
              filterSelect([
                ["", "All messages"],
                ["open", "Needs a reply"],
                ["done", "Replied"],
              ])}
          </div>
        )}
      </div>

      <TabPanel idBase="admin" active={tab}>
        {tab === "overview" && <Overview data={data} goTo={goTo} />}

        {tab === "requests" &&
          (requests.length === 0 ? (
            <EmptyState art={NoticeboardArt} title="No requests found">
              {q || filter ? "Nothing matches that search or filter." : "Requests from residents will be listed here."}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table table--stack">
                <caption className="sr-only">Requests</caption>
                <thead>
                  <tr>
                    <th scope="col">Request</th>
                    <th scope="col">Status</th>
                    <th scope="col">Posted by</th>
                    <th scope="col">Helper</th>
                    <th scope="col">Needed by</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const late = normStatus(r.status) !== "COMPLETED" && isPast(r.deadline);
                    return (
                      <tr key={r.id}>
                        <td data-label="Request">
                          <div className="cell-main">{r.requestType}</div>
                          <div className="cell-sub">
                            #{r.id} · {r.category || "General"} · House {r.houseNo}
                          </div>
                        </td>
                        <td data-label="Status">
                          <div className="badges">
                            <StatusBadge status={r.status} short />
                            {normStatus(r.status) === "PENDING" && <UrgencyBadge urgency={r.urgency} />}
                          </div>
                        </td>
                        <td data-label="Posted by">
                          <div>{fullName(r.user, "Deleted member")}</div>
                          <div className="cell-sub">{r.phoneNumber}</div>
                        </td>
                        <td data-label="Helper">{r.volunteer ? fullName(r.volunteer) : <span className="muted">Nobody yet</span>}</td>
                        <td data-label="Needed by">
                          <span className={late ? "text-danger" : ""}>
                            {formatDate(r.deadline)}
                            {late && <span className="sr-only"> (overdue)</span>}
                          </span>
                        </td>
                        <td className="cell-actions">
                          <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteRequest(r)} disabled={busy === `req-${r.id}`}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "members" &&
          (users.length === 0 ? (
            <EmptyState art={NoticeboardArt} title="No members found">
              Nothing matches that search or filter.
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table table--stack">
                <caption className="sr-only">Members</caption>
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Contact</th>
                    <th scope="col">House</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = String(u.id) === String(session.userId);
                    return (
                      <tr key={u.id}>
                        <td data-label="Member">
                          <div className="person">
                            <Avatar person={u} size="sm" />
                            <div>
                              <div className="cell-main">
                                {fullName(u)} {isSelf && <span className="muted">(you)</span>}
                              </div>
                              <div className="cell-sub">Age {u.age ?? "not given"}</div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Role">
                          <span className={`badge badge--${ROLE_TONE[u.role] || "outline"}`}>{ROLE_LABELS[u.role] ?? u.role}</span>
                        </td>
                        <td data-label="Contact">
                          <div>{u.email}</div>
                          <div className="cell-sub">{u.phoneNo}</div>
                        </td>
                        <td data-label="House">{u.houseNo || "–"}</td>
                        <td data-label="Status">
                          {u.banned ? <span className="badge badge--danger">Suspended</span> : <span className="badge badge--success">Active</span>}
                        </td>
                        <td className="cell-actions">
                          {u.role !== ROLES.ADMIN && !isSelf ? (
                            <>
                              <button type="button" className="btn btn--sm" onClick={() => setBanned(u, !u.banned)} disabled={busy === `user-${u.id}`}>
                                {u.banned ? "Reinstate" : "Suspend"}
                              </button>
                              <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteUser(u)} disabled={busy === `user-${u.id}`}>
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="tiny muted">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "messages" &&
          (messages.length === 0 ? (
            <EmptyState art={MailboxArt} title="No messages">
              {q || filter ? "Nothing matches that search or filter." : "Messages from members will arrive here."}
            </EmptyState>
          ) : (
            <ul className="threads threads--wide">
              {messages.map((m, i) => (
                <motion.li key={m.id} className={`thread ${!m.reply ? "thread--open" : ""}`} {...listItem(i)}>
                  <div className="thread__head">
                    <div>
                      <strong className="thread__subject">{m.subject}</strong>
                      <div className="cell-sub">
                        {m.name || "Member"} · <a href={`mailto:${m.email}`}>{m.email}</a>
                      </div>
                    </div>
                    {m.reply ? <span className="badge badge--success">Replied</span> : <span className="badge badge--warning">Needs a reply</span>}
                  </div>
                  <p className="thread__msg">{m.message}</p>
                  {m.reply && replyFor !== m.id && (
                    <div className="thread__reply">
                      <span className="thread__from">Your reply</span>
                      <p>{m.reply}</p>
                    </div>
                  )}
                  {replyFor === m.id ? (
                    <div className="stack">
                      <label className="sr-only" htmlFor={`reply-${m.id}`}>
                        Reply to {m.name || m.email}
                      </label>
                      <textarea
                        id={`reply-${m.id}`}
                        className="input"
                        rows={4}
                        autoFocus
                        maxLength={1000}
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
                        className={`btn btn--sm ${m.reply ? "" : "btn--ink"}`}
                        onClick={() => {
                          setReplyFor(m.id);
                          setReplyText(m.reply || "");
                        }}
                      >
                        {m.reply ? "Edit reply" : "Reply"}
                      </button>
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          ))}

        {tab === "reviews" &&
          (feedback.length === 0 ? (
            <EmptyState art={StarsArt} title="No reviews yet">
              {q ? "Nothing matches that search." : "Residents can rate volunteers once a request is completed."}
            </EmptyState>
          ) : (
            <ul className="threads threads--wide">
              {feedback.map((f, i) => (
                <motion.li key={f.id} className="thread" {...listItem(i)}>
                  <div className="thread__head">
                    <div>
                      <strong className="thread__subject">
                        For {fullName(userById.get(String(f.volunteerId)), `volunteer #${f.volunteerId}`)}
                      </strong>
                      <div className="cell-sub">From {fullName(userById.get(String(f.userId)), `member #${f.userId}`)}</div>
                    </div>
                    <StarRow value={f.rating} />
                  </div>
                  {f.comment && <p className="thread__msg">“{f.comment}”</p>}
                  <div>
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteFeedback(f)} disabled={busy === `fb-${f.id}`}>
                      Delete review
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          ))}
      </TabPanel>
    </div>
  );
};

export default AdminDashboard;
