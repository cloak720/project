import { useCallback, useEffect, useMemo, useState } from "react";
import { getList } from "../../lib/api";
import { ROLES } from "../../lib/auth";
import { normStatus } from "../../lib/format";

const seenKey = (userId) => `na.seen.${userId}`;
const POLL_MS = 60000;

const readSeen = (userId) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(userId))) || []);
  } catch {
    return new Set();
  }
};

const safe = (p) => p.catch(() => null);

/** Fetches what each role needs for sidebar counts and notifications. */
const loadFor = async (session) => {
  const { role, userId } = session;
  if (role === ROLES.ADMIN) {
    const messages = (await safe(getList("/contact"))) || [];
    const open = messages.filter((m) => !m.reply?.trim());
    return {
      counts: { unanswered: open.length },
      items: open.map((m) => ({
        key: `inbox-${m.id}`,
        kind: "message",
        title: `New message: ${m.subject || "No subject"}`,
        body: `${m.name || m.email} is waiting for a reply.`,
        to: `/admin/inbox?highlight=${m.id}`,
      })),
    };
  }

  const replies = ((await safe(getList("/contact/mine"))) || [])
    .filter((m) => m.reply?.trim())
    .map((m) => ({
      key: `reply-${m.id}-${m.reply.length}`,
      kind: "reply",
      title: `Reply: ${m.subject || "your message"}`,
      body: m.reply,
      to: `/messages?highlight=${m.id}`,
    }));

  if (role === ROLES.VOLUNTEER) {
    const [pending, accepted] = await Promise.all([safe(getList("/requests/pending")), safe(getList("/requests/accepted"))]);
    const urgent = (pending || [])
      .filter((r) => r.urgency === "High")
      .map((r) => ({
        key: `urgent-${r.id}`,
        kind: "urgent",
        title: `Urgent: ${r.requestType}`,
        body: `${r.user?.firstName || "A neighbor"} needs help ${r.category ? `(${r.category.toLowerCase()})` : ""}.`,
        to: `/board?highlight=${r.id}`,
      }));
    return {
      counts: {
        openRequests: pending ? pending.length : undefined,
        activeTasks: accepted ? accepted.filter((r) => normStatus(r.status) === "ACCEPTED").length : undefined,
      },
      items: [...urgent, ...replies],
    };
  }

  const [requests, given] = await Promise.all([safe(getList("/requests/user")), safe(getList(`/feedback/user/${userId}`))]);
  const list = requests || [];
  const rated = new Set((given || []).map((f) => String(f.volunteerId)));
  const toRate = new Set(
    list
      .filter((r) => normStatus(r.status) === "COMPLETED" && r.volunteer && !rated.has(String(r.volunteer.id)))
      .map((r) => r.volunteer.id)
  );
  const updates = list
    .filter((r) => ["ACCEPTED", "COMPLETED"].includes(normStatus(r.status)))
    .map((r) => {
      const done = normStatus(r.status) === "COMPLETED";
      const who = r.volunteer?.firstName || "A volunteer";
      return {
        key: `req-${r.id}-${normStatus(r.status)}`,
        kind: done ? "done" : "accepted",
        title: done ? `“${r.requestType}” is done` : `${who} accepted “${r.requestType}”`,
        body: done ? `${who} marked it complete. Leave a rating?` : `${who} will be in touch to arrange it.`,
        to: done && r.volunteer ? `/feedback?volunteer=${r.volunteer.id}` : `/requests?highlight=${r.id}`,
      };
    });
  return {
    counts: {
      activeRequests: requests ? list.filter((r) => normStatus(r.status) !== "COMPLETED").length : undefined,
      // Only show the "to rate" count when we could check what was already rated.
      toRate: given ? toRate.size : undefined,
    },
    items: [...updates.reverse(), ...replies],
  };
};

export const useShellData = (session) => {
  const [data, setData] = useState({ counts: {}, items: [] });
  const [seen, setSeen] = useState(() => readSeen(session.userId));

  const refresh = useCallback(async () => {
    setData(await loadFor(session));
  }, [session]);

  useEffect(() => {
    setSeen(readSeen(session.userId));
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const onFocus = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh, session.userId]);

  const markAllRead = useCallback(() => {
    setSeen((prev) => {
      const next = new Set([...prev, ...data.items.map((i) => i.key)]);
      try {
        localStorage.setItem(seenKey(session.userId), JSON.stringify([...next].slice(-300)));
      } catch {
        // Not critical: the dot simply comes back next visit.
      }
      return next;
    });
  }, [data.items, session.userId]);

  return useMemo(
    () => ({
      counts: data.counts,
      items: data.items,
      unread: data.items.filter((i) => !seen.has(i.key)).length,
      isUnread: (i) => !seen.has(i.key),
      markAllRead,
      refresh,
    }),
    [data, seen, markAllRead, refresh]
  );
};
