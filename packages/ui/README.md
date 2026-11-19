# @flxra/ui

React components for [Flxra](https://github.com/cheesebuhrger/flxra).

> **Status:** pre-release (`0.x`). The API will change between minor versions.

```sh
npm install @flxra/ui @flxra/tokens
```

Import the stylesheets once, at your app's root, tokens first:

```ts
import "@flxra/tokens/tokens.css";
import "@flxra/ui/styles.css";
```

```tsx
import { Disclosure, VisuallyHidden } from "@flxra/ui";

<Disclosure summary="Details">Hidden until opened.</Disclosure>
```

Requires React 19. Works in Next.js (App Router and Server Components) and Vite.

## License

MIT
