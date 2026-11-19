"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./Disclosure.module.css";

export type DisclosureProps = {
  /** The always-visible button label. */
  summary: ReactNode;
  /** The content shown when open. */
  children: ReactNode;
  defaultOpen?: boolean;
  /** For placement only (margins, grid position); don't restyle internals. */
  className?: string;
};

/** A button that shows and hides a region of content. */
export function Disclosure({ summary, children, defaultOpen = false, className }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const state = open ? "open" : "closed";

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root} data-state={state}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        data-state={state}
        onClick={() => setOpen((o) => !o)}
      >
        {summary}
      </button>
      <div id={panelId} className={styles.panel} data-state={state} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
