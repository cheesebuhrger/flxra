import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "@flxra/tokens/tokens.css";
import "@flxra/ui/styles.css";
import "./docs.css";

export const metadata: Metadata = {
  title: { default: "Flxra", template: "%s · Flxra" },
  description: "Flxra design system: tokens and React components.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav aria-label="Main">
          <Link href="/">Flxra</Link>
          <Link href="/components/disclosure">Disclosure</Link>
          <Link href="/components/visually-hidden">VisuallyHidden</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
