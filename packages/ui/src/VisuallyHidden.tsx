import type { ComponentPropsWithoutRef } from "react";
import styles from "./VisuallyHidden.module.css";

export type VisuallyHiddenProps = ComponentPropsWithoutRef<"span">;

/** Hides content visually while keeping it available to screen readers. */
export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return <span {...props} className={className ? `${styles.root} ${className}` : styles.root} />;
}
