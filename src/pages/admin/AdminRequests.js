import React, { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import api, { getList } from "../../lib/api";
import { URGENCIES, formatDateTime, fullName, isPast, matches, normStatus, timeLeft } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useToast } from "../../context/AppContext";
import { Alert, Avatar, EmptyState, PageHeader, SkeletonRows, StatusBadge, Tabs, UrgencyBadge } from "../../components/ui";
import { CategoryTag } from "../../components/ui/categories";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Open" },
  { id: "ACCEPTED", label: "In progress" },
  { id: "COMPLETED", label: "Completed" },
];

const Person = ({ person, sub }) =>
  person ? (
    <span className="person">
      <Avatar person={person} size="sm" />
      <span className="person__text">
        <span className="cell-main">{fullName(person)}</span>
        {sub && <span className="cell-sub">{sub}</span>}
      </span>
    </span>
  ) : (
    <span className="muted">Unassigned</span>
  );

const AdminRequests = () => {
  useDocumentTitle("Requests");
  const toast = useToast();
  const { data: requests, error, loading, setData } = useResource(() => getList("/requests/all"));
  const [filter, setFilter] = useState("ALL");
  const [urgency, setUrgency] = useState("");
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

  const rows = useMemo(
    () =>
      (requests || [])
        .filter((r) => filter === "ALL" || normStatus(r.status) === filter)
        .filter((r) => !urgency || r.urgency === urgency)
        .filter((r) => matches(query, r.requestType, r.description, r.category, fullName(r.user, ""), fullName(r.volunteer, ""), `#${r.id}`))
        .sort((a, b) => b.id - a.id),
    [requests, filter, urgency, query]
  );

  const remove = (r) => {
    setData((list) => list.filter((x) => x.id !== r.id));
    toast.undoable({
      message: `Deleted “${r.requestType}”.`,
      commit: () => api.delete(`/requests/${r.id}`),
      undo: () => setData((list) => (list.some((x) => x.id === r.id) ? list : [...list, r])),
      errorFallback: "Couldn't delete that request, so it has been restored.",
    });
  };

  return (
    <>
      <PageHeader eyebrow="Moderation" title="Requests" subtitle="Every request on the platform. Remove anything that breaks the community guidelines." />
      <Alert>{error}</Alert>
      {loading && !requests ? (
        <SkeletonRows rows={6} />
      ) : requests ? (
        <>
          <div className="toolbar">
            <Tabs label="Filter by status" tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} active={filter} onChange={setFilter} />
            <div className="toolbar__group">
              <label className="search">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Search requests</span>
                <input className="input" data-page-search placeholder="Search title, person or #id" value={query} onChange={(e) => setQuery(e.target.value)} />
                <kbd>/</kbd>
              </label>
              <select className="input" value={urgency} onChange={(e) => setUrgency(e.target.value)} aria-label="Urgency">
                <option value="">Any urgency</option>
                {URGENCIES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          {rows.length === 0 ? (
            <EmptyState art="search" title={requests.length ? "No requests match" : "No requests yet"} compact>
              {requests.length ? "Try another filter or search." : "Requests residents post will appear here."}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <th scope="col">Request</th>
                    <th scope="col">Status</th>
                    <th scope="col">Posted by</th>
                    <th scope="col">Volunteer</th>
                    <th scope="col">Deadline</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const status = normStatus(r.status);
                    const overdue = status !== "COMPLETED" && isPast(r.deadline);
                    return (
                      <tr key={r.id} id={`item-${r.id}`} className={String(r.id) === highlight ? "is-highlighted" : ""}>
                        <td data-label="Request">
                          <div className="cell-main">{r.requestType}</div>
                          <div className="cell-sub row" style={{ gap: 6, marginTop: 4 }}>
                            <span className="mono">#{r.id}</span>
                            <CategoryTag category={r.category} />
                            <span>House {r.houseNo}</span>
                          </div>
                        </td>
                        <td data-label="Status">
                          <div className="badges">
                            <StatusBadge status={r.status} />
                            {status === "PENDING" && <UrgencyBadge urgency={r.urgency} />}
                          </div>
                        </td>
                        <td data-label="Posted by">
                          <Person person={r.user} sub={r.phoneNumber} />
                        </td>
                        <td data-label="Volunteer">
                          <Person person={r.volunteer} />
                        </td>
                        <td data-label="Deadline">
                          <div className={overdue ? "text-danger" : ""}>{formatDateTime(r.deadline)}</div>
                          {status !== "COMPLETED" && <div className={`cell-sub ${overdue ? "text-danger" : ""}`}>{timeLeft(r.deadline)}</div>}
                        </td>
                        <td className="cell-actions">
                          <button type="button" className="btn btn--sm btn--danger" onClick={() => remove(r)} aria-label={`Delete request ${r.requestType}`}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </>
  );
};

export default AdminRequests;
