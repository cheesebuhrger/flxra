import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Disclosure, VisuallyHidden } from "@flxra/ui";
import "@flxra/tokens/tokens.css";
import "@flxra/ui/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <button type="button">
      ✕<VisuallyHidden>Close dialog</VisuallyHidden>
    </button>
    <Disclosure summary="More">Disclosure content</Disclosure>
  </StrictMode>,
);
