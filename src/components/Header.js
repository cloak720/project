import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Sun, X, CheckCheck } from "lucide-react";
import api from "../lib/api";
import { logout, ROLES, ROLE_LABELS, homePathFor } from "../lib/auth";
import { initials, normStatus } from "../lib/format";
import { useSession, useTheme } from "../context/AppContext";
import logo from "../images/footerlogo.png";
import "./Header.css";

const NAV = {
  [ROLES.USER]: [
    { to: "/", label: "Home", end: true },
    { to: "/my-requests", label: "My requests" },
    { to: "/user-request", label: "Ask for help" },
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

const seenKey = (userId) => `notif-seen-${userId}`;

/** Builds notifications from data the backend already has: admin replies and request status changes. */
const useNotifications = (session) => {
  const [items, setItems] = useState([]);
  const [seen, setSeen] = useState([]);

  useEffect(() => {
    if (!session) return;
    try {
      setSeen(JSON.parse(localStorage.getItem(seenKey(session.userId))) || []);
    } catch {
      setSeen([]);
    }
  }, [session]);

  const load = useCallback(async () => {
    if (!session) return setItems([]);
    const jobs = [api.get("/contact/mine").then((r) => r.data).catch(() => [])];
    if (session.role === ROLES.USER) jobs.push(api.get("/requests/user").then((r) => r.data).catch(() => []));
    const [messages, requests = []] = await Promise.all(jobs);

    const replies = (Array.isArray(messages) ? messages : [])
      .filter((m) => m.reply && m.reply.trim())
      .map((m) => ({ key: `msg-${m.id}`, title: `Reply: ${m.subject || "your message"}`, body: m.reply, to: "/contact" }));

    const updates = (Array.isArray(requests) ? requests : [])
      .filter((r) => ["ACCEPTED", "COMPLETED"].includes(normStatus(r.status)))
      .map((r) => {
        const done = normStatus(r.status) === "COMPLETED";
        const who = r.volunteer ? r.volunteer.firstName : "A volunteer";
        return {
          key: `req-${r.id}-${normStatus(r.status)}`,
          title: done ? `"${r.requestType}" is complete` : `"${r.requestType}" was accepted`,
          body: done ? `${who} marked it done. You can leave them feedback.` : `${who} is on it.`,
          to: `/my-requests?highlight=${r.id}`,
        };
      });

    setItems([...updates, ...replies]);
  }, [session]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const markAllRead = () => {
    const keys = Array.from(new Set([...seen, ...items.map((i) => i.key)]));
    setSeen(keys);
    localStorage.setItem(seenKey(session.userId), JSON.stringify(keys));
  };

  const unread = items.filter((i) => !seen.includes(i.key));
  return { items, unread, isUnread: (i) => !seen.includes(i.key), markAllRead };
};

const useClickOutside = (ref, onOutside) => {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
};

const Header = () => {
  const session = useSession();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const { items, unread, isUnread, markAllRead } = useNotifications(session);

  const closeNotif = useCallback(() => setNotifOpen(false), []);
  useClickOutside(notifRef, closeNotif);

  // Close menus whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = session ? NAV[session.role] || [] : [];

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <Link to={session ? homePathFor(session.role) : "/"} className="brand">
          <img src={logo} alt="" width="34" height="34" />
          <span>
            Neighbor<b>Aid</b>
          </span>
        </Link>

        {session && (
          <nav className={`topbar__nav ${menuOpen ? "is-open" : ""}`} aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="topbar__link">
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/user-profile" className="topbar__link topbar__link--mobile">
              Profile
            </NavLink>
            <button type="button" className="topbar__link topbar__link--mobile" onClick={handleLogout}>
              Log out
            </button>
          </nav>
        )}

        <div className="topbar__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {session ? (
            <>
              <div className="notif" ref={notifRef}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
                  aria-expanded={notifOpen}
                >
                  <Bell size={18} />
                  {unread.length > 0 && <span className="notif__dot">{unread.length > 9 ? "9+" : unread.length}</span>}
                </button>
                {notifOpen && (
                  <div className="notif__panel">
                    <div className="notif__head">
                      <strong>Notifications</strong>
                      {unread.length > 0 && (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={markAllRead}>
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>
                    {items.length === 0 ? (
                      <p className="notif__empty">You're all caught up.</p>
                    ) : (
                      <ul className="notif__list">
                        {items.map((n) => (
                          <li key={n.key}>
                            <Link to={n.to} className={`notif__item ${isUnread(n) ? "is-unread" : ""}`}>
                              <span className="notif__title">{n.title}</span>
                              <span className="notif__body">{n.body}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <NavLink to="/user-profile" className="user-chip" title="Your profile">
                <span className="avatar">{initials(session)}</span>
                <span className="user-chip__text">
                  <span className="user-chip__name">{session.firstName || "Profile"}</span>
                  <span className="user-chip__role">{ROLE_LABELS[session.role]}</span>
                </span>
              </NavLink>

              <button type="button" className="icon-btn topbar__logout" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>

              <button
                type="button"
                className="icon-btn topbar__menu"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle navigation"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
