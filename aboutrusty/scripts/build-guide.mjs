#!/usr/bin/env node
// Builds the Rusty guide (VitePress site living in the rusty repo under
// guide/) and copies it into public/guide so the main site serves it at
// /guide/.
//
// Source resolution, in priority order:
//   RUSTY_REPO_PATH  absolute path to a local rusty checkout (local dev)
//   RUSTY_REF        git ref of dev-amjad-shaikh/rusty to clone (default: main)
//
// Before the guide lands on main, this exits quietly with a notice so
// production builds are unaffected.

import { execFileSync, execSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dest = join(siteRoot, "public", "guide");

let srcRoot = process.env.RUSTY_REPO_PATH ?? null;
let cloned = false;

if (srcRoot) {
  srcRoot = resolve(srcRoot);
  if (!existsSync(join(srcRoot, "Cargo.toml"))) {
    console.error(`[guide] RUSTY_REPO_PATH ${srcRoot} does not look like the rusty repo`);
    process.exit(1);
  }
} else {
  const ref = process.env.RUSTY_REF ?? "main";
  srcRoot = mkdtempSync(join(tmpdir(), "rusty-guide-"));
  cloned = true;
  console.log(`[guide] cloning rusty @ ${ref}`);
  execFileSync(
    "git",
    ["clone", "--depth", "1", "--branch", ref, "https://github.com/dev-amjad-shaikh/rusty", srcRoot],
    { stdio: "inherit" },
  );
}

const guideDir = join(srcRoot, "guide");

try {
  if (!existsSync(join(guideDir, "package.json"))) {
    console.log("[guide] guide/ not present in rusty yet — skipping (nothing to serve at /guide/)");
    rmSync(dest, { recursive: true, force: true });
    process.exit(0);
  }

  console.log("[guide] installing guide dependencies");
  const install = existsSync(join(guideDir, "package-lock.json")) ? "npm ci --no-audit --no-fund" : "npm install --no-audit --no-fund";
  execSync(install, { cwd: guideDir, stdio: "inherit" });

  console.log("[guide] building vitepress site");
  execSync("npx vitepress build", { cwd: guideDir, stdio: "inherit" });

  const dist = join(guideDir, ".vitepress", "dist");
  if (!existsSync(join(dist, "index.html"))) {
    console.error("[guide] vitepress build produced no index.html");
    process.exit(1);
  }

  rmSync(dest, { recursive: true, force: true });
  cpSync(dist, dest, { recursive: true });
  console.log(`[guide] copied to ${dest} — served at /guide/`);
} finally {
  if (cloned) rmSync(srcRoot, { recursive: true, force: true });
}
