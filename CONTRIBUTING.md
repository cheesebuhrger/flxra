# Contributing

## Setup

Use Node 24 (`nvm use` reads `.nvmrc`). It ships with npm 11.

```sh
npm install
npm run dev     # the docs app, with the packages rebuilding on change
npm run build   # build everything
npm run typecheck
```

Run commands from the repo root. Add a dependency to one package with `npm install <pkg> -w @flxra/ui`.

## Repo layout

- `packages/tokens`: `@flxra/tokens`, plain CSS, no build step.
- `packages/ui`: `@flxra/ui`, built with Vite library mode into `dist/`.
- `apps/docs`: the docs site (Next.js), private, deployed to Vercel.
- `examples/`: minimal Next and Vite apps that install the packed packages, from a temp folder outside the repo, the way a stranger would.
