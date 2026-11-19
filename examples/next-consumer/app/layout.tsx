import type { ReactNode } from "react";
import "@flxra/tokens/tokens.css";
import "@flxra/ui/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
