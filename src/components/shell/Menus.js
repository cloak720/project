import React, { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  HandHeart,
  Keyboard,
  LogOut,
  Mail,
  MessageSquareReply,
  Monitor,
  Moon,
  Siren,
  Sun,
  UserRound,
} from "lucide-react";
import { ROLE_LABELS } from "../../lib/auth";
import { fullName } from "../../lib/format";
import { useDismiss } from "../../lib/hooks";
import { useTheme } from "../../context/AppContext";
import { Avatar, Kbd } from "../ui";

const pop = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
  transition: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] },
};

/** Shared open/close + outside-click + Escape behaviour for a trigger and its panel. */
const usePopover = () => {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const panel = useRef(null);
  const refs = useRef([trigger, panel]).current;
  const close = useCallback((restoreFocus) => {
    setOpen(false);
    if (restoreFocus === true) trigger.current?.focus();
  }, []);
  useDismiss(open, close, refs);
  return { open, setOpen, close, trigger, panel };
};

const KIND_ICONS = { message: Mail, reply: MessageSquareReply, urgent: Siren, accepted: HandHeart, done: CheckCircle2 };

export const NotificationsMenu = ({ shell }) => {
  const { open, setOpen, close, trigger, panel } = usePopover();
  const { items, unread, isUnread, markAllRead } = shell;

  return (
    <div className="anchor">
      <button
        ref={trigger}
        type="button"
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={17} />
        {unread > 0 && <span className="notif__dot">{unread > 9 ? "9+" : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div ref={panel} className="popover notif-panel" {...pop}>
            <div className="notif-panel__head">
              <strong className="small">Notifications</strong>
              {unread > 0 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={markAllRead}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="notif-panel__empty">You're all caught up.</p>
            ) : (
              <ul className="notif-panel__list">
                {items.map((n) => {
                  const Icon = KIND_ICONS[n.kind] || Bell;
                  return (
                    <li key={n.key}>
                      <Link to={n.to} className={`notif-item ${isUnread(n) ? "is-unread" : ""}`} onClick={() => close()}>
                        <span className="notif-item__icon" aria-hidden="true">
                          <Icon size={14} />
                        </span>
                        <span className="notif-item__text">
                          <span className="notif-item__title">{n.title}</span>
                          <span className="notif-item__body">{n.body}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export const UserMenu = ({ session, onShortcuts, onLogout }) => {
  const { open, setOpen, close, trigger, panel } = usePopover();
  const { preference, setPreference } = useTheme();

  return (
    <div className="anchor">
      <button
        ref={trigger}
        type="button"
        className="icon-btn"
        style={{ width: "auto", padding: 2, borderRadius: 999 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar person={{ ...session, id: session.userId }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div ref={panel} className="popover" role="menu" aria-label="Account" {...pop} style={{ minWidth: 240 }}>
            <div className="person" style={{ padding: "8px 10px 10px" }}>
              <Avatar person={{ ...session, id: session.userId }} />
              <div className="person__text">
                <div className="small" style={{ fontWeight: 500 }}>
                  {fullName(session, "Your account")}
                </div>
                <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.email}
                </div>
              </div>
              <span className="badge badge--accent" style={{ marginLeft: "auto" }}>
                {ROLE_LABELS[session.role]}
              </span>
            </div>
            <div className="menu__sep" />
            <Link to="/profile" className="menu__item" role="menuitem" onClick={() => close()}>
              <UserRound size={15} /> Profile <Kbd keys={["G", "P"]} />
            </Link>
            <button
              type="button"
              className="menu__item"
              role="menuitem"
              onClick={() => {
                close();
                onShortcuts();
              }}
            >
              <Keyboard size={15} /> Keyboard shortcuts <Kbd keys={["?"]} />
            </button>
            <div className="menu__sep" />
            <div className="menu__label">Theme</div>
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="menu__item"
                role="menuitemradio"
                aria-checked={preference === t.id}
                onClick={() => setPreference(t.id)}
              >
                <t.icon size={15} /> {t.label}
                {preference === t.id && <CheckCheck size={14} className="menu__check" />}
              </button>
            ))}
            <div className="menu__sep" />
            <button type="button" className="menu__item menu__item--danger" role="menuitem" onClick={onLogout}>
              <LogOut size={15} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
