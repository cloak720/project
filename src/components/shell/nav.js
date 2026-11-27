import {
  ClipboardCheck,
  Gauge,
  HandHeart,
  Inbox,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  PlusCircle,
  Sparkles,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { ROLES } from "../../lib/auth";

/**
 * Navigation per role. `keys` is the two-key "go to" shortcut (e.g. G then R) and `badge`
 * names a live count the shell provides. The same config feeds the sidebar, the command
 * palette and the shortcuts sheet, so they never drift apart.
 */
export const NAV = {
  [ROLES.RESIDENT]: [
    {
      label: "Neighborhood",
      items: [
        { to: "/home", label: "Overview", icon: LayoutDashboard, keys: "g h" },
        { to: "/requests", label: "My requests", icon: ListTodo, keys: "g r", badge: "activeRequests" },
        { to: "/feedback", label: "Rate volunteers", icon: Star, keys: "g f", badge: "toRate" },
        { to: "/opportunities", label: "Opportunities", icon: Sparkles, keys: "g o" },
      ],
    },
    {
      label: "Account",
      items: [
        { to: "/messages", label: "Messages", icon: MessagesSquare, keys: "g m" },
        { to: "/profile", label: "Profile", icon: UserRound, keys: "g p" },
      ],
    },
  ],
  [ROLES.VOLUNTEER]: [
    {
      label: "Volunteer",
      items: [
        { to: "/board", label: "Request board", icon: HandHeart, keys: "g h", badge: "openRequests" },
        { to: "/tasks", label: "My tasks", icon: ClipboardCheck, keys: "g t", badge: "activeTasks" },
        { to: "/opportunities", label: "Opportunities", icon: Sparkles, keys: "g o" },
      ],
    },
    {
      label: "Account",
      items: [
        { to: "/messages", label: "Messages", icon: MessagesSquare, keys: "g m" },
        { to: "/profile", label: "Profile", icon: UserRound, keys: "g p" },
      ],
    },
  ],
  [ROLES.ADMIN]: [
    {
      label: "Moderation",
      items: [
        { to: "/admin", label: "Overview", icon: Gauge, keys: "g h", end: true },
        { to: "/admin/requests", label: "Requests", icon: ListTodo, keys: "g r" },
        { to: "/admin/members", label: "Members", icon: Users, keys: "g u" },
        { to: "/opportunities", label: "Opportunities", icon: Sparkles, keys: "g o" },
        { to: "/admin/inbox", label: "Inbox", icon: Inbox, keys: "g i", badge: "unanswered" },
        { to: "/admin/feedback", label: "Feedback", icon: Star, keys: "g f" },
      ],
    },
    {
      label: "Account",
      items: [{ to: "/profile", label: "Profile", icon: UserRound, keys: "g p" }],
    },
  ],
};

/** The primary "create" action per role, bound to the N key. */
export const PRIMARY_ACTION = {
  [ROLES.RESIDENT]: { to: "/requests/new", label: "New request", icon: PlusCircle },
  [ROLES.ADMIN]: { to: "/admin/opportunities/new", label: "New opportunity", icon: PlusCircle },
};

export const navItemsFor = (role) => (NAV[role] || []).flatMap((g) => g.items);

/** Title for the current path, used in the topbar breadcrumb. */
export const titleFor = (role, pathname) => {
  const items = navItemsFor(role);
  const exact = items.find((i) => i.to === pathname);
  if (exact) return exact.label;
  if (pathname === "/requests/new") return "New request";
  if (pathname === "/admin/opportunities/new") return "New opportunity";
  if (/^\/admin\/opportunities\/\d+\/edit$/.test(pathname)) return "Edit opportunity";
  const prefix = items.filter((i) => pathname.startsWith(i.to) && i.to !== "/admin").sort((a, b) => b.to.length - a.to.length)[0];
  return prefix?.label || "";
};
