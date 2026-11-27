import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardCheck, HandHeart, Inbox, RefreshCw, Search, Star, UserRound } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { REQUEST_CATEGORIES, URGENCY_ORDER, byDate, greeting, matches, normStatus, timeLeft } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useConfirm, useSession, useToast } from "../../context/AppContext";
import { useShell } from "../../components/shell/AppShell";
import { Alert, EmptyState, PageHeader, SectionHeader, SkeletonCards, SkeletonStats, Stat, Tabs } from "../../components/ui";
import { categoryIcon } from "../../components/ui/categories";
import RequestCard from "../../components/requests/RequestCard";

const SORTS = [
  { id: "urgency", label: "Urgent first" },
  { id: "deadline", label: "Soonest" },
  { id: "newest", label: "Newest" },
];

const SORTERS = {
  urgency: (a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3) || byDate("deadline")(a, b),
  deadline: byDate("deadline"),
  newest: (a, b) => b.id - a.id,
};

const average = (list) => (list.length ? list.reduce((s, f) => s + (f.rating || 0), 0) / list.length : null);

const Board = () => {
  useDocumentTitle("Request board");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const shell = useShell();
  const navigate = useNavigate();
  const { data, error, loading, setData, reload } = useResource(async () => {
    const [pending, accepted, reviews] = await Promise.all([
      getList("/requests/pending"),
      getList("/requests/accepted"),
      getList(`/feedback/volunteer/${session.userId}`).catch(() => null),
    ]);
    return { pending, accepted, reviews };
  }, [session.userId]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("urgency");
  const highlight = useHighlight(!!data);

  const open = useMemo(
    () =>
      (data?.pending || [])
        .filter((r) => !category || r.category === category)
        .filter((r) => matches(query, r.requestType, r.description, r.category, r.houseNo))
        .sort(SORTERS[sort]),
    [data, query, category, sort]
  );

  const active = (data?.accepted || []).filter((r) => normStatus(r.status) === "ACCEPTED").sort(byDate("deadline"));
  const completed = (data?.accepted || []).filter((r) => normStatus(r.status) === "COMPLETED").length;
  const avg = data?.reviews ? average(data.reviews) : null;

  const accept = async (r) => {
    const ok = await confirm({
      title: `Help with “${r.requestType}”?`,
      body: (
        <>
          {r.user?.firstName || "The resident"} will see that you've accepted, and you'll get their phone number to arrange the
          details. Only accept if you can do it{r.deadline ? ` by ${new Date(r.deadline).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}` : ""}.
        </>
      ),
      confirmLabel: "I'll help",
      tone: "accent",
      icon: HandHeart,
    });
    if (!ok) return;

    // Optimistic: move the card to "your tasks" straight away, put it back if the server says no.
    const before = data;
    setData((d) => ({
      ...d,
      pending: d.pending.filter((x) => x.id !== r.id),
      accepted: [...d.accepted, { ...r, status: "ACCEPTED" }],
    }));
    try {
      const { data: saved } = await api.put(`/requests/${r.id}/accept`);
      if (saved && typeof saved === "object") {
        setData((d) => ({ ...d, accepted: d.accepted.map((x) => (x.id === r.id ? saved : x)) }));
      }
      toast(`You're helping with “${r.requestType}”. Thank you!`, {
        action: { label: "View task", onClick: () => navigate(`/tasks?highlight=${r.id}`) },
      });
      shell.refresh();
    } catch (err) {
      setData(before);
      toast(errorMessage(err, "Couldn't accept this request."), { tone: "error" });
      // Someone else probably got there first; refresh so the board is accurate.
      if (err.response?.status === 409) reload();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={`${greeting()}, ${session.firstName || "neighbor"}`}
        title="Request board"
        subtitle="Neighbors who could use a hand right now. Pick something you can do and we'll connect you."
        actions={
          <button type="button" className="btn" onClick={reload} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        }
      />
      <Alert>{error}</Alert>

      {loading && !data ? (
        <div className="stack stack--lg">
          <SkeletonStats />
          <SkeletonCards count={4} />
        </div>
      ) : data ? (
        <div className="stack stack--lg">
          <div className="stats">
            <Stat icon={Inbox} label="Open requests" value={data.pending.length} hint={`${data.pending.filter((r) => r.urgency === "High").length} marked urgent`} accent />
            <Stat icon={ClipboardCheck} label="Your active tasks" value={active.length} hint="Accepted, not yet done" as={Link} to="/tasks" />
            <Stat icon={CheckCircle2} label="Completed" value={completed} hint="Requests you've finished" />
            <Stat
              icon={Star}
              label="Your rating"
              value={avg ? avg.toFixed(1) : "–"}
              hint={data.reviews ? `${data.reviews.length} review${data.reviews.length === 1 ? "" : "s"}` : "Not available"}
            />
          </div>

          <div className="split split--wide">
            <section aria-labelledby="open-heading">
              <SectionHeader title={<span id="open-heading">Open near you</span>} count={open.length} />
              <div className="toolbar">
                <label className="search">
                  <Search size={15} aria-hidden="true" />
                  <span className="sr-only">Search open requests</span>
                  <input className="input" data-page-search placeholder="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} />
                  <kbd>/</kbd>
                </label>
                <Tabs label="Sort" tabs={SORTS} active={sort} onChange={setSort} />
              </div>
              <div className="chip-row" role="group" aria-label="Filter by category" style={{ marginBottom: 16 }}>
                <button type="button" className={`chip chip--sm ${!category ? "is-selected" : ""}`} aria-pressed={!category} onClick={() => setCategory("")}>
                  All
                </button>
                {REQUEST_CATEGORIES.map((c) => {
                  const Icon = categoryIcon(c);
                  const n = data.pending.filter((r) => r.category === c).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`chip chip--sm ${category === c ? "is-selected" : ""}`}
                      aria-pressed={category === c}
                      onClick={() => setCategory(category === c ? "" : c)}
                      disabled={!n && category !== c}
                    >
                      <Icon size={13} aria-hidden="true" /> {c}
                      <span className="chip__count">{n}</span>
                    </button>
                  );
                })}
              </div>

              {data.pending.length === 0 ? (
                <EmptyState art="check" title="No one needs help right now">
                  New requests from your neighbors will appear here. We'll flag urgent ones in your notifications.
                </EmptyState>
              ) : open.length === 0 ? (
                <EmptyState art="search" title="No matches" compact>
                  Try a different search or category.
                </EmptyState>
              ) : (
                <div className="card-grid card-grid--2">
                  <AnimatePresence initial={false}>
                    {open.map((r) => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        view="board"
                        highlighted={String(r.id) === highlight}
                        extraMeta={
                          r.user && (
                            <span>
                              <UserRound size={14} aria-hidden="true" /> {r.user.firstName}
                            </span>
                          )
                        }
                      >
                        <span className="muted small">Contact shared after you accept</span>
                        <button type="button" className="btn btn--primary btn--sm" onClick={() => accept(r)}>
                          <HandHeart size={13} /> I can help
                        </button>
                      </RequestCard>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            <aside className="card side-queue" aria-labelledby="queue-heading">
              <div className="card__head">
                <h2 className="card__title" id="queue-heading">
                  <ClipboardCheck size={15} aria-hidden="true" /> Your queue
                </h2>
                <Link to="/tasks" className="link-btn small">
                  Open <ArrowRight size={13} />
                </Link>
              </div>
              {active.length === 0 ? (
                <p className="card__body muted small">Requests you accept appear here, soonest first.</p>
              ) : (
                <ul className="mini-list">
                  {active.map((r) => {
                    const Icon = categoryIcon(r.category);
                    const left = timeLeft(r.deadline);
                    return (
                      <li key={r.id}>
                        <Link to={`/tasks?highlight=${r.id}`} className="mini-list__item">
                          <span className="mini-list__icon">
                            <Icon size={14} aria-hidden="true" />
                          </span>
                          <span className="mini-list__text">
                            <strong>{r.requestType}</strong>
                            <span className="muted">{r.user?.firstName ? `For ${r.user.firstName}` : `House ${r.houseNo}`}</span>
                          </span>
                          {left && <span className={`deadline-chip ${left === "Overdue" ? "is-overdue" : ""}`}>{left}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Board;
