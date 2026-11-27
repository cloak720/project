import React from "react";
import { motion } from "framer-motion";
import { CalendarClock, MapPin } from "lucide-react";
import { formatDateTime, isPast, relativeDays } from "../../lib/format";
import { Capacity } from "../ui";
import { categoryIcon } from "../ui/categories";

export const joinedBy = (opportunity, userId) =>
  (opportunity.volunteers || []).some((v) => String(v.user?.id) === String(userId));

export const spotsTaken = (o) => o.volunteers?.length || 0;

export const isFull = (o) => spotsTaken(o) >= Math.max(1, Number(o.volunteerLimit) || 1);

/** One opportunity. `actions` fills the footer, so volunteers, residents and admins share the card. */
const OpportunityCard = ({ opportunity: o, joined, actions, children, highlighted }) => {
  const past = isPast(o.deadline);
  const Icon = categoryIcon(o.category);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      id={`item-${o.id}`}
      className={`ocard ${joined ? "is-joined" : ""} ${past ? "is-past" : ""} ${highlighted ? "is-highlighted" : ""}`}
    >
      <div className="ocard__banner" aria-hidden="true">
        <span className="ocard__icon">
          <Icon size={18} />
        </span>
        <span className="ocard__date">
          <span className="ocard__day">{o.deadline ? new Date(o.deadline).getDate() : "–"}</span>
          <span className="ocard__month">
            {o.deadline ? new Date(o.deadline).toLocaleDateString(undefined, { month: "short" }) : ""}
          </span>
        </span>
      </div>
      <div className="ocard__body">
        <div className="badges">
          <span className="badge">{o.category || "General"}</span>
          {joined && (
            <span className="badge badge--accent">
              <span className="badge__dot" /> You're in
            </span>
          )}
          {past && <span className="badge">Finished</span>}
        </div>
        <h3 className="ocard__title">{o.name}</h3>
        {o.description && <p className="ocard__desc">{o.description}</p>}
        <div className="meta meta--stack">
          <span>
            <MapPin size={14} aria-hidden="true" /> {o.location || "Location to be confirmed"}
          </span>
          <span>
            <CalendarClock size={14} aria-hidden="true" /> {formatDateTime(o.deadline)}
            {!past && o.deadline && <span className="muted"> · {relativeDays(o.deadline)}</span>}
          </span>
        </div>
        <Capacity taken={spotsTaken(o)} limit={o.volunteerLimit} />
        {children}
      </div>
      {actions && <div className="ocard__foot">{actions}</div>}
    </motion.article>
  );
};

export default OpportunityCard;
