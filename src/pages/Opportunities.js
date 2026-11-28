// "What's on": everyone can browse; volunteers join or withdraw; only admins manage.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Pencil, PlusCircle, Search, Trash2, Users } from "lucide-react";
import api, { errorMessage, getList } from "../lib/api";
import { ROLES } from "../lib/auth";
import { fullName, isPast } from "../lib/format";
import { useConfirm, useSession, useToast } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import { CalendarArt } from "../components/art/Scenes";
import EventRow, { joinedBy } from "../components/EventRow";
import { Alert, Avatar, EmptyState, PageHead, SkeletonGrid, TabPanel, Tabs, listItem } from "../components/ui";

const byDate = (a, b) => new Date(a.deadline) - new Date(b.deadline);

const Roster = ({ volunteers }) =>
  volunteers?.length ? (
    <ul className="roster">
      {volunteers.map((v) => (
        <li key={v.id} className="person">
          <Avatar person={v.user} size="sm" />
          <div>
            <div className="small">
              <strong>{fullName(v.user)}</strong>
            </div>
            <div className="tiny muted">
              {v.user?.email}
              {v.user?.phoneNo ? ` · ${v.user.phoneNo}` : ""}
            </div>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="small muted roster">Nobody has signed up yet.</p>
  );

const Opportunities = () => {
  useTitle("Opportunities");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const isAdmin = session.role === ROLES.ADMIN;
  const isVolunteer = session.role === ROLES.VOLUNTEER;

  const [opportunities, setOpportunities] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(null);

  const views = isAdmin ? ["upcoming", "past"] : isVolunteer ? ["open", "joined"] : ["open"];
  const view = views.includes(params.get("view")) ? params.get("view") : views[0];
  const setView = (v) => setParams(v === views[0] ? {} : { view: v }, { replace: true });

  const load = useCallback(async () => {
    try {
      let list;
      if (isAdmin) list = await getList("/opportunities/all");
      else if (isVolunteer) {
        // /available hides full events, so merge in the ones this volunteer already joined.
        const [available, mine] = await Promise.all([getList("/opportunities/available"), getList("/opportunities/mine").catch(() => [])]);
        const map = new Map(available.map((o) => [o.id, o]));
        mine.forEach((o) => map.set(o.id, o));
        list = Array.from(map.values());
      } else list = await getList("/opportunities/available");
      setOpportunities(list);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "We couldn't load opportunities."));
      setOpportunities((o) => o || []);
    }
  }, [isAdmin, isVolunteer]);

  useEffect(() => {
    load();
  }, [load]);

  const inView = useCallback(
    (o, v) => {
      if (isAdmin) return v === "upcoming" ? !isPast(o.deadline) : isPast(o.deadline);
      if (isVolunteer) return v === "joined" ? joinedBy(o, session.userId) : !joinedBy(o, session.userId) && !isPast(o.deadline);
      return !isPast(o.deadline);
    },
    [isAdmin, isVolunteer, session.userId]
  );

  const categories = useMemo(
    () => Array.from(new Set((opportunities || []).map((o) => o.category).filter(Boolean))).sort(),
    [opportunities]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (opportunities || [])
      .filter((o) => inView(o, view))
      .filter((o) => !category || o.category === category)
      .filter((o) => !q || `${o.name} ${o.description} ${o.location}`.toLowerCase().includes(q))
      .sort(byDate);
    if (view === "past") return list.reverse();
    // Signed-up list: what's coming first, then the ones already done.
    if (view === "joined") return [...list.filter((o) => !isPast(o.deadline)), ...list.filter((o) => isPast(o.deadline)).reverse()];
    return list;
  }, [opportunities, query, category, view, inView]);

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      toast(success);
      await load();
    } catch (err) {
      toast(errorMessage(err), "error");
      load();
    } finally {
      setBusy(null);
    }
  };

  const join = (o) => run(o.id, () => api.post(`/volunteers/opportunities/${o.id}/accept`), `You're signed up for “${o.name}”. See you there!`);

  const withdraw = async (o) => {
    const ok = await confirm({
      kicker: "Change of plans",
      title: `Withdraw from “${o.name}”?`,
      body: "Your spot will open up for another volunteer. You can sign up again while there's room.",
      confirmLabel: "Withdraw",
      cancelLabel: "Keep my spot",
      tone: "danger",
    });
    if (ok) run(o.id, () => api.delete(`/volunteers/opportunities/${o.id}/cancel`), "You've withdrawn. Thanks for letting us know.");
  };

  const remove = async (o) => {
    const joined = o.volunteers?.length || 0;
    const ok = await confirm({
      kicker: "Delete opportunity",
      title: `Delete “${o.name}”?`,
      body: joined
        ? `${joined} volunteer${joined > 1 ? "s have" : " has"} signed up and will lose their spot. This can't be undone.`
        : "This can't be undone.",
      confirmLabel: "Delete it",
      tone: "danger",
    });
    if (ok) run(o.id, () => api.delete(`/opportunities/${o.id}`), "Opportunity deleted.");
  };

  const actionsFor = (o) => {
    if (isAdmin) {
      return (
        <>
          <button type="button" className="btn btn--sm" onClick={() => navigate(`/edit-opportunity/${o.id}`)}>
            <Pencil size={14} /> Edit
          </button>
          <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(o)} disabled={busy === o.id}>
            <Trash2 size={14} /> Delete
          </button>
        </>
      );
    }
    if (!isVolunteer) return null; // Residents browse read-only.
    if (joinedBy(o, session.userId)) {
      return isPast(o.deadline) ? (
        <span className="small text-2">Thanks for taking part</span>
      ) : (
        <button type="button" className="btn btn--danger btn--sm" onClick={() => withdraw(o)} disabled={busy === o.id}>
          {busy === o.id ? "Withdrawing…" : "Withdraw"}
        </button>
      );
    }
    const full = (o.volunteers?.length || 0) >= (o.volunteerLimit || 1);
    return (
      <button type="button" className="btn btn--primary btn--sm" onClick={() => join(o)} disabled={busy === o.id || full}>
        {full ? "Full" : busy === o.id ? "Signing up…" : "Count me in"}
      </button>
    );
  };

  const count = (v) => (opportunities || []).filter((o) => inView(o, v)).length;
  const tabLabels = { upcoming: "Upcoming", past: "Past", open: "Open to join", joined: "You're signed up" };

  return (
    <div className="container page">
      <PageHead
        kicker={isAdmin ? "Manage listings" : "What's on"}
        title="Around the neighborhood"
        lede={
          isAdmin
            ? "Community projects volunteers can sign up for. Create, edit and keep an eye on who's coming."
            : isVolunteer
            ? "Projects that need extra hands. Sign up for the ones that fit your week."
            : "Clean-ups, food drives and clubs happening nearby. Volunteer accounts can sign up to help."
        }
        actions={
          isAdmin && (
            <Link to="/create-opportunity" className="btn btn--primary">
              <PlusCircle size={18} /> New opportunity
            </Link>
          )
        }
      />
      <Alert onClose={() => setError("")}>{error}</Alert>

      {opportunities === null ? (
        <SkeletonGrid count={2} height={180} label="Loading opportunities" />
      ) : (
        <>
          <div className="toolbar">
            {views.length > 1 ? (
              <Tabs
                idBase="events"
                label="Show"
                active={view}
                onChange={setView}
                tabs={views.map((v) => ({ id: v, label: tabLabels[v], count: count(v) }))}
              />
            ) : (
              <span />
            )}
            <div className="toolbar__filters" role="search">
              <label className="search">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Search opportunities</span>
                <input className="input" placeholder="Search by name or place" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              {categories.length > 1 && (
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <TabPanel idBase="events" active={view}>
            {visible.length === 0 ? (
              <EmptyState
                art={CalendarArt}
                title={
                  query || category
                    ? "No matches"
                    : view === "joined"
                    ? "You haven't signed up for anything yet"
                    : view === "past"
                    ? "Nothing in the archive yet"
                    : "Nothing on the calendar right now"
                }
                action={
                  query || category ? (
                    <button type="button" className="btn btn--sm" onClick={() => { setQuery(""); setCategory(""); }}>
                      Clear filters
                    </button>
                  ) : view === "joined" ? (
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => setView("open")}>
                      Browse open projects
                    </button>
                  ) : (
                    isAdmin &&
                    view === "upcoming" && (
                      <Link to="/create-opportunity" className="btn btn--primary btn--sm">
                        Create an opportunity
                      </Link>
                    )
                  )
                }
              >
                {query || category ? "Try a different search or category." : "New community projects will be listed here as soon as they're announced."}
              </EmptyState>
            ) : (
              <div className="events">
                {visible.map((o, i) => (
                  <motion.div key={o.id} {...listItem(i)}>
                    <EventRow opportunity={o} joined={!isAdmin && joinedBy(o, session.userId)} actions={actionsFor(o)}>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            className="link-btn roster-toggle"
                            aria-expanded={!!expanded[o.id]}
                            onClick={() => setExpanded((e) => ({ ...e, [o.id]: !e[o.id] }))}
                          >
                            <Users size={15} aria-hidden="true" /> {expanded[o.id] ? "Hide" : "Show"} who's coming ({o.volunteers?.length || 0})
                            <ChevronDown size={15} aria-hidden="true" className={expanded[o.id] ? "is-flipped" : ""} />
                          </button>
                          {expanded[o.id] && <Roster volunteers={o.volunteers} />}
                        </>
                      )}
                    </EventRow>
                  </motion.div>
                ))}
              </div>
            )}
          </TabPanel>
        </>
      )}
    </div>
  );
};

export default Opportunities;
