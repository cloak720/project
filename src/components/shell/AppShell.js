import React, { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Menu, Moon, PanelLeft, Search, Sun } from "lucide-react";
import { ROLES, ROLE_LABELS, homePathFor, logout } from "../../lib/auth";
import { fullName } from "../../lib/format";
import { useHotkeys } from "../../lib/hooks";
import { useSession, useTheme } from "../../context/AppContext";
import { Logo } from "../art/Logo";
import { Avatar, Kbd, PageFallback } from "../ui";
import CommandPalette from "./CommandPalette";
import ShortcutsDialog from "./ShortcutsDialog";
import { NotificationsMenu, UserMenu } from "./Menus";
import { NAV, PRIMARY_ACTION, navItemsFor, titleFor } from "./nav";
import { useShellData } from "./useShellData";

const ShellContext = createContext({ refresh: () => {}, counts: {} });

/** Pages call `useShell().refresh()` after changes that affect sidebar counts or notifications. */
export const useShell = () => useContext(ShellContext);

const COLLAPSE_KEY = "na.sidebar.collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

const Sidebar = ({ session, counts, open, collapsed, onToggleCollapse, onSearch }) => {
  const primary = PRIMARY_ACTION[session.role];
  const isAdmin = session.role === ROLES.ADMIN;
  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Sidebar">
      <div className="sidebar__top">
        <Link to={homePathFor(session.role)} className="brand" aria-label="NeighborAid home">
          <Logo size={26} />
        </Link>
        <button
          type="button"
          className="icon-btn sidebar__collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar ( [ )" : "Collapse sidebar ( [ )"}
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <button type="button" className="sidebar__search" onClick={onSearch} aria-label="Open command menu" title="Search">
        <Search size={15} aria-hidden="true" />
        <span className="sidebar__search-text">Search or jump to…</span>
        <Kbd keys={["mod", "K"]} />
      </button>

      <nav aria-label="Main">
        {(NAV[session.role] || []).map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group__label">{group.label}</div>
            {group.items.map((item) => {
              const count = item.badge ? counts[item.badge] : undefined;
              return (
                <NavLink key={item.to} to={item.to} end={item.end} className="nav-link" title={collapsed ? item.label : undefined}>
                  <item.icon size={16} aria-hidden="true" />
                  <span className="nav-link__text">{item.label}</span>
                  {count > 0 ? (
                    <span className="nav-link__count" aria-label={`${count} items`}>
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : (
                    <span className="nav-link__key">
                      <Kbd keys={item.keys.toUpperCase().split(" ")} />
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__bottom">
        {primary && (
          <div className="sidebar__cta">
            <strong>{isAdmin ? "Rally volunteers" : "Need a hand?"}</strong>
            <p>{isAdmin ? "Publish a community project people can join." : "Post a request and neighbors nearby will see it."}</p>
            <Link to={primary.to} className="btn btn--primary btn--sm btn--block">
              <primary.icon size={14} /> {primary.label}
              <kbd className="kbd--on-accent">N</kbd>
            </Link>
          </div>
        )}
        <Link to="/profile" className="sidebar__user" title={collapsed ? fullName(session) : undefined}>
          <Avatar person={{ ...session, id: session.userId }} />
          <span className="sidebar__user-text">
            <span className="sidebar__user-name">{fullName(session, "Your profile")}</span>
            <span className="sidebar__user-role">{ROLE_LABELS[session.role]}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
};

/** Signed-in layout: sidebar, topbar, command palette and global shortcuts around the page. */
const AppShell = () => {
  const session = useSession();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const shell = useShellData(session);
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // Preference only; ignore storage failures.
    }
  }, [collapsed]);

  const toggleSidebar = useCallback(() => setCollapsed((c) => !c), []);
  const showShortcuts = useCallback(() => setShortcuts(true), []);
  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [navigate]);

  const bindings = useMemo(() => {
    const map = {
      "mod+k": () => {
        setShortcuts(false);
        setPalette((o) => !o);
      },
      "?": showShortcuts,
      t: toggle,
      "[": toggleSidebar,
      "/": () => document.querySelector("[data-page-search]")?.focus(),
    };
    navItemsFor(session.role).forEach((i) => {
      map[i.keys] = () => navigate(i.to);
    });
    const primary = PRIMARY_ACTION[session.role];
    if (primary) map.n = () => navigate(primary.to);
    return map;
  }, [session.role, navigate, toggle, toggleSidebar, showShortcuts]);

  useHotkeys(bindings);

  const title = titleFor(session.role, pathname);
  const ctx = useMemo(() => ({ refresh: shell.refresh, counts: shell.counts }), [shell.refresh, shell.counts]);

  return (
    <ShellContext.Provider value={ctx}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className={`shell ${collapsed ? "is-collapsed" : ""}`}>
        <Sidebar
          session={session}
          counts={shell.counts}
          open={drawer}
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
          onSearch={() => setPalette(true)}
        />
        {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}

        <div className="shell__main">
          <header className="topbar">
            <button
              type="button"
              className="icon-btn topbar__menu"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              aria-expanded={drawer}
            >
              <Menu size={18} />
            </button>
            <Link to={homePathFor(session.role)} className="brand topbar__brand" aria-label="NeighborAid home">
              <Logo size={24} />
            </Link>
            <nav className="crumbs" aria-label="Breadcrumb">
              <span>{ROLE_LABELS[session.role]}</span>
              <ChevronRight size={14} aria-hidden="true" />
              <span className="crumbs__current" aria-current="page">
                {title}
              </span>
            </nav>
            <div className="topbar__actions">
              <button type="button" className="icon-btn" onClick={() => setPalette(true)} aria-label="Search (Ctrl+K)" title="Search">
                <Search size={17} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={toggle}
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                title="Toggle theme (T)"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <NotificationsMenu shell={shell} />
              <UserMenu session={session} onShortcuts={showShortcuts} onLogout={handleLogout} />
            </div>
          </header>

          <main id="main" className="content" tabIndex={-1}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        session={session}
        onToggleSidebar={toggleSidebar}
        onShowShortcuts={showShortcuts}
        onLogout={handleLogout}
      />
      <ShortcutsDialog open={shortcuts} onClose={() => setShortcuts(false)} role={session.role} />
    </ShellContext.Provider>
  );
};

export default AppShell;
