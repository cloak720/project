import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Phone, PlusCircle, Search, Star, Undo2 } from "lucide-react";
import api, { getList } from "../../lib/api";
import { byDate, fullName, isPast, matches, normStatus, telHref } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useToast } from "../../context/AppContext";
import { useShell } from "../../components/shell/AppShell";
import { Alert, Avatar, EmptyState, Kbd, PageHeader, SkeletonCards, Tabs } from "../../components/ui";
import RequestCard from "../../components/requests/RequestCard";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Open" },
  { id: "ACCEPTED", label: "In progress" },
  { id: "COMPLETED", label: "Completed" },
];

const STATUS_ORDER = { ACCEPTED: 0, PENDING: 1, COMPLETED: 2 };

const MyRequests = () => {
  useDocumentTitle("My requests");
  const toast = useToast();
  const shell = useShell();
  const { data: requests, error, loading, setData } = useResource(() => getList("/requests/user"));
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const highlight = useHighlight(!!requests);

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, ACCEPTED: 0, COMPLETED: 0 };
    (requests || []).forEach((r) => {
      c.ALL += 1;
      c[normStatus(r.status)] = (c[normStatus(r.status)] || 0) + 1;
    });
    return c;
  }, [requests]);

  const visible = useMemo(
    () =>
      (requests || [])
        .filter((r) => filter === "ALL" || normStatus(r.status) === filter)
        .filter((r) => matches(query, r.requestType, r.description, r.category))
        .sort((a, b) => (STATUS_ORDER[normStatus(a.status)] ?? 3) - (STATUS_ORDER[normStatus(b.status)] ?? 3) || byDate("deadline")(a, b)),
    [requests, filter, query]
  );

  // Only requests nobody has accepted can be withdrawn; after that a volunteer is relying on them.
  const withdraw = (r) => {
    setData((list) => list.filter((x) => x.id !== r.id));
    toast.undoable({
      message: `Withdrew “${r.requestType}”.`,
      commit: async () => {
        await api.delete(`/requests/${r.id}`);
        shell.refresh();
      },
      undo: () => setData((list) => (list.some((x) => x.id === r.id) ? list : [...list, r])),
      errorFallback: "Couldn't withdraw that request, so it's back on your list.",
    });
  };

  return (
    <>
      <PageHeader
        title="My requests"
        subtitle="Follow each request from posted to done. Open requests can be withdrawn until someone accepts."
        actions={
          <Link to="/requests/new" className="btn btn--primary">
            <PlusCircle size={16} /> New request <Kbd keys={["N"]} />
          </Link>
        }
      />
      <Alert>{error}</Alert>

      {loading && !requests ? (
        <SkeletonCards count={4} label="Loading your requests" />
      ) : requests && requests.length === 0 ? (
        <EmptyState
          art="plus"
          title="You haven't asked for help yet"
          action={
            <Link to="/requests/new" className="btn btn--primary btn--sm">
              Post your first request
            </Link>
          }
        >
          When you post a request, you can follow its progress here.
        </EmptyState>
      ) : requests ? (
        <>
          <div className="toolbar">
            <Tabs label="Filter by status" tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} active={filter} onChange={setFilter} />
            <label className="search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search your requests</span>
              <input className="input" data-page-search placeholder="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} />
              <kbd>/</kbd>
            </label>
          </div>

          {visible.length === 0 ? (
            <EmptyState art="search" title="Nothing matches" compact>
              Try another filter or search term.
            </EmptyState>
          ) : (
            <div className="card-grid">
              <AnimatePresence initial={false}>
                {visible.map((r) => {
                  const status = normStatus(r.status);
                  return (
                    <RequestCard key={r.id} request={r} highlighted={String(r.id) === highlight}>
                      {r.volunteer ? (
                        <span className="person small">
                          <Avatar person={r.volunteer} size="sm" />
                          <span className="person__text">
                            <span className="muted">{status === "COMPLETED" ? "Helped by" : "Accepted by"}</span>{" "}
                            <strong>{fullName(r.volunteer)}</strong>
                          </span>
                        </span>
                      ) : (
                        <span className="muted small">{isPast(r.deadline) ? "Past its deadline" : "Waiting for a volunteer"}</span>
                      )}
                      {status === "PENDING" && (
                        <button type="button" className="btn btn--sm btn--danger" onClick={() => withdraw(r)}>
                          <Undo2 size={13} /> Withdraw
                        </button>
                      )}
                      {status === "ACCEPTED" && r.volunteer?.phoneNo && (
                        <a href={telHref(r.volunteer.phoneNo)} className="btn btn--sm">
                          <Phone size={13} /> Call
                        </a>
                      )}
                      {status === "COMPLETED" && r.volunteer && (
                        <Link to={`/feedback?volunteer=${r.volunteer.id}`} className="btn btn--sm">
                          <Star size={13} /> Rate
                        </Link>
                      )}
                    </RequestCard>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : null}
    </>
  );
};

export default MyRequests;
