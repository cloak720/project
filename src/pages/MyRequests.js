import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, PlusCircle, Star } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { fullName, normStatus } from "../lib/format";
import { useConfirm, useSession, useToast } from "../context/AppContext";
import { useMyRequests, useMyReviews } from "../hooks/useResident";
import useTitle from "../hooks/useTitle";
import { NoticeboardArt } from "../components/art/Scenes";
import RequestCard from "../components/RequestCard";
import { Alert, Avatar, EmptyState, PageHead, SkeletonGrid, StarRow, TabPanel, Tabs, listItem } from "../components/ui";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Waiting" },
  { id: "ACCEPTED", label: "In progress" },
  { id: "COMPLETED", label: "Done" },
];

const STATUS_ORDER = { ACCEPTED: 0, PENDING: 1, COMPLETED: 2 };

const Helper = ({ request: r }) => {
  const done = normStatus(r.status) === "COMPLETED";
  return (
    <div className="person">
      <Avatar person={r.volunteer} size="sm" />
      <div>
        <div className="small">
          {done ? "Helped by" : "Helping:"} <strong>{fullName(r.volunteer)}</strong>
        </div>
        {!done && r.volunteer.phoneNo && (
          <a className="tiny" href={`tel:${r.volunteer.phoneNo}`}>
            <Phone size={12} aria-hidden="true" /> {r.volunteer.phoneNo}
          </a>
        )}
      </div>
    </div>
  );
};

const MyRequests = () => {
  useTitle("My requests");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const highlight = params.get("highlight");
  const { requests, setRequests, error } = useMyRequests();
  const { reviews } = useMyReviews(session.userId);
  const [busyId, setBusyId] = useState(null);
  const filter = FILTERS.some((f) => f.id === params.get("status")) ? params.get("status") : "ALL";

  const setFilter = (id) => setParams(id === "ALL" ? {} : { status: id }, { replace: true });

  useEffect(() => {
    if (highlight && requests?.length) {
      document.getElementById(`request-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight, requests]);

  const reviewFor = useMemo(() => {
    const map = new Map();
    reviews.forEach((f) => map.set(String(f.volunteerId), f));
    return map;
  }, [reviews]);

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
  const withdraw = async (r) => {
    const ok = await confirm({
      kicker: "Withdraw request",
      title: `Take down “${r.requestType}”?`,
      body: "It will disappear from the volunteers' noticeboard. You can always post it again later.",
      confirmLabel: "Withdraw it",
      cancelLabel: "Keep it up",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(r.id);
    try {
      await api.delete(`/requests/${r.id}`);
      setRequests((list) => list.filter((x) => x.id !== r.id));
      toast("Request withdrawn.");
    } catch (err) {
      toast(errorMessage(err, "We couldn't withdraw this request."), "error");
    } finally {
      setBusyId(null);
    }
  };

  const footerFor = (r) => {
    const status = normStatus(r.status);
    const review = r.volunteer && reviewFor.get(String(r.volunteer.id));
    return (
      <>
        {r.volunteer ? <Helper request={r} /> : <span className="small text-2">No one has picked this up yet.</span>}
        {status === "PENDING" && (
          <button type="button" className="btn btn--danger btn--sm" onClick={() => withdraw(r)} disabled={busyId === r.id}>
            {busyId === r.id ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
        {status === "COMPLETED" &&
          r.volunteer &&
          (review ? (
            <span className="rated">
              You rated <StarRow value={review.rating} size={13} />
            </span>
          ) : (
            <Link to={`/contact?tab=feedback&volunteer=${r.volunteer.id}`} className="btn btn--sm btn--ink">
              <Star size={14} /> Rate {r.volunteer.firstName}
            </Link>
          ))}
      </>
    );
  };

  return (
    <div className="container page">
      <PageHead
        kicker="Your notices"
        title="My requests"
        lede="Follow each request from the noticeboard to done, and see who's helping."
        actions={
          <Link to="/user-request" className="btn btn--primary">
            <PlusCircle size={18} /> New request
          </Link>
        }
      />
      <Alert>{error}</Alert>

      {requests === null ? (
        <SkeletonGrid count={3} height={300} label="Loading your requests" />
      ) : requests.length === 0 ? (
        <EmptyState
          art={NoticeboardArt}
          title="You haven't asked for anything yet"
          action={
            <Link to="/user-request" className="btn btn--primary btn--sm">
              Post your first request
            </Link>
          }
        >
          It's what NeighborAid is for. Post a request and follow its progress right here.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <Tabs
              idBase="my-requests"
              label="Filter by status"
              tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))}
              active={filter}
              onChange={setFilter}
            />
          </div>
          <TabPanel idBase="my-requests" active={filter}>
            {visible.length === 0 ? (
              <EmptyState art={NoticeboardArt} title="Nothing in this pile">
                No requests with this status right now.
              </EmptyState>
            ) : (
              <div className="grid">
                {visible.map((r, i) => (
                  <motion.div key={r.id} {...listItem(i)}>
                    <RequestCard request={r} view="resident" highlight={String(r.id) === highlight} footer={footerFor(r)} />
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

export default MyRequests;
