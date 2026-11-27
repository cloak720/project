import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, HandHeart, PlusCircle, Sparkles, Star } from "lucide-react";
import { getList } from "../../lib/api";
import { REQUEST_CATEGORIES, byDate, formatDate, fullName, greeting, isPast, normStatus, plural } from "../../lib/format";
import { useDocumentTitle, useResource } from "../../lib/hooks";
import { useSession } from "../../context/AppContext";
import { Alert, Avatar, EmptyState, Kbd, PageHeader, SectionHeader, SkeletonCards, SkeletonStats, Stat } from "../../components/ui";
import { categoryIcon } from "../../components/ui/categories";
import RequestCard from "../../components/requests/RequestCard";

const ResidentHome = () => {
  useDocumentTitle("Overview");
  const session = useSession();
  const { data, error, loading } = useResource(async () => {
    const [requests, opportunities, given] = await Promise.all([
      getList("/requests/user"),
      getList("/opportunities/available").catch(() => []),
      getList(`/feedback/user/${session.userId}`).catch(() => null),
    ]);
    return { requests, opportunities, given };
  }, [session.userId]);

  const view = useMemo(() => {
    if (!data) return null;
    const by = (s) => data.requests.filter((r) => normStatus(r.status) === s);
    const rated = new Set((data.given || []).map((f) => String(f.volunteerId)));
    const helpers = new Map();
    by("COMPLETED")
      .filter((r) => r.volunteer && !rated.has(String(r.volunteer.id)))
      .forEach((r) => helpers.set(r.volunteer.id, { volunteer: r.volunteer, task: r.requestType }));
    return {
      open: by("PENDING"),
      active: by("ACCEPTED"),
      done: by("COMPLETED"),
      current: data.requests.filter((r) => normStatus(r.status) !== "COMPLETED").sort(byDate("deadline")),
      toRate: data.given ? [...helpers.values()] : [],
      upcoming: data.opportunities.filter((o) => !isPast(o.deadline)).sort(byDate("deadline")).slice(0, 3),
    };
  }, [data]);

  return (
    <>
      <PageHeader
        eyebrow={`${greeting()}, ${session.firstName || "neighbor"}`}
        title="What can your neighbors help with?"
        subtitle="Post a request and volunteers nearby will see it straight away."
        actions={
          <Link to="/requests/new" className="btn btn--primary">
            <PlusCircle size={16} /> New request <Kbd keys={["N"]} />
          </Link>
        }
      />

      <section className="quick-ask" aria-label="Start a request by category">
        <div className="quick-ask__copy">
          <strong>Start with a category</strong>
          <span className="muted small">We'll fill it in for you.</span>
        </div>
        <div className="quick-ask__chips">
          {REQUEST_CATEGORIES.map((c) => {
            const Icon = categoryIcon(c);
            return (
              <Link key={c} to={`/requests/new?category=${encodeURIComponent(c)}`} className="chip">
                <Icon size={14} aria-hidden="true" /> {c}
              </Link>
            );
          })}
        </div>
      </section>

      <Alert>{error}</Alert>

      {loading && !view ? (
        <div className="stack stack--lg">
          <SkeletonStats />
          <SkeletonCards count={3} />
        </div>
      ) : view ? (
        <div className="stack stack--lg">
          <div className="stats">
            <Stat icon={Clock} label="Waiting for a volunteer" value={view.open.length} hint="Visible on the request board" />
            <Stat icon={HandHeart} label="In progress" value={view.active.length} hint="A volunteer is on it" accent={view.active.length > 0} />
            <Stat icon={CheckCircle2} label="Completed" value={view.done.length} hint="All time" />
            <Stat
              icon={Star}
              label="To rate"
              value={view.toRate.length}
              hint={view.toRate.length ? "Say thanks with a rating" : "You're all caught up"}
            />
          </div>

          <div className="split">
            <section>
              <SectionHeader
                title="Active requests"
                count={view.current.length}
                action={
                  <Link to="/requests" className="link-btn small">
                    All requests <ArrowRight size={14} />
                  </Link>
                }
              />
              {view.current.length === 0 ? (
                <EmptyState
                  art="plus"
                  title="Nothing open right now"
                  action={
                    <Link to="/requests/new" className="btn btn--primary btn--sm">
                      <PlusCircle size={14} /> Ask for help
                    </Link>
                  }
                >
                  When you need a hand, post a request and it will show up here with live progress.
                </EmptyState>
              ) : (
                <div className="card-grid card-grid--2">
                  {view.current.slice(0, 4).map((r) => (
                    <RequestCard key={r.id} request={r}>
                      {r.volunteer ? (
                        <span className="person small">
                          <Avatar person={r.volunteer} size="sm" />
                          <span>
                            <strong>{fullName(r.volunteer)}</strong> accepted
                          </span>
                        </span>
                      ) : (
                        <span className="muted small">Waiting for a volunteer</span>
                      )}
                      <Link to={`/requests?highlight=${r.id}`} className="btn btn--ghost btn--sm">
                        Details <ArrowRight size={13} />
                      </Link>
                    </RequestCard>
                  ))}
                </div>
              )}
            </section>

            <aside className="stack">
              <section className="card">
                <div className="card__head">
                  <h2 className="card__title">
                    <Star size={15} aria-hidden="true" /> Needs your rating
                  </h2>
                </div>
                {view.toRate.length === 0 ? (
                  <p className="card__body muted small">When a volunteer finishes one of your requests, you can thank them here.</p>
                ) : (
                  <ul className="mini-list">
                    {view.toRate.map(({ volunteer, task }) => (
                      <li key={volunteer.id}>
                        <Link to={`/feedback?volunteer=${volunteer.id}`} className="mini-list__item">
                          <Avatar person={volunteer} size="sm" />
                          <span className="mini-list__text">
                            <strong>{fullName(volunteer)}</strong>
                            <span className="muted">{task}</span>
                          </span>
                          <span className="badge badge--accent">Rate</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card">
                <div className="card__head">
                  <h2 className="card__title">
                    <Sparkles size={15} aria-hidden="true" /> Coming up nearby
                  </h2>
                  <Link to="/opportunities" className="link-btn small">
                    See all
                  </Link>
                </div>
                {view.upcoming.length === 0 ? (
                  <p className="card__body muted small">No community projects scheduled yet.</p>
                ) : (
                  <ul className="mini-list">
                    {view.upcoming.map((o) => {
                      const Icon = categoryIcon(o.category);
                      return (
                        <li key={o.id}>
                          <Link to={`/opportunities?highlight=${o.id}`} className="mini-list__item">
                            <span className="mini-list__icon">
                              <Icon size={14} aria-hidden="true" />
                            </span>
                            <span className="mini-list__text">
                              <strong>{o.name}</strong>
                              <span className="muted">
                                {formatDate(o.deadline)} · {plural(Math.max(0, o.volunteerLimit - (o.volunteers?.length || 0)), "spot")} left
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ResidentHome;
