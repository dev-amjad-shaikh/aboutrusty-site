#!/usr/bin/env node
// Builds the Rusty guide (the VitePress site in this repo's guide/ folder)
// and copies it into public/guide so the main site serves it at /guide/.
//
// Source resolution, in priority order:
//   guide/           the in-repo book source (the default)
//   RUSTY_REPO_PATH  absolute path to a local rusty checkout (override,
//                    for testing guide changes from a rusty working tree)
//
// If no guide source is present this exits quietly with a notice so
// production builds are unaffected.

import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dest = join(siteRoot, "public", "guide");

let srcRoot = null;

if (process.env.RUSTY_REPO_PATH) {
  srcRoot = resolve(process.env.RUSTY_REPO_PATH);
  if (!existsSync(join(srcRoot, "guide", "package.json"))) {
    console.error(`[guide] RUSTY_REPO_PATH ${srcRoot} has no guide/ book`);
    process.exit(1);
  }
} else if (existsSync(join(siteRoot, "guide", "package.json"))) {
  srcRoot = siteRoot;
} else {
  console.log("[guide] no guide/ in this repo — skipping (nothing to serve at /guide/)");
  rmSync(dest, { recursive: true, force: true });
  process.exit(0);
}

const guideDir = join(srcRoot, "guide");

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
