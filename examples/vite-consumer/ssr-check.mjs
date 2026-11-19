// Renders the installed @flxra/ui with plain Node ESM: no bundler, the way
// test runners, SSR frameworks and scripts load it.
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { Disclosure, VisuallyHidden } from "@flxra/ui";

const html = renderToString(
  h("div", null,
    h(VisuallyHidden, null, "Close dialog"),
    // Disclosure calls useState, so a second copy of React would throw here.
    h(Disclosure, { summary: "More", defaultOpen: true }, "Disclosure content"),
  ),
);

assert.match(html, /class="flxra-VisuallyHidden-root">Close dialog</);
assert.match(html, /aria-expanded="true"/);
assert.match(html, /data-state="open"/);
assert.match(html, /Disclosure content/);
console.log("ssr-check: ok");
