// Opportunities board. Everyone can browse; volunteers can join or withdraw; only admins manage.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, PlusCircle, Search, Sparkles, Trash2, Users } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { ROLES } from "../lib/auth";
import { fullName, isPast } from "../lib/format";
import { useSession, useToast } from "../context/AppContext";
import { Alert, EmptyState, PageHeader, Spinner, Tabs } from "./ui";
import OpportunityCard, { joinedBy } from "./OpportunityCard";

const VolunteerOpportunities = () => {
  const session = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const isAdmin = session.role === ROLES.ADMIN;
  const isVolunteer = session.role === ROLES.VOLUNTEER;

  const [opportunities, setOpportunities] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [view, setView] = useState("open");
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      // Admins need to see full and expired ones too; everyone else only what they can still join.
      const { data } = await api.get(isAdmin ? "/opportunities/all" : "/opportunities/available");
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load opportunities."));
      setOpportunities([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => Array.from(new Set((opportunities || []).map((o) => o.category).filter(Boolean))).sort(),
    [opportunities]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (opportunities || [])
      .filter((o) => !category || o.category === category)
      .filter((o) => !q || `${o.name} ${o.description} ${o.location}`.toLowerCase().includes(q))
      .filter((o) => !isAdmin || (view === "open" ? !isPast(o.deadline) : isPast(o.deadline)))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [opportunities, query, category, view, isAdmin]);

  const act = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      toast(success);
      await load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = (o) => {
    if (!window.confirm(`Delete "${o.name}"? Everyone who joined will lose their spot. This can't be undone.`)) return;
    act(o.id, () => api.delete(`/opportunities/${o.id}`), "Opportunity deleted.");
  };

  const toggleVolunteers = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const actionsFor = (o) => {
    const joined = joinedBy(o, session.userId);
    if (isAdmin) {
      return (
        <>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => toggleVolunteers(o.id)}>
            <Users size={14} /> {o.volunteers?.length || 0} joined
          </button>
          <div className="row">
            <button type="button" className="btn btn--sm" onClick={() => navigate(`/edit-opportunity/${o.id}`)}>
              <Pencil size={14} /> Edit
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(o)} disabled={busy === o.id}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      );
    }
    if (isVolunteer) {
      return joined ? (
        <>
          <span className="muted small">You're signed up</span>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            disabled={busy === o.id}
            onClick={() =>
              window.confirm(`Withdraw from "${o.name}"?`) &&
              act(o.id, () => api.delete(`/volunteers/opportunities/${o.id}/cancel`), "You've withdrawn.")
            }
          >
            Withdraw
          </button>
        </>
      ) : (
        <>
          <span />
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={busy === o.id}
            onClick={() => act(o.id, () => api.post(`/volunteers/opportunities/${o.id}/accept`), `You've joined "${o.name}".`)}
          >
            {busy === o.id ? "Joining…" : "Join"}
          </button>
        </>
      );
    }
    return null; // Residents browse read-only.
  };

  return (
    <div className="container page">
      <PageHeader
        eyebrow={isAdmin ? "Manage" : "Get involved"}
        title="Community opportunities"
        subtitle={
          isAdmin
            ? "Create and manage projects volunteers can sign up for."
            : isVolunteer
            ? "Projects that need extra hands. Join the ones that fit your schedule."
            : "See what's happening in your neighborhood. Want to join? Register a volunteer account."
        }
        actions={
          isAdmin && (
            <Link to="/create-opportunity" className="btn btn--primary">
              <PlusCircle size={18} /> New opportunity
            </Link>
          )
        }
      />
      <Alert>{error}</Alert>

      {opportunities === null ? (
        <Spinner label="Loading opportunities…" />
      ) : (
        <>
          <div className="toolbar">
            {isAdmin ? (
              <Tabs
                label="Show"
                active={view}
                onChange={setView}
                tabs={[
                  { id: "open", label: "Upcoming", count: opportunities.filter((o) => !isPast(o.deadline)).length },
                  { id: "past", label: "Past", count: opportunities.filter((o) => isPast(o.deadline)).length },
                ]}
              />
            ) : (
              <span />
            )}
            <div className="toolbar__filters">
              <label className="search">
                <Search size={16} />
                <span className="sr-only">Search opportunities</span>
                <input className="input" placeholder="Search by name or place" value={query} onChange={(e) => setQuery(e.target.value)} />
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
              icon={Sparkles}
              title={opportunities.length ? "No matches" : "No opportunities yet"}
              action={
                isAdmin &&
                !opportunities.length && (
                  <Link to="/create-opportunity" className="btn btn--primary btn--sm">
                    Create the first one
                  </Link>
                )
              }
            >
              {opportunities.length ? "Try a different search." : "New community projects will be listed here."}
            </EmptyState>
          ) : (
            <div className="grid">
              {visible.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} joined={!isAdmin && joinedBy(o, session.userId)} actions={actionsFor(o)}>
                  {isAdmin && expanded[o.id] && (
                    <div className="volunteer-list">
                      {o.volunteers?.length ? (
                        <ul>
                          {o.volunteers.map((v) => (
                            <li key={v.id}>
                              <strong>{fullName(v.user)}</strong>
                              <span>{v.user?.email}</span>
                              <span>{v.user?.phoneNo}</span>
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
      )}
    </div>
  );
};

export default VolunteerOpportunities;
