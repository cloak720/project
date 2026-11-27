import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HandHeart,
  Inbox,
  PlusCircle,
  RefreshCw,
  Siren,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { getList } from "../../lib/api";
import { ROLES } from "../../lib/auth";
import { REQUEST_CATEGORIES, STATUS_LABELS, byDate, formatDate, fullName, isPast, normStatus, plural } from "../../lib/format";
import { useDocumentTitle, useResource } from "../../lib/hooks";
import { Alert, Avatar, Capacity, EmptyState, Kbd, PageHeader, SkeletonCards, SkeletonStats, Stat } from "../../components/ui";

const PIPELINE = [
  { id: "PENDING", tone: "warning" },
  { id: "ACCEPTED", tone: "info" },
  { id: "COMPLETED", tone: "success" },
];

const safe = (url) => getList(url).catch(() => null);

const ChartTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="chart-tip">
      <span className="muted">{label}</span>
      <strong className="tabular">{plural(payload[0].value, "request")}</strong>
    </div>
  ) : null;

const AdminOverview = () => {
  useDocumentTitle("Admin overview");
  const { data, loading, reload } = useResource(async () => {
    const [requests, users, opportunities, messages, feedback] = await Promise.all([
      safe("/requests/all"),
      safe("/user/all"),
      safe("/opportunities/all"),
      safe("/contact"),
      safe("/feedback"),
    ]);
    return { requests, users, opportunities, messages, feedback };
  });

  const failed = data && Object.values(data).every((v) => v === null);

  const view = useMemo(() => {
    if (!data || failed) return null;
    const requests = data.requests || [];
    const users = data.users || [];
    const feedback = data.feedback || [];
    const by = (s) => requests.filter((r) => normStatus(r.status) === s);
    const pending = by("PENDING");
    const completed = by("COMPLETED");
    const ratings = feedback.map((f) => f.rating).filter((n) => typeof n === "number");
    const unanswered = (data.messages || []).filter((m) => !m.reply?.trim());

    const categories = [...REQUEST_CATEGORIES, ...new Set(requests.map((r) => r.category).filter((c) => c && !REQUEST_CATEGORIES.includes(c)))]
      .map((c) => ({ name: c, count: requests.filter((r) => r.category === c).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    const helpers = new Map();
    completed.forEach((r) => {
      if (!r.volunteer) return;
      const h = helpers.get(r.volunteer.id) || { person: r.volunteer, done: 0 };
      h.done += 1;
      helpers.set(r.volunteer.id, h);
    });

    const attention = [
      ...pending
        .filter((r) => isPast(r.deadline))
        .map((r) => ({ key: `o${r.id}`, icon: AlertTriangle, tone: "danger", title: r.requestType, text: `Open past its deadline (${formatDate(r.deadline)})`, to: `/admin/requests?highlight=${r.id}` })),
      ...pending
        .filter((r) => !isPast(r.deadline) && r.urgency === "High")
        .map((r) => ({ key: `u${r.id}`, icon: Siren, tone: "warning", title: r.requestType, text: "Urgent and still unassigned", to: `/admin/requests?highlight=${r.id}` })),
      ...unanswered.map((m) => ({ key: `m${m.id}`, icon: Inbox, tone: "accent", title: m.subject || "Message", text: `From ${m.name || m.email}`, to: `/admin/inbox?highlight=${m.id}` })),
    ];

    return {
      counts: Object.fromEntries(PIPELINE.map((p) => [p.id, by(p.id).length])),
      total: requests.length,
      pendingUrgent: pending.filter((r) => r.urgency === "High").length,
      completionRate: requests.length ? Math.round((completed.length / requests.length) * 100) : null,
      residents: users.filter((u) => u.role === ROLES.RESIDENT).length,
      volunteers: users.filter((u) => u.role === ROLES.VOLUNTEER).length,
      members: users.length,
      unanswered: unanswered.length,
      avgRating: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
      reviews: ratings.length,
      categories,
      leaders: [...helpers.values()].sort((a, b) => b.done - a.done).slice(0, 5),
      attention,
      upcoming: (data.opportunities || []).filter((o) => !isPast(o.deadline)).sort(byDate("deadline")).slice(0, 4),
    };
  }, [data, failed]);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Community overview"
        subtitle="Requests, members and projects at a glance. Anything that needs a person is listed under Needs attention."
        actions={
          <>
            <button type="button" className="btn" onClick={reload} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
            </button>
            <Link to="/admin/opportunities/new" className="btn btn--primary">
              <PlusCircle size={15} /> New opportunity <Kbd keys={["N"]} />
            </Link>
          </>
        }
      />
      {failed && <Alert>Couldn't load dashboard data. Check that the server is running and you're still logged in.</Alert>}

      {loading && !data ? (
        <div className="stack stack--lg">
          <SkeletonStats count={6} />
          <SkeletonCards count={3} />
        </div>
      ) : view ? (
        <div className="stack stack--lg">
          <div className="stats stats--6">
            <Stat icon={Clock} label="Open requests" value={view.counts.PENDING} hint={`${view.pendingUrgent} urgent`} accent as={Link} to="/admin/requests" />
            <Stat icon={HandHeart} label="In progress" value={view.counts.ACCEPTED} hint="Accepted by a volunteer" />
            <Stat
              icon={CheckCircle2}
              label="Completion rate"
              value={view.completionRate === null ? "–" : `${view.completionRate}%`}
              hint={`${view.counts.COMPLETED} of ${view.total} done`}
            />
            <Stat icon={Users} label="Members" value={view.members} hint={`${view.residents} residents · ${view.volunteers} volunteers`} as={Link} to="/admin/members" />
            <Stat icon={Inbox} label="Unanswered" value={view.unanswered} hint="Messages waiting" as={Link} to="/admin/inbox" />
            <Stat icon={Star} label="Avg. rating" value={view.avgRating ?? "–"} hint={plural(view.reviews, "review")} as={Link} to="/admin/feedback" />
          </div>

          <div className="dash-grid">
            <section className="card" aria-labelledby="pipeline-heading">
              <div className="card__head">
                <h2 className="card__title" id="pipeline-heading">
                  Request pipeline
                </h2>
                <span className="muted small tabular">{plural(view.total, "request")}</span>
              </div>
              <div className="card__body">
                {view.total === 0 ? (
                  <p className="muted small">No requests yet.</p>
                ) : (
                  <>
                    <div className="pipeline" role="img" aria-label={PIPELINE.map((p) => `${STATUS_LABELS[p.id]}: ${view.counts[p.id]}`).join(", ")}>
                      {PIPELINE.filter((p) => view.counts[p.id] > 0).map((p) => (
                        <span key={p.id} className={`pipeline__seg pipeline__seg--${p.tone}`} style={{ flexGrow: view.counts[p.id] }} title={`${STATUS_LABELS[p.id]}: ${view.counts[p.id]}`} />
                      ))}
                    </div>
                    <ul className="legend">
                      {PIPELINE.map((p) => (
                        <li key={p.id}>
                          <span className={`legend__swatch legend__swatch--${p.tone}`} aria-hidden="true" />
                          <span>{STATUS_LABELS[p.id]}</span>
                          <strong className="tabular">{view.counts[p.id]}</strong>
                          <span className="muted tabular">{Math.round((view.counts[p.id] / view.total) * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>

            <section className="card dash-grid__wide" aria-labelledby="cat-heading">
              <div className="card__head">
                <h2 className="card__title" id="cat-heading">
                  Requests by category
                </h2>
                <Link to="/admin/requests" className="link-btn small">
                  View requests <ArrowRight size={13} />
                </Link>
              </div>
              <div className="card__body">
                {view.categories.length === 0 ? (
                  <p className="muted small">No requests yet.</p>
                ) : (
                  <>
                    <div className="chart" style={{ height: Math.max(140, view.categories.length * 38) }} aria-hidden="true">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={view.categories} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
                          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="2 4" />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={110} tick={{ fill: "var(--text-2)", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
                          <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <table className="sr-only">
                      <caption>Requests by category</caption>
                      <tbody>
                        {view.categories.map((c) => (
                          <tr key={c.name}>
                            <th scope="row">{c.name}</th>
                            <td>{c.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </section>

            <section className="card dash-grid__wide" aria-labelledby="attention-heading">
              <div className="card__head">
                <h2 className="card__title" id="attention-heading">
                  <AlertTriangle size={15} aria-hidden="true" /> Needs attention
                </h2>
                <span className="muted small tabular">{view.attention.length}</span>
              </div>
              {view.attention.length === 0 ? (
                <div className="card__body">
                  <EmptyState art="check" title="All clear" compact>
                    No overdue or urgent requests, and every message has a reply.
                  </EmptyState>
                </div>
              ) : (
                <ul className="mini-list">
                  {view.attention.slice(0, 6).map((a) => (
                    <li key={a.key}>
                      <Link to={a.to} className="mini-list__item">
                        <span className={`mini-list__icon mini-list__icon--${a.tone}`}>
                          <a.icon size={14} aria-hidden="true" />
                        </span>
                        <span className="mini-list__text">
                          <strong>{a.title}</strong>
                          <span className="muted">{a.text}</span>
                        </span>
                        <ArrowRight size={14} className="muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card" aria-labelledby="leaders-heading">
              <div className="card__head">
                <h2 className="card__title" id="leaders-heading">
                  <Trophy size={15} aria-hidden="true" /> Most helpful
                </h2>
              </div>
              {view.leaders.length === 0 ? (
                <p className="card__body muted small">Completed requests will rank volunteers here.</p>
              ) : (
                <ol className="mini-list">
                  {view.leaders.map((l, i) => (
                    <li key={l.person.id} className="mini-list__item">
                      <span className="mono muted" style={{ width: 16 }}>
                        {i + 1}
                      </span>
                      <Avatar person={l.person} size="sm" />
                      <span className="mini-list__text">
                        <strong>{fullName(l.person)}</strong>
                      </span>
                      <span className="badge tabular">{plural(l.done, "task")}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="card dash-grid__full" aria-labelledby="fill-heading">
              <div className="card__head">
                <h2 className="card__title" id="fill-heading">
                  Upcoming opportunities
                </h2>
                <Link to="/opportunities" className="link-btn small">
                  Manage <ArrowRight size={13} />
                </Link>
              </div>
              {view.upcoming.length === 0 ? (
                <p className="card__body muted small">Nothing scheduled. Create an opportunity to rally volunteers.</p>
              ) : (
                <div className="fill-grid">
                  {view.upcoming.map((o) => (
                    <Link key={o.id} to={`/opportunities?highlight=${o.id}`} className="fill-grid__item">
                      <strong>{o.name}</strong>
                      <span className="muted small">{formatDate(o.deadline)}</span>
                      <Capacity taken={o.volunteers?.length || 0} limit={o.volunteerLimit} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AdminOverview;
