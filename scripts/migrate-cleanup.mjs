#!/usr/bin/env node
// Cleanup pass for migrate-to-getUserId.mjs. Handles edge cases the first
// script missed:
//   1. `_req: Request` handler params → `req: Request` (so getUserId(req) works)
//   2. `if (!session || !session.user?._id)` pattern → `if (!userId)`
//   3. Any leftover bare `session` references that should be userId.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src/app/api", import.meta.url).pathname.replace(/^\//, "");
const repoRoot = new URL("..", import.meta.url).pathname.replace(/^\//, "");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith("route.ts")) out.push(full);
  }
  return out;
}

function fix(path) {
  let src = readFileSync(path, "utf8");
  // Only process files we migrated (those that import getUserId).
  if (!src.includes("@/lib/mobileAuth")) return false;

  const original = src;

  // 1. Rename _req to req in handler signatures so getUserId(req) finds it.
  //    Only inside `export async function HANDLER(_req: Request, ...)`.
  src = src.replace(
    /(export\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE)\s*\(\s*)_req(\s*:\s*Request)/g,
    "$1req$2",
  );

  // 2. `if (!session || !session.user?._id)` → `if (!userId)` (multi-shape).
  src = src.replace(
    /if\s*\(\s*!session\s*\|\|\s*!session\.user\?\._id\s*\)/g,
    "if (!userId)",
  );
  src = src.replace(
    /if\s*\(\s*!session\s*\|\|\s*!session\?\.user\?\._id\s*\)/g,
    "if (!userId)",
  );

  // 3. Any leftover session.user._id or session?.user?._id → userId.
  src = src.replace(/session\?\.user\?\._id/g, "userId");
  src = src.replace(/session\.user\._id/g, "userId");

  if (src === original) return false;

  writeFileSync(path, src, "utf8");
  return true;
}

let fixed = 0;
for (const f of walk(ROOT)) {
  if (fix(f)) {
    console.log(`  fixed  ${relative(repoRoot, f)}`);
    fixed++;
  }
}
console.log(`\nDone. ${fixed} files fixed.`);
