// Installs the packed @flxra packages into the example apps, each copied to a
// temp dir outside the repo, and checks they work the way a stranger's app
// would use them. Run from the repo root: npm run test:consumer
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const PUBLINT = "publint@0.3.25";
const ATTW = "@arethetypeswrong/cli@0.18.5";

// capture: return stdout instead of printing it (stderr still shows).
function run(cmd, args, cwd, { capture = false } = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}  (${cwd.startsWith(root) ? path.relative(root, cwd) || "." : cwd})`);
  return execFileSync(cmd, args, { cwd, stdio: ["ignore", capture ? "pipe" : "inherit", "inherit"], encoding: "utf8" });
}

// Outside the repo, so nothing resolves from the repo's own node_modules.
const tempBase = process.env.RUNNER_TEMP ?? tmpdir();
const work = mkdtempSync(path.join(tempBase, "flxra-consumer-"));
console.log(`Working in ${work}`);

// Fails fast if the server exits (a crash, or the port already taken),
// instead of passing against whatever else answers on that port.
async function waitFor(url, server) {
  let exited = false;
  server.once("exit", () => (exited = true));
  for (let i = 0; i < 60; i++) {
    if (exited) throw new Error(`Server for ${url} exited before responding`);
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startServer(cmd, args, cwd) {
  console.log(`\n$ ${cmd} ${args.join(" ")}  (background)`);
  return spawn(cmd, args, { cwd, stdio: "inherit", detached: true });
}

function stop(child) {
  try {
    process.kill(-child.pid);
  } catch {}
}

function install(example) {
  const dir = path.join(work, example);
  cpSync(path.join(root, "examples", example), dir, { recursive: true });
  run("npm", ["install", "--no-audit", "--no-fund", ...tarballs], dir);
  // Exactly one React version, or hooks break.
  const tree = JSON.parse(run("npm", ["ls", "react", "--all", "--json"], dir, { capture: true }));
  const versions = new Set();
  (function walk(deps = {}) {
    for (const [name, info] of Object.entries(deps)) {
      if (name === "react") versions.add(info.version);
      walk(info.dependencies);
    }
  })(tree.dependencies);
  assert.equal(versions.size, 1, `expected one React version, got ${[...versions]}`);
  return dir;
}

// 1. Build, pack and lint the packages.
run("npx", ["turbo", "run", "build", "--filter=./packages/*"], root);
const tarballs = [];
for (const pkg of ["tokens", "ui"]) {
  const dir = path.join(root, "packages", pkg);
  const [{ filename }] = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", work], dir, { capture: true }));
  tarballs.push(path.join(work, filename));
  run("npx", ["-y", PUBLINT, "--strict"], dir);
}
// Types only apply to the JS entry; a stylesheet has none.
run("npx", ["-y", ATTW, tarballs[1], "--profile", "esm-only", "--exclude-entrypoints", "styles.css"], root);

// 2. Next: a Server Component page renders both components.
{
  const dir = install("next-consumer");
  run("npx", ["next", "typegen"], dir);
  run("npx", ["tsc", "--noEmit"], dir);
  run("npx", ["next", "build"], dir);
  const port = "3471";
  const server = startServer("npx", ["next", "start", "-p", port], dir);
  try {
    const html = await (await waitFor(`http://localhost:${port}/`, server)).text();
    assert.match(html, /Close dialog/, "VisuallyHidden text in the HTML");
    assert.match(html, /flxra-VisuallyHidden-root/, "VisuallyHidden class in the HTML");
    assert.match(html, /flxra-Disclosure-trigger/, "Disclosure rendered on the server");
    const hrefs = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
    assert.ok(hrefs.length > 0, "a stylesheet is linked");
    let css = "";
    for (const href of hrefs) css += await (await fetch(new URL(href, `http://localhost:${port}`))).text();
    assert.match(css, /\.flxra-VisuallyHidden-root/, "@flxra/ui styles shipped");
    assert.match(css, /--flxra-space-1/, "@flxra/tokens shipped");
    console.log("next-consumer: ok");
  } finally {
    stop(server);
  }
}

// 3. Vite: types, a production build, dev pre-bundling, and plain Node SSR.
{
  const dir = install("vite-consumer");
  run("npx", ["tsc", "--noEmit"], dir);
  const build = spawnSync("npx", ["vite", "build"], { cwd: dir, encoding: "utf8" });
  const out = build.stdout + build.stderr; // warnings go to stderr
  process.stdout.write(out);
  assert.equal(build.status, 0, "vite build succeeds");
  // Vite drops "use client" silently; any mention means its handling changed.
  assert.doesNotMatch(out, /use client|directive/i, "vite build mentions the directive");
  const assets = path.join(dir, "dist", "assets");
  const css = readdirSync(assets)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(path.join(assets, f), "utf8"))
    .join("");
  assert.match(css, /\.flxra-VisuallyHidden-root/, "@flxra/ui styles bundled");
  assert.match(css, /--flxra-space-1/, "@flxra/tokens bundled");

  const port = "3472";
  const server = startServer("npx", ["vite", "--port", port, "--strictPort"], dir);
  try {
    await waitFor(`http://localhost:${port}/`, server);
    const res = await fetch(`http://localhost:${port}/src/main.tsx`);
    assert.equal(res.status, 200, "dev server transforms main.tsx");
    // main.tsx imports @flxra/ui from Vite's pre-bundled deps; fetch that too.
    const dep = (await res.text()).match(/"(\/node_modules\/\.vite\/deps\/@flxra_ui\.js[^"]*)"/)?.[1];
    assert.ok(dep, "main.tsx imports the pre-bundled @flxra/ui");
    const depRes = await fetch(`http://localhost:${port}${dep}`);
    assert.equal(depRes.status, 200, "pre-bundled @flxra/ui loads");
    assert.match(await depRes.text(), /flxra-Disclosure-trigger/, "pre-bundle includes the components");
  } finally {
    stop(server);
  }

  run("node", ["ssr-check.mjs"], dir);
  console.log("vite-consumer: ok");
}

rmSync(work, { recursive: true, force: true });
console.log("\ntest:consumer passed");
