import React from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { formatDate, isPast, relativeDays } from "../lib/format";
import { Capacity } from "./ui";

export const joinedBy = (opportunity, userId) =>
  (opportunity.volunteers || []).some((v) => String(v.user?.id) === String(userId));

/**
 * One opportunity. `actions` is whatever buttons the caller wants in the footer,
 * so the same card serves volunteers (join/withdraw), residents (read-only) and admins (manage).
 */
const OpportunityCard = ({ opportunity: o, joined, actions, children }) => {
  const taken = o.volunteers?.length || 0;
  const expired = isPast(o.deadline);
  return (
    <article className={`item-card ${joined ? "item-card--joined" : ""}`}>
      <div className="item-card__head">
        <h3>{o.name}</h3>
        <div className="badges">
          {joined && <span className="badge badge--primary">You're in</span>}
          {expired && <span className="badge badge--danger">Closed</span>}
        </div>
      </div>
      <p className="item-card__desc">{o.description}</p>
      <div className="badges">
        <span className="badge">{o.category || "General"}</span>
      </div>
      <div className="meta meta--list">
        <span>
          <MapPin size={14} /> {o.location || "Location to be confirmed"}
        </span>
        <span>
          <CalendarClock size={14} /> {formatDate(o.deadline)}
          {!expired && o.deadline ? ` · ${relativeDays(o.deadline)}` : ""}
        </span>
      </div>
      <Capacity taken={taken} limit={o.volunteerLimit} />
      {children}
      {actions && <div className="item-card__foot">{actions}</div>}
    </article>
  );
};

export default OpportunityCard;
