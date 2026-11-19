// A Server Component page. Importing Disclosure here only builds if its
// "use client" directive survived packaging.
import { Disclosure, VisuallyHidden } from "@flxra/ui";

export default function Page() {
  return (
    <main>
      <button type="button">
        ✕<VisuallyHidden>Close dialog</VisuallyHidden>
      </button>
      <Disclosure summary="More">Disclosure content</Disclosure>
    </main>
  );
}
