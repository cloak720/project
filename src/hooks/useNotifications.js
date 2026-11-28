import { useCallback, useEffect, useState } from "react";
import { getList } from "../lib/api";
import { ROLES } from "../lib/auth";
import { normStatus } from "../lib/format";

const seenKey = (userId) => `notif-seen-${userId}`;

const readSeen = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(seenKey(userId))) || [];
  } catch {
    return [];
  }
};

const optional = (url) => getList(url).catch(() => []);

const replies = (messages) =>
  messages
    .filter((m) => m.reply && m.reply.trim())
    .map((m) => ({
      key: `msg-${m.id}`,
      tone: "info",
      title: `Reply to “${m.subject || "your message"}”`,
      body: m.reply,
      to: "/contact",
    }));

/** Each role's notifications, derived from data the backend already has. */
const sources = {
  [ROLES.USER]: async () => {
    const [requests, messages] = await Promise.all([optional("/requests/user"), optional("/contact/mine")]);
    const updates = requests
      .filter((r) => ["ACCEPTED", "COMPLETED"].includes(normStatus(r.status)))
      .map((r) => {
        const done = normStatus(r.status) === "COMPLETED";
        const who = r.volunteer?.firstName || "A volunteer";
        return {
          key: `req-${r.id}-${normStatus(r.status)}`,
          tone: done ? "success" : "info",
          title: done ? `“${r.requestType}” is done` : `${who} is helping with “${r.requestType}”`,
          body: done ? `${who} marked it complete. Say thanks with a rating.` : "They'll be in touch using the number you gave.",
          to: `/my-requests?highlight=${r.id}`,
        };
      });
    return [...updates, ...replies(messages)];
  },
  [ROLES.VOLUNTEER]: async (session) => {
    const [reviews, messages] = await Promise.all([optional(`/feedback/volunteer/${session.userId}`), optional("/contact/mine")]);
    const praise = reviews.map((f) => ({
      key: `review-${f.id}`,
      tone: "success",
      title: `A neighbor gave you ${f.rating} star${f.rating === 1 ? "" : "s"}`,
      body: f.comment || "No comment, just stars.",
      to: "/volunteer-home?tab=reviews",
    }));
    return [...praise, ...replies(messages)];
  },
  [ROLES.ADMIN]: async () => {
    const messages = await optional("/contact");
    return messages
      .filter((m) => !m.reply)
      .map((m) => ({
        key: `letter-${m.id}`,
        tone: "warning",
        title: `New message: ${m.subject || "No subject"}`,
        body: `From ${m.name || m.email}. Waiting for a reply.`,
        to: "/admin-dashboard?tab=messages",
      }));
  },
};

/** Notifications for the signed-in person, refreshed every minute and on demand. */
const useNotifications = (session) => {
  const [items, setItems] = useState([]);
  const [seen, setSeen] = useState([]);
  const userId = session?.userId;
  const role = session?.role;

  useEffect(() => {
    setSeen(userId ? readSeen(userId) : []);
  }, [userId]);

  const refresh = useCallback(async () => {
    const source = sources[role];
    if (!userId || !source) return setItems([]);
    setItems(await source({ userId }));
  }, [userId, role]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

  const markAllRead = () => {
    const keys = Array.from(new Set([...seen, ...items.map((i) => i.key)]));
    setSeen(keys);
    try {
      localStorage.setItem(seenKey(userId), JSON.stringify(keys));
    } catch {
      // Read state just won't persist across reloads.
    }
  };

  const unread = items.filter((i) => !seen.includes(i.key));
  return { items, unread, isUnread: (i) => !seen.includes(i.key), markAllRead, refresh };
};

export default useNotifications;
