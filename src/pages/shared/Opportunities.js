import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut as LeaveIcon, Pencil, PlusCircle, Search, Trash2, UserPlus, Users } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { ROLES } from "../../lib/auth";
import { byDate, fullName, isPast, matches } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useConfirm, useSession, useToast } from "../../context/AppContext";
import { Alert, Avatar, EmptyState, Kbd, PageHeader, SkeletonCards, Tabs } from "../../components/ui";
import OpportunityCard, { isFull, joinedBy } from "../../components/opportunities/OpportunityCard";

/** Volunteers need what they can join plus what they've joined (which may now be full or finished). */
const loadFor = (role) => async () => {
  if (role === ROLES.ADMIN) return getList("/opportunities/all");
  const available = await getList("/opportunities/available");
  if (role !== ROLES.VOLUNTEER) return available;
  const mine = await getList("/opportunities/mine").catch(() => []);
  const byId = new Map(available.map((o) => [o.id, o]));
  mine.forEach((o) => byId.set(o.id, o));
  return [...byId.values()];
};

const TABS = {
  [ROLES.ADMIN]: [
    { id: "upcoming", label: "Upcoming", test: (o) => !isPast(o.deadline) && !isFull(o) },
    { id: "full", label: "Full", test: (o) => !isPast(o.deadline) && isFull(o) },
    { id: "past", label: "Past", test: (o) => isPast(o.deadline) },
  ],
  [ROLES.VOLUNTEER]: [
    { id: "open", label: "Open to join", test: (o, me) => !joinedBy(o, me) && !isPast(o.deadline) && !isFull(o) },
    { id: "joined", label: "Joined", test: (o, me) => joinedBy(o, me) },
  ],
};

const Opportunities = () => {
  useDocumentTitle("Opportunities");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const isAdmin = session.role === ROLES.ADMIN;
  const isVolunteer = session.role === ROLES.VOLUNTEER;
  const { data, error, loading, setData } = useResource(loadFor(session.role), [session.role]);
  const tabs = TABS[session.role];
  const [tab, setTab] = useState(tabs ? tabs[0].id : "all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [roster, setRoster] = useState({});
  const [busy, setBusy] = useState(null);
  const highlight = useHighlight(!!data);
  const me = session.userId;

  const categories = useMemo(() => [...new Set((data || []).map((o) => o.category).filter(Boolean))].sort(), [data]);

  const visible = useMemo(() => {
    const t = tabs?.find((x) => x.id === tab);
    return (data || [])
      .filter((o) => !t || t.test(o, me))
      .filter((o) => !category || o.category === category)
      .filter((o) => matches(query, o.name, o.description, o.location, o.category))
      .sort((a, b) => (tab === "past" ? -byDate("deadline")(a, b) : byDate("deadline")(a, b)));
  }, [data, tabs, tab, me, category, query]);

  const replace = (id, fn) => setData((list) => list.map((o) => (o.id === id ? fn(o) : o)));

  const join = async (o) => {
    setBusy(o.id);
    const self = { id: `me-${me}`, user: { id: me, firstName: session.firstName, lastName: session.lastName, email: session.email } };
    replace(o.id, (x) => ({ ...x, volunteers: [...(x.volunteers || []), self] }));
    try {
      await api.post(`/volunteers/opportunities/${o.id}/accept`);
      toast(`You're signed up for “${o.name}”.`, { action: { label: "See joined", onClick: () => setTab("joined") } });
    } catch (err) {
      replace(o.id, (x) => ({ ...x, volunteers: (x.volunteers || []).filter((v) => v !== self) }));
      toast(errorMessage(err, "Couldn't join this opportunity."), { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const leave = (o) => {
    const mine = (o.volunteers || []).filter((v) => String(v.user?.id) === String(me));
    replace(o.id, (x) => ({ ...x, volunteers: (x.volunteers || []).filter((v) => String(v.user?.id) !== String(me)) }));
    toast.undoable({
      message: `You've left “${o.name}”.`,
      commit: () => api.delete(`/volunteers/opportunities/${o.id}/cancel`),
      undo: () => replace(o.id, (x) => ({ ...x, volunteers: [...(x.volunteers || []), ...mine] })),
      errorFallback: "Couldn't remove you from that opportunity, so your spot is kept.",
    });
  };

  const remove = async (o) => {
    const ok = await confirm({
      title: `Delete “${o.name}”?`,
      body: `${o.volunteers?.length ? `${o.volunteers.length} volunteer${o.volunteers.length > 1 ? "s" : ""} will lose their spot. ` : ""}This can't be undone.`,
      confirmLabel: "Delete opportunity",
    });
    if (!ok) return;
    setBusy(o.id);
    try {
      await api.delete(`/opportunities/${o.id}`);
      setData((list) => list.filter((x) => x.id !== o.id));
      toast("Opportunity deleted.");
    } catch (err) {
      toast(errorMessage(err, "Couldn't delete this opportunity."), { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const actionsFor = (o) => {
    const joined = joinedBy(o, me);
    const past = isPast(o.deadline);
    if (isAdmin) {
      return (
        <>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setRoster((r) => ({ ...r, [o.id]: !r[o.id] }))}
            aria-expanded={!!roster[o.id]}
            aria-controls={`roster-${o.id}`}
          >
            <Users size={13} /> {o.volunteers?.length || 0} joined
            <ChevronDown size={13} className={`chev ${roster[o.id] ? "is-open" : ""}`} />
          </button>
          <span className="row" style={{ flexWrap: "nowrap" }}>
            <Link to={`/admin/opportunities/${o.id}/edit`} className="btn btn--sm" aria-label={`Edit ${o.name}`}>
              <Pencil size={13} /> Edit
            </Link>
            <button type="button" className="btn btn--sm btn--danger btn--icon" onClick={() => remove(o)} disabled={busy === o.id} aria-label={`Delete ${o.name}`}>
              <Trash2 size={13} />
            </button>
          </span>
        </>
      );
    }
    if (!isVolunteer) return null;
    if (joined) {
      return past ? (
        <span className="muted small">Thanks for taking part</span>
      ) : (
        <>
          <span className="muted small">See you there</span>
          <button type="button" className="btn btn--sm btn--danger" onClick={() => leave(o)}>
            <LeaveIcon size={13} /> Leave
          </button>
        </>
      );
    }
    return (
      <>
        <span className="muted small">{isFull(o) ? "No spots left" : "Spots are first come, first served"}</span>
        <button
          type="button"
          className={`btn btn--primary btn--sm ${busy === o.id ? "is-loading" : ""}`}
          onClick={() => join(o)}
          disabled={busy === o.id || isFull(o) || past}
        >
          <UserPlus size={13} /> Join
        </button>
      </>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Manage" : "Get involved"}
        title="Community opportunities"
        subtitle={
          isAdmin
            ? "Projects volunteers can sign up for. Edit details, check who's coming, or retire old ones."
            : isVolunteer
            ? "Projects that need extra hands. Join the ones that fit your schedule."
            : "What's happening in your neighborhood. Volunteer accounts can sign up to lend a hand."
        }
        actions={
          isAdmin && (
            <Link to="/admin/opportunities/new" className="btn btn--primary">
              <PlusCircle size={16} /> New opportunity <Kbd keys={["N"]} />
            </Link>
          )
        }
      />
      <Alert>{error}</Alert>

      {loading && !data ? (
        <SkeletonCards count={6} label="Loading opportunities" />
      ) : data ? (
        <>
          <div className="toolbar">
            {tabs ? (
              <Tabs
                label="Show"
                active={tab}
                onChange={setTab}
                tabs={tabs.map((t) => ({ id: t.id, label: t.label, count: data.filter((o) => t.test(o, me)).length }))}
              />
            ) : (
              <span className="muted small">{data.length} upcoming</span>
            )}
            <div className="toolbar__group">
              <label className="search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search opportunities</span>
                <input className="input" data-page-search placeholder="Search by name or place" value={query} onChange={(e) => setQuery(e.target.value)} />
                <kbd>/</kbd>
              </label>
              {categories.length > 1 && (
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              art="calendar"
              title={data.length ? "Nothing here" : "No opportunities yet"}
              action={
                isAdmin ? (
                  <Link to="/admin/opportunities/new" className="btn btn--primary btn--sm">
                    Create one
                  </Link>
                ) : (
                  tab === "joined" && (
                    <button type="button" className="btn btn--sm" onClick={() => setTab("open")}>
                      Browse open projects
                    </button>
                  )
                )
              }
            >
              {tab === "joined"
                ? "Projects you sign up for will be listed here."
                : data.length
                ? "Try another tab, search term or category."
                : "New community projects will be listed here."}
            </EmptyState>
          ) : (
            <div className="card-grid">
              {visible.map((o) => (
                <OpportunityCard
                  key={o.id}
                  opportunity={o}
                  joined={!isAdmin && joinedBy(o, me)}
                  highlighted={String(o.id) === highlight}
                  actions={actionsFor(o)}
                >
                  {isAdmin && roster[o.id] && (
                    <div className="roster" id={`roster-${o.id}`}>
                      {o.volunteers?.length ? (
                        <ul>
                          {o.volunteers.map((v) => (
                            <li key={v.id} className="person small">
                              <Avatar person={v.user} size="sm" />
                              <span className="person__text">
                                <strong>{fullName(v.user)}</strong>
                                <span className="muted"> · {v.user?.email}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted small">Nobody has joined yet.</p>
                      )}
                    </div>
                  )}
                </OpportunityCard>
              ))}
            </div>
          )}
        </>
      ) : null}
    </>
  );
};

export default Opportunities;
