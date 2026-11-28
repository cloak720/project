import React from "react";
import { CalendarClock, Home as HomeIcon, Phone, UserRound } from "lucide-react";
import { formatDateTime, isPast, normStatus, relativeDays } from "../lib/format";
import CategoryArt from "./art/Spots";
import { StatusBadge, Stepper, UrgencyBadge } from "./ui";

const TILTS = [-1.1, 0.7, -0.4, 1.2, -0.8, 0.35];

/**
 * One help request, laid out like a clipped notice.
 * view="resident": the author's own request, with progress.
 * view="board":    an open request a volunteer could take on (no phone number yet).
 * view="task":     a request this volunteer accepted, with the resident's contact details.
 */
const RequestCard = ({ request: r, view, highlight, footer }) => {
  const status = normStatus(r.status);
  const done = status === "COMPLETED";
  const overdue = !done && isPast(r.deadline);
  const urgent = view === "board" && r.urgency === "High";

  // On the noticeboard each card is pinned up slightly crooked, like real paper; the tilt is
  // derived from the id so a card keeps the same angle between visits.
  const pinned = view === "board";
  const tilt = TILTS[Number(r.id) % TILTS.length] || 0;

  return (
    <article
      id={`request-${r.id}`}
      className={`clip request ${highlight ? "clip--highlight" : ""} ${done ? "clip--muted" : ""} ${pinned ? "clip--pinned" : ""}`}
      style={pinned ? { "--tilt": `${tilt}deg` } : undefined}
    >
      {pinned && <span className="clip__pin" aria-hidden="true" />}
      {urgent && <span className="urgent-tag">Urgent</span>}
      <div className="clip__top">
        <div className="request__heading">
          <p className="clip__kicker">
            {r.category || "General"}
            {r.deadline && !done && <span aria-hidden="true">·</span>}
            {r.deadline && !done && <span>Needed {relativeDays(r.deadline)}</span>}
          </p>
          <h3 className="clip__title">{r.requestType}</h3>
        </div>
        <CategoryArt category={r.category} />
      </div>

      {r.description && <p className="clip__body">{r.description}</p>}

      {view === "resident" && <Stepper status={r.status} />}

      <div className="badges">
        {view !== "board" && <StatusBadge status={r.status} />}
        {!done && <UrgencyBadge urgency={r.urgency} />}
        {overdue && <span className="badge badge--danger">Past its deadline</span>}
      </div>

      <div className="meta">
        <span>
          <CalendarClock size={15} aria-hidden="true" /> {formatDateTime(r.deadline)}
        </span>
        {view === "task" && r.user && (
          <span>
            <UserRound size={15} aria-hidden="true" /> {r.user.firstName || "A neighbor"}
          </span>
        )}
        <span>
          <HomeIcon size={15} aria-hidden="true" /> House {r.houseNo || "not given"}
        </span>
        {view === "task" && !done && r.phoneNumber && (
          <a href={`tel:${r.phoneNumber}`}>
            <Phone size={15} aria-hidden="true" /> {r.phoneNumber}
          </a>
        )}
      </div>

      {footer && <div className="clip__foot">{footer}</div>}
    </article>
  );
};

export default RequestCard;
