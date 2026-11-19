# Flxra repo setup (roadmap step 3)

Create the `flxra` repo: a Turborepo monorepo with `@flxra/tokens`, `@flxra/ui` and a docs app, a release pipeline that publishes to npm, and the docs on a Vercel URL. It ends with a first `0.1.0` release of both packages, installed by a real test consumer. The portfolio doesn't change.

The point of this step is the **pipeline**, not the content: once a trivial component can go from source → build → npm → installed in a Next app, steps 4–6 only add content.

Drafted and approved 2026-11-19. Reviewed by Fable the same day; see the end.

## Decisions (approved 2026-11-19)

1. **Repo visibility:** public. Others are meant to use it, npm provenance links to a public source, and the repo is part of the portfolio piece.
2. **License:** MIT. It's the norm for component libraries (Radix, shadcn/ui, Chakra) and lets anyone use it, with attribution. Without a license, nobody can legally use it.
3. **npm:** account `cheesebuhrger`, org `flxra` (created).
4. **Motion:** no GSAP in `@flxra/ui`; decided per component from step 6 (see the portfolio roadmap's known requirements).

## Layout

```
flxra/
├─ packages/
│  ├─ tokens/        @flxra/tokens   (own README.md and LICENSE)
│  └─ ui/            @flxra/ui       (own README.md and LICENSE)
├─ apps/
│  └─ docs/          Next 16 + MDX, deployed to Vercel (private)
├─ examples/
│  ├─ next-consumer/ NOT workspaces; each tested from a temp dir outside the repo
│  └─ vite-consumer/
├─ .changeset/       Changesets config and pending changes
├─ .github/workflows/ ci.yml, release.yml
├─ package.json  package-lock.json  turbo.json  tsconfig.base.json
├─ .nvmrc  LICENSE  README.md  CONTRIBUTING.md
```

**Tooling, versions pinned exact, each at least two weeks old:**
- **Node 24 LTS** (`.nvmrc`: `24`; root `engines.node: ">=24"`). It bundles npm 11, which npm trusted publishing needs (npm ≥ 11.5.1, Node ≥ 22.14). On Node 22 the workflow would have to upgrade npm itself.
- npm workspaces, `"packageManager": "npm@11.19.1"` (the npm bundled with current Node 24).
- `turbo@2.11.10`, `vite@8.3.5`, `@vitejs/plugin-react@6.2.1`, `typescript@5.9.3`.
  - TypeScript 5.9 rather than 7: 7 is the new native compiler, and declaration emit is what this step relies on most. Revisit at step 6.
- `@changesets/cli@3.0.3`, `@changesets/changelog-github@1.0.1`.
- Docs: `next@16.4.5`, `@next/mdx@16.4.5`.
- React 19 as a peer dependency.
- Run, not installed: `publint`, `@arethetypeswrong/cli`.

## The packages

Each package commits its own `README.md` and a copy of `LICENSE`: npm only includes those from the package's folder, never from the repo root. `"files"` lists them explicitly, plus `CHANGELOG.md`. Each `package.json` also has:
- `"exports"` including `"./package.json": "./package.json"`;
- `"publishConfig": { "access": "public" }`. Not `provenance: true`: it breaks the first, manual publish from a laptop, and trusted publishing adds provenance automatically;
- `"license": "MIT"`;
- `"repository": { "type": "git", "url": "git+https://github.com/cheesebuhrger/flxra.git", "directory": "packages/<name>" }`. The URL must match the repo exactly, or the provenance publish fails (E422);
- `"homepage"`: the docs URL.

### `@flxra/tokens`

Plain CSS, no build step.
- `tokens.css` defines `:root` variables. For step 3 it holds a single proof token, `--flxra-space-1: 4px`, plus a header. Step 4 fills it.
- `"exports": { "./tokens.css": "./tokens.css", "./package.json": "./package.json" }`, `"sideEffects": ["*.css"]`.

### `@flxra/ui`

Source in `src/`, compiled to `dist/` with Vite library mode, verified in the spike below.

**Vite config:**
- `build.lib: { entry: "src/index.ts", formats: ["es"], cssFileName: "styles" }` and `build.cssCodeSplit: false`. All CSS goes into one `dist/styles.css`; no renaming needed.
- `rollupOptions.external: [/^react($|\/)/, /^react-dom($|\/)/]`. This covers `react/jsx-runtime`, `jsx-dev-runtime` and `react-dom/client`.
- `output: { preserveModules: true, preserveModulesRoot: "src", entryFileNames: "[name].js" }`. The result:
  - a flat `dist/` mirroring `src/` (`index.js`, `Disclosure.js`, `Disclosure.module.js`, …);
  - `"use client"` is kept on exactly the files that declare it. Vite 8's bundler, Rolldown, does this natively, with no plugin;
  - consumers' bundlers can tree-shake.

**CSS Modules:**
- Vite 8 uses postcss-modules by default. Its `[name]` placeholder includes `.module`, so the class names come from a function:
  ```ts
  generateScopedName: (local, file) =>
    `flxra-${path.basename(file, ".module.css")}-${local}`
  ```
- **Result:** readable class names that stay the same across releases (`flxra-Disclosure-root`). Consumers still shouldn't target them; `className` is for placement only.
- **Layers:** whether the CSS goes inside `@layer` is step 6's decision (the Tailwind-3-unlayered issue in the roadmap). Step 3 ships unlayered, low-specificity, single-class selectors.
- **The JS doesn't import the CSS.** Consumers import `@flxra/ui/styles.css` once, at their root (the Radix Themes / Mantine model). `"sideEffects": ["*.css"]`.

**Types:**
- `src/css-modules.d.ts` declares `*.module.css` (without it, `tsc` fails with TS2307).
- Source imports use explicit `.js` extensions (`export { Disclosure } from "./Disclosure.js"`). `tsconfig.build.json` uses `module` and `moduleResolution` set to `NodeNext`, so the emitted `.d.ts` files resolve under `node16`/`nodenext` consumers too. Vite resolves `.js` to `.tsx`.
- The build script is `vite build && tsc -p tsconfig.build.json`: tsc runs after Vite, because Vite's `emptyOutDir` would delete declarations written first.

**`package.json`:**
- `"type": "module"`;
- `"exports"`:
  - `".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }`
  - `"./styles.css": "./dist/styles.css"`
  - `"./package.json": "./package.json"`
- `"files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"]`;
- `"peerDependencies"`: `react` and `react-dom` `^19`.

**Tokens dependency (decided now):** `@flxra/ui` will use `@flxra/tokens` variables from step 4. It's a **peer dependency** with a real range (`^0.1.0`), never `"*"`, because `npm pack` doesn't rewrite workspace ranges. Consumers import `@flxra/tokens/tokens.css` before `@flxra/ui/styles.css`. Step 3 adds the peer, even though nothing uses it yet, so the install shape is final from the first release.

**Step 3 content:**
- `VisuallyHidden`: a server-safe CSS Module.
- `Disclosure`: a `"use client"` toggle using `useState`.

Together they prove both paths, a styled server component and a client boundary. Both are small and genuinely useful, so they stay in the library.

## Spikes (2026-11-19, scratchpad, Vite 8.3.5)

**First run, my original config:**
- `"use client"` stayed at the top of only the client component's file.
- The CSS Modules became class-map modules plus one extracted CSS file.
- `react` stayed external.
- The lib `fileName` mangled the output names (`spike3.js`).

**Fable's rebuild with the final config above:**
- a flat `dist/` (`index`, `Box`, `Toggle`, `Box.module`, `Toggle.module`, plus `styles.css`);
- `"use client"` only in `Toggle.js`;
- class names `.flxra-Box-box` and `.flxra-Toggle-toggle`;
- `index.d.ts` re-exports `./Toggle.js`;
- `tsc` is clean with the CSS-module declaration.

This settles the roadmap requirement "keep `"use client"` and the CSS Modules through the build".

## The docs app (`apps/docs`)

- **Stack:** Next 16 App Router + `@next/mdx` (with the required `mdx-components.tsx`). `private: true`.
- **Dependencies:** `"@flxra/ui": "*"` and `"@flxra/tokens": "*"`, linked from the workspace. That's fine for a private app that's never packed.
- **Freshness:** the docs consume the **built** `dist/`, like any consumer, so they exercise the real package output, class names included. No `transpilePackages`: it isn't needed for prebuilt ESM, and it doesn't affect file watching.
  - turbo `build` and `dev` both have `dependsOn: ["^build"]`, so `dist/` exists before Next starts, on a fresh clone and on Vercel.
  - In dev, `npm run dev` also runs persistent watchers in `packages/ui`: `vite build --watch` and `tsc --watch`, so types stay fresh.
  - **Verify:** editing `src/Disclosure.tsx` shows up in the docs within a few seconds. Turbopack should see it: the workspace symlink resolves to `packages/ui/dist` under the repo root, which it watches.
  - **Fallback, if it doesn't:** a dev-only `turbopack.resolveAlias: { "@flxra/ui": "../../packages/ui/src/index.ts" }` plus `transpilePackages: ["@flxra/ui"]` in that mode. Dev would then skip the dist output and class names, so production builds stay on dist. (There's no custom export-condition setting in Turbopack, so a `"source"` condition isn't an option.)
- **Step 3 content:** a home page, plus one page per component with a live demo. Enough to prove the deploy; the real docs are step 7.
- **Vercel:**
  - a new project from the `flxra` repo, Root Directory `apps/docs`, "Include files outside the Root Directory" on;
  - **Build Command** `turbo run build --filter=docs`, so the packages build first. Don't rely on the default;
  - optional Ignored Build Step `npx turbo-ignore`;
  - a free `*.vercel.app` URL.
  - The user creates the project (dashboard: Add New → Project → import the repo), or I do it through the Vercel integration if preferred.

## The test consumers (`examples/next-consumer`, `examples/vite-consumer`)

This is the check that the published packages work for a stranger, in both kinds of app people will install them into: Next (Server Components, where `"use client"` matters) and Vite + React (client-only, where it must be harmless). Each is a minimal app with its own `package.json`. They're not in the root `workspaces` globs, but it must still never run inside the repo: Node and Turbopack resolution walk up parent directories, so anything missing from its `node_modules` would silently resolve from the repo root's. Next would also infer the outer lockfile as its root.

`npm run test:consumer` (local and CI):
1. Pack:
   - `turbo run build --filter="./packages/*"`;
   - `npm pack` in each package;
   - `npx publint` and `npx @arethetypeswrong/cli --pack --profile esm-only` on each tarball.
2. Copy each example to its own fresh temp dir outside the repo (`mktemp -d`, or `$RUNNER_TEMP` in CI). The Next example's `next.config` sets `turbopack.root` to its own directory.
3. Install the `.tgz` files in each, plus, pinned to the repo's versions: `react`, `react-dom`, `typescript@5.9.3`, `@types/react@19`, `@types/react-dom@19`, and `next` or `vite` + `@vitejs/plugin-react`. Then `npm ls react` must show a single copy.
4. **Next:** run `tsc --noEmit` (the published types resolve), `next build`, then `next start`. Fetch the page and assert:
   - the `VisuallyHidden` text is in the HTML;
   - `styles.css` is linked and contains `flxra-VisuallyHidden`;
   - `--flxra-space-1` is defined;
   - the build didn't fail on `Disclosure` imported into a Server Component page, which only works if `"use client"` survived.
5. **Vite:** `src/main.tsx` imports `@flxra/tokens/tokens.css` and `@flxra/ui/styles.css`, and renders `VisuallyHidden` and `Disclosure`. The example commits its own `tsconfig.json` rather than relying on the template's: `moduleResolution: "bundler"`, `"types": ["vite/client"]` (without it, `noUncheckedSideEffectImports` fails the CSS imports with TS2307), and `skipLibCheck: false`, so the published `.d.ts` contents are checked too. Run `tsc --noEmit`, then `vite build`, and assert:
   - the build succeeds with no warning: Vite 8.3.5 silently drops the directive (verified). Fail if the output mentions `use client` or `directive`, so a future Vite change shows up;
   - the built CSS contains `flxra-VisuallyHidden` and `--flxra-space-1`.
   - dev-mode pre-bundling works: start `vite`, fetch `/src/main.tsx`, expect a 200.
6. **No bundler at all:** `examples/vite-consumer/ssr-check.mjs` (outside the tsconfig `include`), run from the temp dir, `renderToString` from `react-dom/server` on `Disclosure` and `VisuallyHidden`, imported from the installed `@flxra/ui`, and asserts the expected markup. `Disclosure` uses a hook, so a duplicate React copy would fail loudly. This proves the published `exports` and `.js` imports resolve under plain Node ESM, which is what tests (Vitest), SSR frameworks and scripts use.

The Vite app is client-rendered, so its HTML has no component text to fetch; the Node render in step 6 covers the runtime check instead of adding a headless browser.

This catches what a workspace link hides: missing `files`, wrong `exports`, absent or unresolvable `.d.ts`, stripped directives, CSS not shipped.

## Releases: Changesets + npm trusted publishing

**Day to day:**
1. A change to a package comes with a changeset: `npx changeset` asks for patch/minor/major and a summary.
2. On `main`, the release workflow (`changesets/action@v1`) keeps a "Version Packages" PR open. It bumps versions and writes `CHANGELOG.md`.
3. Merging that PR builds and publishes to npm.

**Configuration:**
- `.changeset/config.json`:
  - `"access": "public"`, `"baseBranch": "main"`;
  - `changelog: ["@changesets/changelog-github", { "repo": "cheesebuhrger/flxra" }]`;
  - `"privatePackages": { "version": false, "tag": false }`, so the docs app is left alone. Private packages are never published, and this avoids `ignore`'s validation rules.
- **Versions:** start at **`0.1.0`**, not `0.0.x`. Under semver caret ranges, `^0.0.1` matches only `0.0.1`, so every release would look breaking and nobody's install would upgrade on its own. Until `1.0`: **minor for breaking changes, patch for everything else** (`^0.1.0` accepts `0.1.x`).

**`release.yml`:**
- Triggered on push to `main`.
- `permissions: id-token: write, contents: write, pull-requests: write`.
- Node 24 via `setup-node`, **without** `registry-url`. An explicit `NODE_AUTH_TOKEN`, even an empty one, would override OIDC.
- `changesets/action` runs with `publish: npm run release`. The root script `release` is `turbo run build --filter="./packages/*" && changeset publish`. The build is needed because `dist/` is gitignored, so a checkout has nothing to publish.
- Provenance is generated automatically.
- **PR token:** PRs opened with the default `GITHUB_TOKEN` don't trigger CI, so the Version Packages PR would never get the green checks branch protection requires.
  - Give `changesets/action` a token from a small GitHub App via `actions/create-github-app-token`. This is recommended; a fine-grained PAT also works.
  - Enable Settings → Actions → "Allow GitHub Actions to create and approve pull requests".
  - I'll walk the user through both.

**First publish.** A trusted publisher is configured per package in that package's npm settings, so the package has to exist first.
1. The user publishes `0.1.0` of each package once from their machine, with 2FA: build first, then `npm publish` in each package directory. I prepare the exact commands, and the provenance flag is off by default since it's not in `publishConfig`.
2. On npmjs.com, each package → Settings → Trusted Publisher → GitHub Actions: `cheesebuhrger/flxra`, workflow file `release.yml` (it must match exactly).
3. Then Publishing access → "Require two-factor authentication and disallow tokens". This is compatible with OIDC, and it means only the workflow can publish.
4. Every later release goes through CI. The first one is `0.1.1`, a small patch to prove the pipeline.

## CI (`ci.yml`, every PR)

1. `actions/checkout` with `fetch-depth: 0` (Changesets needs the history), then `npm ci`.
2. `turbo run lint typecheck build`.
3. `npm run test:consumer` (with publint and attw on the tarballs).
4. `npx changeset status --since=origin/main`. This fails the check when a package changed without a changeset. Docs-only PRs don't touch packages, so they pass.

No visual or axe tests yet: there's almost nothing to look at. They arrive with step 6.

**`turbo.json`:**
- `build`: `dependsOn: ["^build"]`, `outputs: ["dist/**", ".next/**", "!.next/cache/**"]`.
- `dev`: `dependsOn: ["^build"]`, `persistent: true`, `cache: false`.
- `lint` and `typecheck`: `{}`.
- `ui: "stream"`.

## Repo hygiene

- `README.md`: what Flxra is, install and usage (including the import order: tokens CSS, then ui CSS), a link to the docs, and the status (`0.x`, pre-release).
- `CONTRIBUTING.md`: how to run it locally, how to add a changeset, how releases work. It doubles as the user's reference.
- `LICENSE` (MIT, if approved) at the root, with copies in each package.
- `.gitignore`: `node_modules/`, `dist/`, `.next/`, `.turbo/`, `*.tgz`, `.vercel`.
- Branch protection on `main`: PR plus a green CI before merging. The user sets this in GitHub settings; I'll list the clicks.

## Commits

1. **Scaffold:** root package, turbo, tsconfig base, `.nvmrc`, license, readmes, gitignore.
2. **`@flxra/tokens`** with the proof token.
3. **`@flxra/ui`** build pipeline: `VisuallyHidden` and `Disclosure`.
4. **Docs app.**
5. **Test consumers** (Next and Vite), plus `test:consumer`.
6. **Changesets**, plus `ci.yml` and `release.yml`.

Then:
- **Push:** the user approves creating the public GitHub repo, and I push.
- **Vercel:** set up the docs project.
- **GitHub settings:** the GitHub App token and Actions settings, then branch protection.
- **First publish:** manual `0.1.0`, then trusted publishing and "disallow tokens".
- **First CI release:** a changeset releases `0.1.1` through the Version Packages PR, proving the full pipeline.
- **Portfolio check:** install `@flxra/tokens@0.1.1` in a temp copy of the portfolio. Only to confirm it installs; the real adoption is step 4.

## Verification

- **Locally:**
  - `npm ci` and `turbo run lint typecheck build` pass from a clean clone;
  - `npm run dev` hot-reloads a component change into the docs;
  - `test:consumer` passes, with publint and attw clean.
- **Package contents:**
  - `npm pack --dry-run` in each package lists only the intended files: `dist/` or `tokens.css`, plus `package.json`, `README.md` and `LICENSE`. No `src/`, no config;
  - `dist/Disclosure.js` starts with `"use client"`, and `dist/index.js` doesn't.
- **The published packages:** `npm view @flxra/ui` shows the version, license and repository; the npm page shows the provenance badge from `0.1.1` on.
- **Vercel:** the build log shows `turbo run build --filter=docs`, and the docs URL renders both component pages with no console errors.
- **The release pipeline:**
  - the Version Packages PR gets CI checks;
  - merging it publishes `0.1.1`, with a changelog entry and provenance.

## Risks

- **Turbopack watching symlinked `dist/`:** the one unknown in "Freshness". A fallback is defined.
- **Trusted publishing setup order:** the package must exist before a trusted publisher can be added, hence the manual `0.1.0`. If the npm UI has changed, the fallback is a granular automation token stored as a GitHub secret, scoped to `@flxra` and short-lived.
- **Name squatting:** until the `flxra` org exists, `@flxra` is claimable by anyone. Create it before anything else.
- **Learning load:** this step adds Changesets, OIDC, GitHub Apps and npm concepts at once. `CONTRIBUTING.md` doubles as the user's reference, and each concept gets a short explanation as it comes up.

## Review (Fable, 2026-11-19)

Sound with changes, all applied above:
- the class-name function (postcss-modules' `[name]` includes `.module`), `build.lib.cssFileName`, and regex externals;
- the CSS-module declaration, `.js` import extensions with `NodeNext` declarations, and tsc after Vite;
- no `transpilePackages`, and `dependsOn: ["^build"]` on `dev`;
- a real Turbopack fallback (`resolveAlias`; custom export conditions don't exist);
- Node 24 for npm 11, no `provenance` in `publishConfig`, a build inside the release script, an exact `repository.url`, and no `registry-url`;
- `privatePackages` instead of `ignore`, `0.1.0` as the first version, and `changeset status --since` with full history;
- the consumer tested from a temp dir outside the repo (upward resolution, and Next's outer-lockfile inference);
- the tokens peer dependency decided now;
- a README and LICENSE in each package, plus `CHANGELOG.md` in `files`;
- a GitHub App token for the Version Packages PR;
- an explicit Vercel build command, publint/attw on the tarballs in CI, and `mdx-components.tsx`.

**Vite consumer addition (Fable, 2026-11-19):** sound with changes, verified by packing the spike into tarballs and installing them in a fresh Vite 8.3.5 app. Applied: the TypeScript and React types in the install list, a single-React `npm ls` check, the committed tsconfig (`vite/client` types, `skipLibCheck: false`), "no warning" instead of "warning acceptable", the dev pre-bundle fetch, and the `ssr-check.mjs` details. A headless browser waits for step 6's visual tests.

## Implementation notes (2026-11-19)

What changed from the plan while building commits 1–6, each verified:
- **Fixed versioning** (`"fixed": [["@flxra/tokens", "@flxra/ui"]]`). Simulated with `changeset version`: without it, a breaking tokens release (`0.2.0`) gave `@flxra/ui` only a patch (`0.1.1`) while moving its peer to `^0.2.0`, so `^0.1.0` users would auto-update into a peer conflict. With it, both packages always share one version.
- **`changesets/action` v2** (`publish-script` instead of `publish`). All actions are pinned to commit SHAs. `create-github-app-token` v3 takes `client-id`, read from the repo variable `RELEASE_APP_CLIENT_ID`, with the key in the secret `RELEASE_APP_PRIVATE_KEY`.
- **The release job is skipped until `RELEASE_APP_CLIENT_ID` exists.** So the order after pushing is: manual `0.1.0` publish, trusted publishers, *then* the GitHub App. Otherwise the first push to `main` would try to publish `0.1.0` through OIDC before a trusted publisher exists.
- **CI skips `changeset status` on the `changeset-release/main` branch** (the Version Packages PR consumes the changesets).
- **Dev:** `npm run dev` runs `turbo run dev dev:types --filter=docs...`. `@flxra/ui`'s watchers depend on its own `build` (in `packages/ui/turbo.json`), so they never race the initial clean build. `emptyOutDir: false`, with the build script clearing `dist` itself. `PORT` passes through to dev. A component edit reached the running docs in about 1 second, so the `resolveAlias` fallback isn't needed.
- **`typecheck` depends on `^build`:** the docs typecheck needs `@flxra/ui`'s declarations on a fresh clone.
- **Test consumers:**
  - publint runs in each package folder (it packs itself), and attw runs on the `@flxra/ui` tarball with `--exclude-entrypoints styles.css`. Pinned: `publint@0.3.25`, `@arethetypeswrong/cli@0.18.5`.
  - The Next example uses Next's default `skipLibCheck: true`: with `false`, Next's own `.d.ts` files fail. The Vite example keeps `false`, so Flxra's declarations are still strictly checked.
  - Negative test: removing `"use client"` from `Disclosure` fails the Next build with `useState is not a function`.
- **Local tooling:** `/usr/local/bin/git` on this Mac is 2.15 (2017), and Changesets fails with it. `/usr/bin/git` (2.54) works. CI is unaffected.
