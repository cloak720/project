import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, ChevronDown, LogOut, Menu, Moon, PlusCircle, Sun, UserRound, X } from "lucide-react";
import { logout, ROLES, ROLE_LABELS, homePathFor } from "../../lib/auth";
import { longDate } from "../../lib/format";
import { useSession, useTheme } from "../../context/AppContext";
import useDismiss from "../../hooks/useDismiss";
import useNotifications from "../../hooks/useNotifications";
import Logo from "../art/Logo";
import { Avatar } from "../ui";

const NAV = {
  [ROLES.USER]: [
    { to: "/", label: "Home", end: true },
    { to: "/my-requests", label: "My requests" },
    { to: "/volunteer-opportunities", label: "Opportunities" },
    { to: "/contact", label: "Contact" },
  ],
  [ROLES.VOLUNTEER]: [
    { to: "/volunteer-home", label: "Dashboard" },
    { to: "/volunteer-opportunities", label: "Opportunities" },
    { to: "/contact", label: "Contact" },
  ],
  [ROLES.ADMIN]: [
    { to: "/admin-dashboard", label: "Dashboard" },
    { to: "/volunteer-opportunities", label: "Opportunities" },
  ],
};

const EDITION = {
  [ROLES.USER]: "Resident edition",
  [ROLES.VOLUNTEER]: "Volunteer edition",
  [ROLES.ADMIN]: "Moderator's desk",
};

const popover = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.16 },
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Morning edition (light)" : "Evening edition (dark)"}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
};

const Notifications = ({ session }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { items, unread, isUnread, markAllRead, refresh } = useNotifications(session);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const toggle = () => {
    if (!open) refresh();
    setOpen((o) => !o);
  };

  return (
    <div className="popover-anchor" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={toggle}
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={19} />
        {unread.length > 0 && <span className="notif-dot">{unread.length > 9 ? "9+" : unread.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="popover popover--notif" {...popover}>
            <div className="popover__head">
              <strong className="serif">Notices</strong>
              {unread.length > 0 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={markAllRead}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="popover__empty">Nothing new. You're all caught up.</p>
            ) : (
              <ul className="notif-list">
                {items.map((n) => (
                  <li key={n.key}>
                    <Link to={n.to} className={`notif ${isUnread(n) ? "is-unread" : ""}`} onClick={close}>
                      <span className={`notif__pip notif__pip--${n.tone}`} aria-hidden="true" />
                      <span className="notif__text">
                        <span className="notif__title">{n.title}</span>
                        <span className="notif__body">{n.body}</span>
                      </span>
                      {isUnread(n) && <span className="sr-only">(unread)</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserMenu = ({ session, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div className="popover-anchor user-menu" ref={ref}>
      <button type="button" className="user-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
        <Avatar person={session} size="sm" />
        <span className="user-chip__text">
          <span className="user-chip__name">{session.firstName || "Account"}</span>
          <span className="user-chip__role">{ROLE_LABELS[session.role]}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="popover popover--menu" {...popover}>
            <div className="popover__who">
              <strong>
                {session.firstName} {session.lastName}
              </strong>
              <span>{session.email}</span>
            </div>
            <Link to="/user-profile" className="menu-item" onClick={close}>
              <UserRound size={16} /> Your profile
            </Link>
            <button type="button" className="menu-item" onClick={onLogout}>
              <LogOut size={16} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Header = () => {
  const session = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const links = session ? NAV[session.role] || [] : [];
  const isResident = session?.role === ROLES.USER;

  return (
    <header className="masthead">
      <div className="dateline">
        <div className="container dateline__inner">
          <span>{longDate()}</span>
          <span className="dateline__motto">Neighbors helping neighbors</span>
          <span>{session ? EDITION[session.role] : "Free for everyone, always"}</span>
        </div>
      </div>

      <div className="masthead__bar">
        <div className="container masthead__inner">
          <Logo to={session ? homePathFor(session.role) : "/"} />

          {session && (
            <nav className="mainnav" aria-label="Main">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="mainnav__link">
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="masthead__actions">
            {isResident && (
              <Link to="/user-request" className="btn btn--primary btn--sm masthead__cta">
                <PlusCircle size={16} /> Ask for help
              </Link>
            )}
            <ThemeToggle />
            {session ? (
              <>
                <Notifications session={session} />
                <UserMenu session={session} onLogout={handleLogout} />
                <button
                  type="button"
                  className="icon-btn masthead__burger"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-nav"
                >
                  {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">
                  Log in
                </Link>
                <Link to="/register" className="btn btn--ink btn--sm">
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {session && menuOpen && (
          <motion.nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Main"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="container mobile-nav__inner">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="mobile-nav__link">
                  {l.label}
                </NavLink>
              ))}
              {isResident && (
                <NavLink to="/user-request" className="mobile-nav__link">
                  Ask for help
                </NavLink>
              )}
              <NavLink to="/user-profile" className="mobile-nav__link">
                Your profile
              </NavLink>
              <button type="button" className="mobile-nav__link" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
