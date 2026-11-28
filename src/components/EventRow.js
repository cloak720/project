import React from "react";
import { MapPin } from "lucide-react";
import { dateParts, isPast, relativeDays } from "../lib/format";
import CategoryArt from "./art/Spots";
import { Capacity } from "./ui";

export const joinedBy = (opportunity, userId) =>
  (opportunity.volunteers || []).some((v) => String(v.user?.id) === String(userId));

/**
 * One community opportunity, set like a listing in the "What's on" pages:
 * a calendar block, the story, then spaces left and whatever actions the caller passes in.
 */
const EventRow = ({ opportunity: o, joined, actions, children }) => {
  const parts = dateParts(o.deadline);
  const past = isPast(o.deadline);
  const taken = o.volunteers?.length || 0;
  return (
    <article className={`event ${joined ? "event--joined" : ""} ${past ? "event--past" : ""}`}>
      <div className="event__date" aria-hidden="true">
        {parts ? (
          <>
            <span className="event__weekday">{parts.weekday}</span>
            <span className="event__day">{parts.day}</span>
            <span className="event__month">{parts.month}</span>
          </>
        ) : (
          <span className="event__month">TBC</span>
        )}
      </div>
      <div className="event__body">
        <p className="clip__kicker">
          {o.category || "Community"}
          {o.deadline && (
            <>
              <span aria-hidden="true">·</span>
              <span>{past ? "Took place" : relativeDays(o.deadline)}</span>
            </>
          )}
          {parts?.time && (
            <>
              <span aria-hidden="true">·</span>
              <span>{parts.time}</span>
            </>
          )}
        </p>
        <h3 className="event__title">
          {o.name}
          {joined && <span className="badge badge--success event__badge">You're going</span>}
        </h3>
        {o.description && <p className="event__desc">{o.description}</p>}
        <p className="meta">
          <span>
            <MapPin size={15} aria-hidden="true" /> {o.location || "Location to be confirmed"}
          </span>
          <span className="sr-only">Date: {parts ? `${parts.weekday} ${parts.day} ${parts.month}` : "to be confirmed"}</span>
        </p>
        {children}
      </div>
      <div className="event__side">
        <CategoryArt category={o.category} className="event__art" />
        <Capacity taken={taken} limit={o.volunteerLimit} />
        {actions && <div className="event__actions">{actions}</div>}
      </div>
    </article>
  );
};

export default EventRow;
