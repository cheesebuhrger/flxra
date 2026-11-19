# Flxra

A design system: CSS-variable design tokens and React components.

> **Status:** pre-release (`0.x`). The API will change between minor versions.

## Packages

| Package | What it is |
| --- | --- |
| [`@flxra/tokens`](packages/tokens) | Design tokens as CSS custom properties (`--flxra-*`) |
| [`@flxra/ui`](packages/ui) | React components |

## Install

```sh
npm install @flxra/tokens @flxra/ui
```

Import the stylesheets once, at your app's root, **tokens first**:

```ts
import "@flxra/tokens/tokens.css";
import "@flxra/ui/styles.css";
```

- **Next.js (App Router):** in `app/layout.tsx`.
- **Vite:** in `src/main.tsx`.

Then use the components:

```tsx
import { Disclosure, VisuallyHidden } from "@flxra/ui";
```

React 19 is required.

## Docs

Coming soon on a Vercel URL.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
