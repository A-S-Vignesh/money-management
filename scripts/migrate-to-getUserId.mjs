#!/usr/bin/env node
// One-shot migration: convert every API route still using
// `getServerSession(authOptions)` to the unified `getUserId(req)` helper.
// That helper accepts BOTH the web NextAuth session cookie AND the mobile
// Bearer JWT, so once a route uses it the mobile app can call it without
// any per-route changes.
//
// The transform is mechanical — each route follows one of two patterns:
//
//   Pattern A:  const session = await getServerSession(authOptions);
//               const userId = session?.user?._id;
//
//   Pattern B:  const session = await getServerSession(authOptions);
//               if (!session?.user?._id) { ... }
//               ... session.user._id ...
//
// We rewrite both into:
//
//               const userId = await getUserId(req);
//               if (!userId) { ... }                 // pattern B only
//               ... userId ...
//
// Also fixes handlers that didn't take a `req` param (we need it to read
// the Authorization header).

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

function migrateFile(path) {
  let src = readFileSync(path, "utf8");
  if (!src.includes("getServerSession")) return { changed: false };

  const original = src;

  // 1. Imports — drop NextAuth session imports, add getUserId.
  src = src.replace(
    /import\s*\{\s*getServerSession\s*\}\s*from\s*["']next-auth["'];?\n?/g,
    "",
  );
  src = src.replace(
    /import\s*\{\s*authOptions\s*\}\s*from\s*["']@\/lib\/authOptions["'];?\n?/g,
    "",
  );

  if (!/from\s+["']@\/lib\/mobileAuth["']/.test(src)) {
    // Insert after the last existing import (anchor on the final `import`
    // statement followed by a blank line or non-import line).
    const lines = src.split("\n");
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\b/.test(lines[i])) lastImport = i;
    }
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, 'import { getUserId } from "@/lib/mobileAuth";');
      src = lines.join("\n");
    }
  }

  // 2. Handler signatures — every exported method handler needs to accept
  //    `req: Request` so getUserId can read the Authorization header. If
  //    a handler is declared as `function GET()` / `function POST()` we
  //    insert the param. Handlers that already take a second arg with
  //    `{ params }` are untouched (they already have req as 1st arg).
  src = src.replace(
    /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*\)/g,
    "export async function $1(req: Request)",
  );

  // 3. Pattern A: `const session = ...; const userId = session?.user?._id;`
  //    Collapse the two lines into a single getUserId call.
  src = src.replace(
    /^[ \t]*const\s+session\s*=\s*await\s+getServerSession\(\s*authOptions\s*\)\s*;\s*\n[ \t]*const\s+userId\s*=\s*session\?\.user\?\._id\s*;/gm,
    "  const userId = await getUserId(req);",
  );

  // 4. Pattern B: `const session = ...;` (standalone) → `const userId = await getUserId(req);`
  //    Subsequent `session.user._id` / `session?.user?._id` references map to `userId`.
  src = src.replace(
    /^[ \t]*const\s+session\s*=\s*await\s+getServerSession\(\s*authOptions\s*\)\s*;/gm,
    "  const userId = await getUserId(req);",
  );

  // 5. Auth checks — `if (!session?.user?._id)` → `if (!userId)`
  src = src.replace(/!session\?\.user\?\._id/g, "!userId");

  // 6. Direct references to session.user._id → userId
  src = src.replace(/session\?\.user\?\._id/g, "userId");
  src = src.replace(/session\.user\._id/g, "userId");

  if (src === original) return { changed: false };

  writeFileSync(path, src, "utf8");
  return { changed: true };
}

const files = walk(ROOT).filter((f) => {
  // Skip /api/auth — NextAuth's own routes legitimately use getServerSession.
  return !f.includes(`${ROOT}${"/"}auth${"/"}`) && !f.includes(`${ROOT}\\auth\\`);
});

let migrated = 0;
let skipped = 0;
for (const f of files) {
  const { changed } = migrateFile(f);
  const rel = relative(repoRoot, f);
  if (changed) {
    console.log(`  migrated  ${rel}`);
    migrated++;
  } else {
    skipped++;
  }
}
console.log(`\nDone. ${migrated} files migrated, ${skipped} skipped (already migrated or no-op).`);
