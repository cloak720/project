import React from "react";
import { X } from "lucide-react";
import Dialog from "../ui/Dialog";
import { Kbd } from "../ui";
import { PRIMARY_ACTION, navItemsFor } from "./nav";

const GENERAL = [
  { label: "Open command menu", keys: ["mod", "K"] },
  { label: "Show this help", keys: ["?"] },
  { label: "Search on this page", keys: ["/"] },
  { label: "Toggle light / dark", keys: ["T"] },
  { label: "Collapse sidebar", keys: ["["] },
];

const ShortcutsDialog = ({ open, onClose, role }) => {
  const primary = PRIMARY_ACTION[role];
  const general = primary ? [{ label: primary.label, keys: ["N"] }, ...GENERAL] : GENERAL;
  return (
    <Dialog open={open} onClose={onClose} className="shortcuts" labelledBy="shortcuts-title">
      <div className="shortcuts__head">
        <h2 id="shortcuts-title" className="dialog__title" style={{ margin: 0 }}>
          Keyboard shortcuts
        </h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" data-autofocus>
          <X size={16} />
        </button>
      </div>
      <div className="shortcuts__grid">
        <section className="shortcuts__section">
          <h3>General</h3>
          {general.map((s) => (
            <div className="shortcuts__row" key={s.label}>
              <span>{s.label}</span>
              <Kbd keys={s.keys} />
            </div>
          ))}
        </section>
        <section className="shortcuts__section">
          <h3>Go to</h3>
          {navItemsFor(role).map((i) => (
            <div className="shortcuts__row" key={i.to}>
              <span>{i.label}</span>
              <Kbd keys={i.keys.toUpperCase().split(" ")} />
            </div>
          ))}
        </section>
      </div>
    </Dialog>
  );
};

export default ShortcutsDialog;
