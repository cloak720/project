import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, HandHeart, MapPin, Search } from "lucide-react";
import api, { errorMessage, getList } from "../lib/api";
import { CATEGORIES, URGENCY_ORDER, formatDate, formatDateTime, greeting, isPast, normStatus, plural } from "../lib/format";
import { useConfirm, useSession, useToast } from "../context/AppContext";
import useTitle from "../hooks/useTitle";
import { CalendarArt, NoticeboardArt, StarsArt, TeacupArt } from "../components/art/Scenes";
import RequestCard from "../components/RequestCard";
import { Alert, EmptyState, Note, NoteAction, SectionHead, SkeletonGrid, StarRow, TabPanel, Tabs, fadeUp, listItem } from "../components/ui";

const TABS = ["board", "tasks", "reviews"];

const BoardTab = ({ pending, busy, onAccept }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("urgency");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pending
      .filter((r) => !category || r.category === category)
      .filter((r) => !q || `${r.requestType} ${r.description}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "urgency"
          ? (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3) || new Date(a.deadline) - new Date(b.deadline)
          : new Date(a.deadline) - new Date(b.deadline)
      );
  }, [pending, query, category, sort]);

  if (pending.length === 0) {
    return (
      <EmptyState art={TeacupArt} title="Nobody needs a hand right now">
        Put the kettle on. New requests from your neighbors will appear here the moment they're posted.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="filters" role="search">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search open requests</span>
          <input className="input" placeholder="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort requests">
          <option value="urgency">Most urgent first</option>
          <option value="deadline">Soonest deadline first</option>
        </select>
      </div>
      {visible.length === 0 ? (
        <EmptyState art={NoticeboardArt} title="No matches" action={<button type="button" className="btn btn--sm" onClick={() => { setQuery(""); setCategory(""); }}>Clear filters</button>}>
          Nothing fits that search. Try another word or category.
        </EmptyState>
      ) : (
        <div className="grid">
          {visible.map((r, i) => (
            <motion.div key={r.id} {...listItem(i)}>
              <RequestCard
                request={r}
                view="board"
                footer={
                  <>
                    <span className="small text-2">Posted by {r.user?.firstName || "a neighbor"}</span>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => onAccept(r)} disabled={busy === r.id}>
                      <HandHeart size={15} /> {busy === r.id ? "Accepting…" : "I'll help"}
                    </button>
                  </>
                }
              />
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
};

const TasksTab = ({ active, done, busy, onComplete, onBrowse }) => (
  <div className="stack stack--lg">
    <section aria-labelledby="active-tasks">
      <SectionHead id="active-tasks" title="In progress" count={active.length} />
      {active.length === 0 ? (
        <EmptyState
          art={NoticeboardArt}
          title="No tasks on your list"
          action={
            <button type="button" className="btn btn--primary btn--sm" onClick={onBrowse}>
              Browse open requests
            </button>
          }
        >
          When you accept a request it moves here, with the resident's phone number so you can arrange a time.
        </EmptyState>
      ) : (
        <div className="grid">
          {active.map((r, i) => (
            <motion.div key={r.id} {...listItem(i)}>
              <RequestCard
                request={r}
                view="task"
                footer={
                  <>
                    <span className="small text-2">Call ahead to arrange a time</span>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => onComplete(r)} disabled={busy === r.id}>
                      <CheckCircle2 size={15} /> {busy === r.id ? "Saving…" : "Mark as done"}
                    </button>
                  </>
                }
              />
            </motion.div>
          ))}
        </div>
      )}
    </section>
    {done.length > 0 && (
      <section aria-labelledby="done-tasks">
        <SectionHead id="done-tasks" title="Done and dusted" count={done.length} />
        <div className="grid">
          {done.map((r) => (
            <RequestCard key={r.id} request={r} view="task" footer={<span className="small text-2">Thank you for helping {r.user?.firstName || "a neighbor"}.</span>} />
          ))}
        </div>
      </section>
    )}
  </div>
);

const ReviewsTab = ({ reviews, unavailable }) => {
  if (unavailable) {
    return (
      <EmptyState art={StarsArt} title="Reviews aren't available right now">
        We couldn't load your ratings. Try again in a little while.
      </EmptyState>
    );
  }
  if (reviews.length === 0) {
    return (
      <EmptyState art={StarsArt} title="No reviews yet">
        When a resident rates your help after a completed request, their kind words will be pinned here.
      </EmptyState>
    );
  }
  const avg = reviews.reduce((sum, f) => sum + (f.rating || 0), 0) / reviews.length;
  return (
    <div className="reviews">
      <div className="reviews__score">
        <span className="reviews__avg">{avg.toFixed(1)}</span>
        <StarRow value={avg} size={20} />
        <span className="small text-2">from {plural(reviews.length, "review")}</span>
      </div>
      <ul className="reviews__list">
        {reviews
          .slice()
          .reverse()
          .map((f, i) => (
            <motion.li key={f.id} className="review" {...listItem(i)}>
              <StarRow value={f.rating} />
              <blockquote className="pull-quote">{f.comment ? `“${f.comment}”` : "Left a rating without a comment."}</blockquote>
              <span className="tiny muted">A neighbor you helped</span>
            </motion.li>
          ))}
      </ul>
    </div>
  );
};

const VolunteerDashboard = () => {
  useTitle("Volunteer dashboard");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "board";
  const [pending, setPending] = useState(null);
  const [mine, setMine] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsUnavailable, setReviewsUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const setTab = (id) => setParams(id === "board" ? {} : { tab: id }, { replace: true });

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([getList("/requests/pending"), getList("/requests/accepted")]);
      setPending(p);
      setMine(a);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "We couldn't load the noticeboard."));
      setPending((p) => p || []);
    }
  }, []);

  useEffect(() => {
    load();
    getList("/opportunities/mine")
      .then(setProjects)
      .catch(() => setProjects([]));
    getList(`/feedback/volunteer/${session.userId}`)
      .then(setReviews)
      .catch(() => setReviewsUnavailable(true));
  }, [load, session.userId]);

  const accept = async (r) => {
    const ok = await confirm({
      kicker: "Commit to help",
      title: `Help ${r.user?.firstName || "this neighbor"} with “${r.requestType}”?`,
      body: (
        <p>
          It's needed by <strong>{formatDateTime(r.deadline)}</strong>. Once you accept, it comes off the noticeboard and you'll see their phone
          number to arrange things.
        </p>
      ),
      confirmLabel: "Yes, I'll help",
      cancelLabel: "Not this one",
    });
    if (!ok) return;
    setBusy(r.id);
    try {
      await api.put(`/requests/${r.id}/accept`);
      toast(`Thank you! “${r.requestType}” is now on your task list.`);
      await load();
      setTab("tasks");
    } catch (err) {
      toast(errorMessage(err, "We couldn't accept this request."), "error");
      load(); // Someone may have taken it first; refresh so the board is accurate.
    } finally {
      setBusy(null);
    }
  };

  const complete = async (r) => {
    const ok = await confirm({
      kicker: "Nearly there",
      title: `Is “${r.requestType}” done?`,
      body: `We'll let ${r.user?.firstName || "the resident"} know, and they'll be able to rate your help.`,
      confirmLabel: "Mark as done",
      cancelLabel: "Not yet",
    });
    if (!ok) return;
    setBusy(r.id);
    try {
      await api.put(`/requests/${r.id}/complete`);
      toast("Marked as done. That's a neighbor helped!");
      await load();
    } catch (err) {
      toast(errorMessage(err, "We couldn't update this request."), "error");
    } finally {
      setBusy(null);
    }
  };

  const active = mine.filter((r) => normStatus(r.status) === "ACCEPTED");
  const done = mine.filter((r) => normStatus(r.status) === "COMPLETED");
  const upcoming = projects.filter((o) => !isPast(o.deadline)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const urgentCount = (pending || []).filter((r) => r.urgency === "High").length;
  const avg = reviews.length ? (reviews.reduce((s, f) => s + (f.rating || 0), 0) / reviews.length).toFixed(1) : "–";

  const lede =
    pending && pending.length
      ? `${plural(pending.length, "neighbor needs", "neighbors need")} a hand${urgentCount ? `, ${urgentCount} of them urgently` : ""}.`
      : "The noticeboard is quiet. Thanks for keeping an eye on it.";

  return (
    <div className="container page">
      <motion.header className="front" {...fadeUp}>
        <div>
          <p className="kicker">Volunteer desk</p>
          <h1 className="front__title">
            {greeting()}, <em className="accent">{session.firstName || "neighbor"}</em>.
          </h1>
          <p className="lede">{lede}</p>
        </div>
      </motion.header>

      <Alert onClose={() => setError("")}>{error}</Alert>

      {pending === null ? (
        <SkeletonGrid count={3} height={300} label="Loading the noticeboard" />
      ) : (
        <>
          <Note
            label="Your volunteering so far"
            signOff="— thank you, truly"
            lines={[
              ...active.slice(0, 2).map((r) => (
                <>
                  You're helping {r.user?.firstName || "a neighbor"} with “{r.requestType}”, needed by {formatDate(r.deadline)}.{" "}
                  <NoteAction onClick={() => setTab("tasks")}>Their details</NoteAction>
                </>
              )),
              active.length > 2 && `…plus ${plural(active.length - 2, "more task")} on your list.`,
              upcoming[0] && `Next community project: ${upcoming[0].name}, ${formatDate(upcoming[0].deadline)}.`,
              done.length > 0 && `You've helped ${plural(done.length, "neighbor")} so far. That adds up.`,
              done.length === 0 &&
                active.length === 0 &&
                "Your first job is the hardest one to pick. Anything on the board below would be a great start.",
              reviews.length > 0 && (
                <>
                  Neighbors rate your help {avg} out of 5. <NoteAction onClick={() => setTab("reviews")}>Read what they said</NoteAction>
                </>
              ),
            ]}
          />

          <div className="front__grid">
            <div>
              <div className="toolbar">
                <Tabs
                  idBase="volunteer"
                  label="Dashboard sections"
                  active={tab}
                  onChange={setTab}
                  tabs={[
                    { id: "board", label: "Noticeboard", count: pending.length },
                    { id: "tasks", label: "My tasks", count: active.length, alert: active.length > 0 },
                    { id: "reviews", label: "Kind words", count: reviews.length },
                  ]}
                />
              </div>
              <TabPanel idBase="volunteer" active={tab}>
                {tab === "board" && <BoardTab pending={pending} busy={busy} onAccept={accept} />}
                {tab === "tasks" && <TasksTab active={active} done={done} busy={busy} onComplete={complete} onBrowse={() => setTab("board")} />}
                {tab === "reviews" && <ReviewsTab reviews={reviews} unavailable={reviewsUnavailable} />}
              </TabPanel>
            </div>

            <aside className="sidebar" aria-label="Your calendar">
              <div className="side-card">
                <div className="row row--between">
                  <p className="kicker kicker--plain">Your projects</p>
                  <Link to="/volunteer-opportunities" className="arrow-link">
                    Find more <ArrowRight size={15} />
                  </Link>
                </div>
                {upcoming.length === 0 ? (
                  <div className="side-card__empty">
                    <CalendarArt className="side-card__art" />
                    <p className="small text-2">You haven't signed up for any upcoming community projects.</p>
                  </div>
                ) : (
                  <ul className="mini-list">
                    {upcoming.slice(0, 4).map((o) => (
                      <li key={o.id}>
                        <span className="mini-list__date">{formatDate(o.deadline)}</span>
                        <strong>{o.name}</strong>
                        <span className="small muted">
                          <MapPin size={12} aria-hidden="true" /> {o.location}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="side-card side-card--accent">
                <p className="kicker kicker--plain">Good practice</p>
                <ul className="ticks ticks--small">
                  <li>Call ahead before you set off.</li>
                  <li>Keep receipts if you shop for someone.</li>
                  <li>Only mark a task done once it really is.</li>
                </ul>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default VolunteerDashboard;
