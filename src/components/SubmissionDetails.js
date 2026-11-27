// "My requests": everything the logged-in resident has posted.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarClock, Home as HomeIcon, Inbox, Phone, PlusCircle, Star, User } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { formatDateTime, fullName, isPast, normStatus, relativeDays } from "../lib/format";
import { useToast } from "../context/AppContext";
import { Alert, EmptyState, PageHeader, Spinner, StatusBadge, Tabs, UrgencyBadge } from "./ui";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Waiting" },
  { id: "ACCEPTED", label: "In progress" },
  { id: "COMPLETED", label: "Completed" },
];

const STATUS_ORDER = { ACCEPTED: 0, PENDING: 1, COMPLETED: 2 };

const SubmissionDetails = () => {
  const toast = useToast();
  const [params] = useSearchParams();
  const highlight = params.get("highlight");
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .get("/requests/user")
      .then((r) => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch((err) => {
        setError(errorMessage(err, "Couldn't load your requests."));
        setRequests([]);
      });
  }, []);

  useEffect(() => {
    if (highlight && requests?.length) {
      document.getElementById(`request-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight, requests]);

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, ACCEPTED: 0, COMPLETED: 0 };
    (requests || []).forEach((r) => {
      c.ALL++;
      c[normStatus(r.status)] = (c[normStatus(r.status)] || 0) + 1;
    });
    return c;
  }, [requests]);

  const visible = useMemo(
    () =>
      (requests || [])
        .filter((r) => filter === "ALL" || normStatus(r.status) === filter)
        .sort(
          (a, b) =>
            (STATUS_ORDER[normStatus(a.status)] ?? 3) - (STATUS_ORDER[normStatus(b.status)] ?? 3) ||
            new Date(a.deadline) - new Date(b.deadline)
        ),
    [requests, filter]
  );

  // Only requests nobody has taken yet can be withdrawn; after that a volunteer is relying on them.
  const handleCancel = async (r) => {
    if (!window.confirm(`Withdraw "${r.requestType}"? Volunteers will no longer see it.`)) return;
    setBusyId(r.id);
    try {
      await api.delete(`/requests/${r.id}`);
      setRequests((list) => list.filter((x) => x.id !== r.id));
      toast("Request withdrawn.");
    } catch (err) {
      toast(errorMessage(err, "Couldn't withdraw this request."), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container page">
      <PageHeader
        title="My requests"
        subtitle="Track who's helping and what's still waiting for a volunteer."
        actions={
          <Link to="/user-request" className="btn btn--primary">
            <PlusCircle size={18} /> New request
          </Link>
        }
      />
      <Alert>{error}</Alert>

      {requests === null ? (
        <Spinner label="Loading your requests…" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="You haven't asked for help yet"
          action={
            <Link to="/user-request" className="btn btn--primary btn--sm">
              Post your first request
            </Link>
          }
        >
          When you post a request, you can follow its progress here.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <Tabs
              label="Filter by status"
              tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))}
              active={filter}
              onChange={setFilter}
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing here">
              No requests with this status.
            </EmptyState>
          ) : (
            <div className="grid">
              {visible.map((r) => {
                const status = normStatus(r.status);
                const overdue = status !== "COMPLETED" && isPast(r.deadline);
                return (
                  <article
                    key={r.id}
                    id={`request-${r.id}`}
                    className={`item-card ${String(r.id) === highlight ? "item-card--highlight" : ""}`}
                  >
                    <div className="item-card__head">
                      <h3>{r.requestType}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="item-card__desc">{r.description}</p>
                    <div className="badges">
                      <span className="badge">{r.category}</span>
                      <UrgencyBadge urgency={r.urgency} />
                      {overdue && <span className="badge badge--danger">Past deadline</span>}
                    </div>
                    <div className="meta meta--list">
                      <span>
                        <CalendarClock size={14} /> {formatDateTime(r.deadline)} · {relativeDays(r.deadline)}
                      </span>
                      <span>
                        <HomeIcon size={14} /> House {r.houseNo}
                      </span>
                      <span>
                        <Phone size={14} /> {r.phoneNumber}
                      </span>
                    </div>

                    <div className="item-card__foot">
                      {r.volunteer ? (
                        <span className="helper">
                          <User size={14} /> {status === "COMPLETED" ? "Helped by" : "Accepted by"}{" "}
                          <strong>{fullName(r.volunteer)}</strong>
                        </span>
                      ) : (
                        <span className="muted small">Waiting for a volunteer</span>
                      )}
                      {status === "PENDING" && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => handleCancel(r)}
                          disabled={busyId === r.id}
                        >
                          {busyId === r.id ? "Withdrawing…" : "Withdraw"}
                        </button>
                      )}
                      {status === "COMPLETED" && r.volunteer && (
                        <Link to={`/contact?tab=feedback&volunteer=${r.volunteer.id}`} className="btn btn--sm">
                          <Star size={14} /> Rate volunteer
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubmissionDetails;
