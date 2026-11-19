# @flxra/tokens

Design tokens for [Flxra](https://github.com/cheesebuhrger/flxra), as CSS custom properties (`--flxra-*`).

> **Status:** pre-release (`0.x`).

```sh
npm install @flxra/tokens
```

Import once at your app's root (before `@flxra/ui/styles.css` if you use it):

```ts
import "@flxra/tokens/tokens.css";
```

```css
.card {
  padding: var(--flxra-space-1);
}
```

## License

MIT
