import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { UNAUTHORIZED_EVENT, errorMessage } from "../lib/api";
import { SESSION_EVENT, clearSession, getSession } from "../lib/auth";
import Dialog from "../components/ui/Dialog";

/* ---------- Toasts ---------- */

const ToastContext = createContext(null);

/**
 * const toast = useToast();
 * toast("Saved");  toast("Failed", { tone: "error" });
 * toast.undoable({ message, commit, undo })  // optimistic change; `commit` runs after the undo window.
 */
export const useToast = () => useContext(ToastContext);

const TOAST_ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };
const UNDO_WINDOW = 5000;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = "success", action, duration } = {}) => {
      const id = ++nextId.current;
      const ms = duration ?? (tone === "error" ? 6000 : 4000);
      setToasts((list) => [...list.slice(-3), { id, message, tone, action, ms }]);
      timers.current.set(id, setTimeout(() => dismiss(id), ms));
      return id;
    },
    [dismiss]
  );

  const undoable = useCallback(
    ({ message, commit, undo, errorFallback = "That didn't work. Your change was undone." }) => {
      let settled = false;
      const settle = () => {
        settled = true;
        window.removeEventListener("pagehide", run);
      };
      async function run() {
        if (settled) return;
        settle();
        try {
          await commit();
        } catch (err) {
          undo();
          push(errorMessage(err, errorFallback), { tone: "error" });
        }
      }
      const id = ++nextId.current;
      setToasts((list) => [
        ...list.slice(-3),
        {
          id,
          message,
          tone: "success",
          ms: UNDO_WINDOW,
          // Closing the toast early means "keep the change": send it now.
          onClose: run,
          action: {
            label: "Undo",
            onClick: () => {
              if (settled) return;
              settle();
              undo();
            },
          },
        },
      ]);
      timers.current.set(
        id,
        setTimeout(() => {
          dismiss(id);
          run();
        }, UNDO_WINDOW)
      );
      // If the tab closes inside the undo window, still send the change.
      window.addEventListener("pagehide", run);
    },
    [dismiss, push]
  );

  const value = useMemo(() => Object.assign((msg, opts) => push(msg, opts), { undoable }), [push, undoable]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = TOAST_ICONS[t.tone] || Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.16 } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`toast toast--${t.tone}`}
                role={t.tone === "error" ? "alert" : "status"}
              >
                <Icon size={16} className="toast__icon" aria-hidden="true" />
                <span className="toast__msg">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    className="toast__action"
                    onClick={() => {
                      t.action.onClick();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => {
                    t.onClose?.();
                    dismiss(t.id);
                  }}
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
                <span className="toast__timer" style={{ animationDuration: `${t.ms}ms` }} aria-hidden="true" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

/* ---------- Session ---------- */

const SessionContext = createContext(null);

export const useSession = () => useContext(SessionContext);

const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(getSession);
  const toast = useToast();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    const sync = () => setSession(getSession());
    const expired = () => {
      if (!sessionRef.current) return;
      clearSession();
      toast("Your session ended. Please log in again.", { tone: "info" });
    };
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener(UNAUTHORIZED_EVENT, expired);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener(UNAUTHORIZED_EVENT, expired);
    };
  }, [toast]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};

/* ---------- Theme ---------- */

const ThemeContext = createContext(null);

/** { preference: "light" | "dark" | "system", theme: resolved "light" | "dark", setPreference, toggle } */
export const useTheme = () => useContext(ThemeContext);

const THEME_KEY = "na.theme";
const darkQuery = () => window.matchMedia?.("(prefers-color-scheme: dark)");

const readPreference = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
};

const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(() => !!darkQuery()?.matches);

  useEffect(() => {
    const mq = darkQuery();
    if (!mq) return undefined;
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#09090c" : "#f6f6f8");
  }, [theme]);

  useEffect(() => {
    try {
      if (preference === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  }, [preference]);

  const value = useMemo(
    () => ({
      preference,
      theme,
      setPreference,
      toggle: () => setPreference(theme === "dark" ? "light" : "dark"),
    }),
    [preference, theme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/* ---------- Confirm dialog ---------- */

const ConfirmContext = createContext(null);

/**
 * const confirm = useConfirm();
 * if (await confirm({ title, body, confirmLabel, tone: "danger" })) { ... }
 */
export const useConfirm = () => useContext(ConfirmContext);

const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ ...options, resolve });
      }),
    []
  );

  const close = (result) => {
    request?.resolve(result);
    setRequest(null);
  };

  const tone = request?.tone || "danger";
  const Icon = request?.icon || AlertTriangle;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!request} onClose={() => close(false)} labelledBy="confirm-title" describedBy="confirm-text">
        {request && (
          <>
            <div className="dialog__body">
              <span className={`dialog__icon ${tone === "danger" ? "" : "dialog__icon--accent"}`} aria-hidden="true">
                <Icon size={18} />
              </span>
              <div>
                <h2 className="dialog__title" id="confirm-title">
                  {request.title}
                </h2>
                <div className="dialog__text" id="confirm-text">
                  {request.body}
                </div>
              </div>
            </div>
            <div className="dialog__foot">
              <button type="button" className="btn" onClick={() => close(false)}>
                {request.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                className={`btn ${tone === "danger" ? "btn--danger-solid" : "btn--primary"}`}
                onClick={() => close(true)}
                data-autofocus
              >
                {request.confirmLabel || "Confirm"}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const AppProviders = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>
      <SessionProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </SessionProvider>
    </ToastProvider>
  </ThemeProvider>
);
