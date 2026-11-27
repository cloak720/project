import React, { useEffect, useRef } from "react";

/**
 * Modal built on the native <dialog> element, which gives us a focus trap, the top layer
 * and Escape handling for free. Clicking the backdrop closes it. The element marked
 * data-autofocus (or the first focusable one) receives focus on open, and focus returns
 * to whatever was focused before when it closes.
 */
const Dialog = ({ open, onClose, children, className = "", labelledBy, describedBy, label }) => {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (open && !el.open) {
      const previous = document.activeElement;
      el.showModal();
      const target = el.querySelector("[data-autofocus]");
      if (target) target.focus();
      return () => {
        if (el.open) el.close();
        if (previous && typeof previous.focus === "function") previous.focus();
      };
    }
    if (!open && el.open) el.close();
    return undefined;
  }, [open]);

  const onCancel = (e) => {
    e.preventDefault();
    onCloseRef.current();
  };

  // A click whose target is the <dialog> itself landed on the backdrop.
  const onMouseDown = (e) => {
    if (e.target === ref.current) onCloseRef.current();
  };

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      onCancel={onCancel}
      onMouseDown={onMouseDown}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={label}
    >
      {open && children}
    </dialog>
  );
};

export default Dialog;
