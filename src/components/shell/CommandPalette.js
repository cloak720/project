import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CornerDownLeft,
  FileText,
  Keyboard,
  LogOut,
  Monitor,
  Moon,
  PanelLeft,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { getList } from "../../lib/api";
import { ROLES } from "../../lib/auth";
import { fullName } from "../../lib/format";
import { useTheme } from "../../context/AppContext";
import Dialog from "../ui/Dialog";
import { Kbd } from "../ui";
import { PRIMARY_ACTION, navItemsFor } from "./nav";

/** Records worth jumping to, per role. Loaded the first time the palette opens. */
const RECORD_SOURCES = {
  [ROLES.RESIDENT]: [
    { url: "/requests/user", group: "Your requests", icon: FileText, map: (r) => ({ id: r.id, label: r.requestType, hint: r.category, to: `/requests?highlight=${r.id}` }) },
    { url: "/opportunities/available", group: "Opportunities", icon: CalendarDays, map: (o) => ({ id: o.id, label: o.name, hint: o.location, to: `/opportunities?highlight=${o.id}` }) },
  ],
  [ROLES.VOLUNTEER]: [
    { url: "/requests/pending", group: "Open requests", icon: FileText, map: (r) => ({ id: r.id, label: r.requestType, hint: `${r.category || "Request"} · ${r.urgency || ""}`, to: `/board?highlight=${r.id}` }) },
    { url: "/requests/accepted", group: "Your tasks", icon: FileText, map: (r) => ({ id: r.id, label: r.requestType, hint: fullName(r.user, ""), to: `/tasks?highlight=${r.id}` }) },
    { url: "/opportunities/available", group: "Opportunities", icon: CalendarDays, map: (o) => ({ id: o.id, label: o.name, hint: o.location, to: `/opportunities?highlight=${o.id}` }) },
  ],
  [ROLES.ADMIN]: [
    { url: "/user/all", group: "Members", icon: UserRound, map: (u) => ({ id: u.id, label: fullName(u), hint: u.email, to: `/admin/members?highlight=${u.id}` }) },
    { url: "/requests/all", group: "Requests", icon: FileText, map: (r) => ({ id: r.id, label: r.requestType, hint: fullName(r.user, ""), to: `/admin/requests?highlight=${r.id}` }) },
    { url: "/opportunities/all", group: "Opportunities", icon: CalendarDays, map: (o) => ({ id: o.id, label: o.name, hint: o.location, to: `/opportunities?highlight=${o.id}` }) },
  ],
};

/** Score how well `text` matches `q`: prefix > word start > substring > in-order letters. 0 = no match. */
const score = (text, q) => {
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 100 - t.length / 100;
  if (t.includes(` ${q}`)) return 80;
  if (t.includes(q)) return 60;
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 20 : 0;
};

const Highlight = ({ text, q }) => {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
};

const CommandPalette = ({ open, onClose, session, onToggleSidebar, onShowShortcuts, onLogout }) => {
  const navigate = useNavigate();
  const { setPreference, preference } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [records, setRecords] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    // Refresh records each time it opens so jumps are never stale.
    const sources = RECORD_SOURCES[session.role] || [];
    Promise.all(
      sources.map((s) =>
        getList(s.url)
          .then((rows) => rows.map((row) => ({ ...s.map(row), group: s.group, icon: s.icon, key: `${s.group}-${row.id}` })))
          .catch(() => [])
      )
    ).then((groups) => setRecords(groups.flat()));
  }, [open, session.role]);

  const commands = useMemo(() => {
    const go = (to) => () => navigate(to);
    const primary = PRIMARY_ACTION[session.role];
    const list = [
      ...(primary ? [{ key: "primary", group: "Actions", label: primary.label, icon: primary.icon, keys: ["n"], run: go(primary.to) }] : []),
      ...navItemsFor(session.role).map((i) => ({
        key: i.to,
        group: "Go to",
        label: i.label,
        icon: i.icon,
        keys: i.keys.split(" "),
        run: go(i.to),
      })),
      { key: "theme-light", group: "Theme", label: "Light theme", icon: Sun, active: preference === "light", run: () => setPreference("light") },
      { key: "theme-dark", group: "Theme", label: "Dark theme", icon: Moon, active: preference === "dark", run: () => setPreference("dark") },
      { key: "theme-system", group: "Theme", label: "Match system theme", icon: Monitor, active: preference === "system", run: () => setPreference("system") },
      { key: "sidebar", group: "Workspace", label: "Toggle sidebar", icon: PanelLeft, keys: ["["], run: onToggleSidebar },
      { key: "shortcuts", group: "Workspace", label: "Keyboard shortcuts", icon: Keyboard, keys: ["?"], run: onShowShortcuts },
      { key: "logout", group: "Workspace", label: "Log out", icon: LogOut, run: onLogout },
    ];
    return list;
  }, [session.role, navigate, preference, setPreference, onToggleSidebar, onShowShortcuts, onLogout]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    const ranked = commands
      .map((c) => ({ ...c, s: score(`${c.label} ${c.group}`, q) }))
      .filter((c) => c.s > 0);
    // Records only appear once you start typing, so the default list stays short.
    const found = q
      ? (records || [])
          .map((r) => ({ ...r, s: Math.max(score(r.label || "", q), score(r.hint || "", q) * 0.6) }))
          .filter((r) => r.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, 8)
          .map((r) => ({ ...r, run: () => navigate(r.to) }))
      : [];
    const all = q ? [...ranked.sort((a, b) => b.s - a.s), ...found] : ranked;
    // Group while keeping the ranked order of first appearance.
    const groups = [];
    all.forEach((item) => {
      let g = groups.find((x) => x.name === item.group);
      if (!g) groups.push((g = { name: item.group, items: [] }));
      g.items.push(item);
    });
    return groups;
  }, [commands, records, q, navigate]);

  const flat = useMemo(() => results.flatMap((g) => g.items), [results]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(1, flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % Math.max(1, flat.length));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(flat.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(flat[active]);
    }
  };

  let index = -1;

  return (
    <Dialog open={open} onClose={onClose} className="palette" label="Command menu">
      <div className="palette__search">
        <Search size={18} aria-hidden="true" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search pages, actions, people, requests…"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={flat[active] ? `palette-opt-${active}` : undefined}
          aria-label="Search commands"
          autoComplete="off"
          spellCheck="false"
        />
        <Kbd keys={["Esc"]} />
      </div>
      <div className="palette__list" id="palette-list" role="listbox" ref={listRef} aria-label="Results">
        {flat.length === 0 ? (
          <p className="palette__empty">
            {records === null && q ? "Searching…" : <>No results for “{query}”.</>}
          </p>
        ) : (
          results.map((g) => (
            <div key={g.name} role="group" aria-label={g.name}>
              <div className="palette__group" aria-hidden="true">
                {g.name}
              </div>
              {g.items.map((item) => {
                index += 1;
                const i = index;
                const Icon = item.icon || ArrowRight;
                return (
                  <button
                    key={item.key}
                    type="button"
                    id={`palette-opt-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    className="palette__item"
                    onMouseMove={() => active !== i && setActive(i)}
                    onClick={() => choose(item)}
                    tabIndex={-1}
                  >
                    <span className="palette__item-icon" aria-hidden="true">
                      <Icon size={15} />
                    </span>
                    <span className="palette__item-text">
                      <span className="palette__item-label">
                        <Highlight text={item.label || ""} q={q} />
                      </span>
                      {item.hint && <span className="palette__item-hint">{item.hint}</span>}
                    </span>
                    {item.active && <span className="badge badge--accent">Current</span>}
                    {item.keys && <Kbd keys={item.keys.map((k) => k.toUpperCase())} />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
      <div className="palette__foot" aria-hidden="true">
        <span>
          <Kbd keys={["↑", "↓"]} /> Navigate
        </span>
        <span>
          <kbd>
            <CornerDownLeft size={11} />
          </kbd>
          Open
        </span>
        <span style={{ marginLeft: "auto" }}>
          <Kbd keys={["mod", "K"]} /> Toggle
        </span>
      </div>
    </Dialog>
  );
};

export default CommandPalette;
