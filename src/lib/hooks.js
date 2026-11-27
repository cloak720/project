import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { errorMessage } from "./api";

/**
 * Loads data with `fetcher` and keeps loading / error state alongside it.
 * `setData` allows optimistic updates; `reload` refetches without blanking the current data.
 */
export const useResource = (fetcher, deps = []) => {
  const [state, setState] = useState({ data: undefined, error: "", loading: true });
  const alive = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await run();
      if (alive.current) setState({ data, error: "", loading: false });
      return data;
    } catch (err) {
      if (alive.current) setState((s) => ({ ...s, error: errorMessage(err, "Couldn't load this page."), loading: false }));
      return undefined;
    }
  }, [run]);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);

  const setData = useCallback((update) => {
    setState((s) => ({ ...s, data: typeof update === "function" ? update(s.data) : update }));
  }, []);

  return { ...state, reload, setData };
};

/** Updates the tab title, e.g. "My requests · NeighborAid". */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · NeighborAid` : "NeighborAid · Help from people next door";
  }, [title]);
};

/** Closes a popover on outside click or Escape, and returns focus to its trigger on Escape. */
export const useDismiss = (open, onClose, refs) => {
  useEffect(() => {
    if (!open) return undefined;
    const inside = (target) => refs.some((r) => r.current && r.current.contains(target));
    const onDown = (e) => !inside(e.target) && onClose();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose(true);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, refs]);
};

export const useMediaQuery = (query) => {
  const get = () => window.matchMedia?.(query).matches ?? false;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
};

const isTyping = (el) =>
  el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Global keyboard shortcuts.
 * Keys: "mod+k" (Ctrl or Cmd), "?", "/", "t", and two-key sequences like "g h".
 * Plain keys are ignored while typing in a field; "mod+" combos always fire.
 */
export const useHotkeys = (bindings, enabled = true) => {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!enabled) return undefined;
    let pending = null;
    let timer = null;

    const onKey = (e) => {
      if (e.defaultPrevented || e.repeat) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const mod = e.metaKey || e.ctrlKey;
      const map = ref.current;

      if (mod && !e.altKey) {
        const fn = map[`mod+${key}`];
        if (fn) {
          e.preventDefault();
          fn(e);
        }
        return;
      }
      if (e.altKey || isTyping(e.target) || document.querySelector("dialog[open]")) return;

      const combo = pending ? `${pending} ${key}` : null;
      clearTimeout(timer);
      if (combo && map[combo]) {
        pending = null;
        e.preventDefault();
        map[combo](e);
        return;
      }
      pending = null;
      const single = e.key === "?" ? "?" : key;
      if (map[single]) {
        e.preventDefault();
        map[single](e);
        return;
      }
      if (Object.keys(map).some((k) => k.startsWith(`${key} `))) {
        pending = key;
        timer = setTimeout(() => (pending = null), 900);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [enabled]);
};

/**
 * Reads ?highlight=<id> and, once the list has rendered, scrolls the matching
 * element (id="item-<id>") into view. Returns the highlighted id as a string.
 */
export const useHighlight = (ready) => {
  const [params] = useSearchParams();
  const id = params.get("highlight");
  useEffect(() => {
    if (!id || !ready) return;
    const el = document.getElementById(`item-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [id, ready]);
  return id;
};
