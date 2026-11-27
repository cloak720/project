import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageSquareQuote, Phone, Star } from "lucide-react";
import api, { errorMessage, getList } from "../../lib/api";
import { byDate, formatDate, fullName, normStatus, telHref } from "../../lib/format";
import { useDocumentTitle, useHighlight, useResource } from "../../lib/hooks";
import { useConfirm, useSession, useToast } from "../../context/AppContext";
import { useShell } from "../../components/shell/AppShell";
import { Alert, Avatar, EmptyState, PageHeader, SkeletonCards, Stars, Tabs } from "../../components/ui";
import RequestCard from "../../components/requests/RequestCard";

const Tasks = () => {
  useDocumentTitle("My tasks");
  const session = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const shell = useShell();
  const { data, error, loading, setData } = useResource(async () => {
    const [accepted, reviews] = await Promise.all([
      getList("/requests/accepted"),
      getList(`/feedback/volunteer/${session.userId}`).catch(() => null),
    ]);
    return { accepted, reviews };
  }, [session.userId]);
  const [tab, setTab] = useState("active");
  const highlight = useHighlight(!!data);

  const active = (data?.accepted || []).filter((r) => normStatus(r.status) === "ACCEPTED").sort(byDate("deadline"));
  const done = (data?.accepted || []).filter((r) => normStatus(r.status) === "COMPLETED").sort((a, b) => b.id - a.id);
  const highlightIsDone = !!highlight && done.some((r) => String(r.id) === highlight);

  // A link to a completed task should open the Completed tab.
  useEffect(() => {
    if (highlightIsDone) setTab("done");
  }, [highlightIsDone]);

  const complete = async (r) => {
    const ok = await confirm({
      title: `Mark “${r.requestType}” as done?`,
      body: `${r.user?.firstName || "The resident"} will be told it's complete and invited to rate you. This can't be undone.`,
      confirmLabel: "Mark as done",
      tone: "accent",
      icon: CheckCircle2,
    });
    if (!ok) return;
    const setStatus = (status) =>
      setData((d) => ({ ...d, accepted: d.accepted.map((x) => (x.id === r.id ? { ...x, status } : x)) }));
    setStatus("COMPLETED");
    try {
      await api.put(`/requests/${r.id}/complete`);
      toast("Marked as done. Nice work!");
      shell.refresh();
    } catch (err) {
      setStatus("ACCEPTED");
      toast(errorMessage(err, "Couldn't mark this as done."), { tone: "error" });
    }
  };

  const contact = (r) =>
    r.user && (
      <div className="contact-strip">
        <Avatar person={r.user} size="sm" />
        <span className="contact-strip__name">
          <strong>{fullName(r.user)}</strong>
          <span className="muted">House {r.houseNo}</span>
        </span>
        {r.phoneNumber && (
          <a href={telHref(r.phoneNumber)} className="btn btn--sm" aria-label={`Call ${r.user.firstName} on ${r.phoneNumber}`}>
            <Phone size={13} /> <span className="mono">{r.phoneNumber}</span>
          </a>
        )}
      </div>
    );

  return (
    <>
      <PageHeader title="My tasks" subtitle="Everything you've agreed to help with. Call ahead to arrange a time, then mark it done." />
      <Alert>{error}</Alert>

      {loading && !data ? (
        <SkeletonCards count={2} label="Loading your tasks" />
      ) : data ? (
        <div className="split split--wide">
          <section>
            <div className="toolbar">
              <Tabs
                label="Task status"
                active={tab}
                onChange={setTab}
                tabs={[
                  { id: "active", label: "In progress", count: active.length },
                  { id: "done", label: "Completed", count: done.length },
                ]}
              />
            </div>
            {tab === "active" ? (
              active.length === 0 ? (
                <EmptyState
                  art="check"
                  title="No active tasks"
                  action={
                    <Link to="/board" className="btn btn--primary btn--sm">
                      Browse open requests
                    </Link>
                  }
                >
                  Requests you accept show up here with the resident's contact details.
                </EmptyState>
              ) : (
                <div className="card-grid card-grid--2">
                  <AnimatePresence initial={false}>
                    {active.map((r) => (
                      <RequestCard key={r.id} request={r} view="task" highlighted={String(r.id) === highlight}>
                        <div className="stack" style={{ gap: 10, width: "100%" }}>
                          {contact(r)}
                          <button type="button" className="btn btn--primary btn--sm btn--block" onClick={() => complete(r)}>
                            <CheckCircle2 size={14} /> Mark as done
                          </button>
                        </div>
                      </RequestCard>
                    ))}
                  </AnimatePresence>
                </div>
              )
            ) : done.length === 0 ? (
              <EmptyState art="star" title="Nothing completed yet" compact>
                Finished tasks are kept here as a record of your help.
              </EmptyState>
            ) : (
              <div className="card-grid card-grid--2">
                {done.map((r) => (
                  <RequestCard key={r.id} request={r} view="task" highlighted={String(r.id) === highlight}>
                    <span className="small row">
                      <CheckCircle2 size={14} className="text-success" aria-hidden="true" /> Done for {r.user?.firstName || "a neighbor"}
                    </span>
                    <span className="muted small">{formatDate(r.deadline)}</span>
                  </RequestCard>
                ))}
              </div>
            )}
          </section>

          <aside className="card" aria-labelledby="reviews-heading">
            <div className="card__head">
              <h2 className="card__title" id="reviews-heading">
                <Star size={15} aria-hidden="true" /> Reviews about you
              </h2>
            </div>
            {!data.reviews ? (
              <p className="card__body muted small">Reviews aren't available right now.</p>
            ) : data.reviews.length === 0 ? (
              <p className="card__body muted small">When residents rate your help, their words show up here.</p>
            ) : (
              <ul className="review-list">
                {[...data.reviews].reverse().map((f) => (
                  <li key={f.id} className="review-list__item">
                    <Stars value={f.rating} size={13} />
                    <p>
                      <MessageSquareQuote size={13} className="muted" aria-hidden="true" /> {f.comment || "No comment left."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
};

export default Tasks;
