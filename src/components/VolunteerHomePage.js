import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HandHeart,
  Home as HomeIcon,
  Inbox,
  Phone,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { CATEGORIES, URGENCY_ORDER, formatDateTime, fullName, isPast, normStatus, relativeDays } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge, Tabs, UrgencyBadge } from "./ui";
import OpportunityCard, { joinedBy } from "./OpportunityCard";

const RequestCard = ({ request: r, children, mine }) => {
  const status = normStatus(r.status);
  const overdue = status !== "COMPLETED" && isPast(r.deadline);
  return (
    <article className={`item-card urgency-edge urgency-edge--${(r.urgency || "low").toLowerCase()}`}>
      <div className="item-card__head">
        <h3>{r.requestType}</h3>
        {mine ? <StatusBadge status={r.status} /> : <UrgencyBadge urgency={r.urgency} />}
      </div>
      <p className="item-card__desc">{r.description}</p>
      <div className="badges">
        <span className="badge">{r.category || "General"}</span>
        {mine && <UrgencyBadge urgency={r.urgency} />}
        {overdue && <span className="badge badge--danger">Past deadline</span>}
      </div>
      <div className="meta meta--list">
        {r.user && (
          <span>
            <User size={14} /> {fullName(r.user)}
          </span>
        )}
        <span>
          <HomeIcon size={14} /> House {r.houseNo}
        </span>
        {/* Contact details are only useful (and only shared) once you've taken the request on. */}
        {mine && (
          <span>
            <Phone size={14} /> <a href={`tel:${r.phoneNumber}`}>{r.phoneNumber}</a>
          </span>
        )}
        <span>
          <CalendarClock size={14} /> {formatDateTime(r.deadline)} · {relativeDays(r.deadline)}
        </span>
      </div>
      <div className="item-card__foot">{children}</div>
    </article>
  );
};

const VolunteerHomePage = () => {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState("open");
  const [pending, setPending] = useState(null);
  const [mine, setMine] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [joinedOpps, setJoinedOpps] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("urgency");

  const load = useCallback(async () => {
    setError("");
    try {
      const [p, a, o, m] = await Promise.all([
        api.get("/requests/pending"),
        api.get("/requests/accepted"),
        api.get("/opportunities/available"),
        // Older backends don't have /mine; fall back to what /available tells us.
        api.get("/opportunities/mine").catch(() => null),
      ]);
      setPending(Array.isArray(p.data) ? p.data : []);
      setMine(Array.isArray(a.data) ? a.data : []);
      const available = Array.isArray(o.data) ? o.data : [];
      setOpportunities(available);
      setJoinedOpps(m && Array.isArray(m.data) ? m.data : available.filter((x) => joinedBy(x, session.userId)));
    } catch (err) {
      setError(errorMessage(err, "Couldn't load your dashboard."));
      setPending((p) => p || []);
    }
  }, [session.userId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      toast(success);
      await load();
    } catch (err) {
      toast(errorMessage(err), "error");
      // Someone else may have taken it first; refresh so the list is accurate.
      if (err.response?.status >= 400) load();
    } finally {
      setBusy(null);
    }
  };

  const accept = (r) => run(`req-${r.id}`, () => api.put(`/requests/${r.id}/accept`), `You're helping with "${r.requestType}". Thank you!`);
  const complete = (r) => {
    if (!window.confirm(`Mark "${r.requestType}" as completed?`)) return;
    run(`req-${r.id}`, () => api.put(`/requests/${r.id}/complete`), "Marked as completed. Nice work!");
  };
  const join = (o) => run(`opp-${o.id}`, () => api.post(`/volunteers/opportunities/${o.id}/accept`), `You've joined "${o.name}".`);
  const withdraw = (o) => {
    if (!window.confirm(`Withdraw from "${o.name}"? Your spot will open up for someone else.`)) return;
    run(`opp-${o.id}`, () => api.delete(`/volunteers/opportunities/${o.id}/cancel`), "You've withdrawn.");
  };

  const openRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (pending || [])
      .filter((r) => !category || r.category === category)
      .filter((r) => !q || `${r.requestType} ${r.description}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "urgency"
          ? (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3) || new Date(a.deadline) - new Date(b.deadline)
          : new Date(a.deadline) - new Date(b.deadline)
      );
  }, [pending, query, category, sort]);

  const activeTasks = mine.filter((r) => normStatus(r.status) === "ACCEPTED");
  const doneTasks = mine.filter((r) => normStatus(r.status) === "COMPLETED");
  const joinedIds = new Set(joinedOpps.map((o) => o.id));
  const availableOpps = opportunities.filter((o) => !joinedIds.has(o.id));

  if (pending === null) return <Spinner label="Loading your dashboard…" />;

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Volunteer dashboard"
        title={`Thanks for showing up, ${session.firstName || "neighbor"}.`}
        subtitle="Pick up a request, keep track of what you've promised, and join community projects."
      />
      <Alert onClose={() => setError("")}>{error}</Alert>

      <div className="stats" style={{ marginBottom: 28 }}>
        <div className="stat">
          <span className="stat__label">
            <Inbox size={16} /> Open requests
          </span>
          <span className="stat__value">{pending.length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <ClipboardList size={16} /> Your active tasks
          </span>
          <span className="stat__value">{activeTasks.length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <CheckCircle2 size={16} /> Completed
          </span>
          <span className="stat__value">{doneTasks.length}</span>
        </div>
        <div className="stat">
          <span className="stat__label">
            <Sparkles size={16} /> Projects joined
          </span>
          <span className="stat__value">{joinedOpps.length}</span>
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          label="Dashboard sections"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "open", label: "Open requests", count: pending.length },
            { id: "mine", label: "My tasks", count: activeTasks.length },
            { id: "opps", label: "Opportunities", count: availableOpps.length },
          ]}
        />
        {tab === "open" && pending.length > 0 && (
          <div className="toolbar__filters">
            <label className="search">
              <Search size={16} />
              <span className="sr-only">Search requests</span>
              <input className="input" placeholder="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              <option value="urgency">Most urgent first</option>
              <option value="deadline">Soonest deadline</option>
            </select>
          </div>
        )}
      </div>

      {tab === "open" &&
        (pending.length === 0 ? (
          <EmptyState icon={HandHeart} title="No one needs help right now">
            New requests from your neighbors will appear here. Check back soon!
          </EmptyState>
        ) : openRequests.length === 0 ? (
          <EmptyState icon={Search} title="No matches">
            Try a different search or category.
          </EmptyState>
        ) : (
          <div className="grid">
            {openRequests.map((r) => (
              <RequestCard key={r.id} request={r}>
                <span className="muted small">Posted by a neighbor</span>
                <button type="button" className="btn btn--primary btn--sm" onClick={() => accept(r)} disabled={busy === `req-${r.id}`}>
                  {busy === `req-${r.id}` ? "Accepting…" : "I'll help"}
                </button>
              </RequestCard>
            ))}
          </div>
        ))}

      {tab === "mine" && (
        <div className="stack stack--lg">
          <section>
            <div className="section-title">
              <h2>
                In progress<span className="count">{activeTasks.length}</span>
              </h2>
            </div>
            {activeTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No active tasks"
                action={
                  <button type="button" className="btn btn--sm" onClick={() => setTab("open")}>
                    Browse open requests
                  </button>
                }
              >
                Requests you accept show up here with the resident's contact details.
              </EmptyState>
            ) : (
              <div className="grid">
                {activeTasks.map((r) => (
                  <RequestCard key={r.id} request={r} mine>
                    <span className="muted small">Call ahead to arrange a time</span>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => complete(r)} disabled={busy === `req-${r.id}`}>
                      <CheckCircle2 size={14} /> {busy === `req-${r.id}` ? "Saving…" : "Mark completed"}
                    </button>
                  </RequestCard>
                ))}
              </div>
            )}
          </section>
          {doneTasks.length > 0 && (
            <section>
              <div className="section-title">
                <h2>
                  Completed<span className="count">{doneTasks.length}</span>
                </h2>
              </div>
              <div className="grid">
                {doneTasks.map((r) => (
                  <RequestCard key={r.id} request={r} mine>
                    <span className="muted small">
                      <CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> Done. Thank you!
                    </span>
                  </RequestCard>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "opps" && (
        <div className="stack stack--lg">
          {joinedOpps.length > 0 && (
            <section>
              <div className="section-title">
                <h2>
                  You've joined<span className="count">{joinedOpps.length}</span>
                </h2>
              </div>
              <div className="grid">
                {[...joinedOpps].sort((a, b) => isPast(a.deadline) - isPast(b.deadline) || new Date(a.deadline) - new Date(b.deadline)).map((o) => (
                  <OpportunityCard
                    key={o.id}
                    opportunity={o}
                    joined
                    actions={
                      isPast(o.deadline) ? (
                        <span className="muted small">
                          <CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> Thanks for taking part
                        </span>
                      ) : (
                        <>
                          <span className="muted small">See you there!</span>
                          <button type="button" className="btn btn--danger btn--sm" onClick={() => withdraw(o)} disabled={busy === `opp-${o.id}`}>
                            Withdraw
                          </button>
                        </>
                      )
                    }
                  />
                ))}
              </div>
            </section>
          )}
          <section>
            <div className="section-title">
              <h2>
                Open to join<span className="count">{availableOpps.length}</span>
              </h2>
              <Link to="/volunteer-opportunities" className="small">
                All opportunities
              </Link>
            </div>
            {availableOpps.length === 0 ? (
              <EmptyState icon={Sparkles} title="No open projects">
                When organisers post new community projects, they'll show up here.
              </EmptyState>
            ) : (
              <div className="grid">
                {availableOpps.map((o) => (
                  <OpportunityCard
                    key={o.id}
                    opportunity={o}
                    actions={
                      <>
                        <span />
                        <button type="button" className="btn btn--primary btn--sm" onClick={() => join(o)} disabled={busy === `opp-${o.id}`}>
                          {busy === `opp-${o.id}` ? "Joining…" : "Join"}
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default VolunteerHomePage;
