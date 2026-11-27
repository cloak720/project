import React from "react";
import { motion } from "framer-motion";
import { CalendarClock, Home as HomeIcon } from "lucide-react";
import { formatDateTime, isPast, normStatus, timeLeft } from "../../lib/format";
import { StatusBadge, Stepper, UrgencyBadge } from "../ui";
import { CategoryTag } from "../ui/categories";

/** Deadline with a countdown, turning red once it has passed (unless the request is done). */
export const Deadline = ({ value, done }) => {
  const overdue = !done && isPast(value);
  return (
    <span className={overdue ? "text-danger" : ""}>
      <CalendarClock size={14} aria-hidden="true" />
      {formatDateTime(value)}
      {!done && value && <span className={`deadline-chip ${overdue ? "is-overdue" : ""}`}>{timeLeft(value)}</span>}
    </span>
  );
};

/**
 * One request. The same card serves residents (status + progress), volunteers browsing the
 * board (urgency first) and volunteers working a task (contact details). Callers pass the
 * footer content as children.
 */
const RequestCard = ({ request: r, view = "owner", highlighted, extraMeta, children }) => {
  const status = normStatus(r.status);
  const done = status === "COMPLETED";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      id={`item-${r.id}`}
      className={`rcard rcard--${(r.urgency || "low").toLowerCase()} ${highlighted ? "is-highlighted" : ""} ${done ? "is-done" : ""}`}
    >
      <div className="rcard__head">
        <h3 className="rcard__title">{r.requestType}</h3>
        {view === "board" ? <UrgencyBadge urgency={r.urgency} /> : <StatusBadge status={r.status} />}
      </div>
      {r.description && <p className="rcard__desc">{r.description}</p>}
      <div className="badges">
        <CategoryTag category={r.category} />
        {view !== "board" && !done && <UrgencyBadge urgency={r.urgency} />}
      </div>
      <div className="meta rcard__meta">
        <Deadline value={r.deadline} done={done} />
        <span>
          <HomeIcon size={14} aria-hidden="true" /> House {r.houseNo || "?"}
        </span>
        {extraMeta}
      </div>
      {view === "owner" && <Stepper status={r.status} />}
      {children && <div className="rcard__foot">{children}</div>}
    </motion.article>
  );
};

export default RequestCard;
