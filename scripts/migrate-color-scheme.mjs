#!/usr/bin/env node
// One-shot migration: replace `useColorScheme` imports from "react-native"
// with our app-level hook (which is reactive to in-app theme toggles).
//
// Without this, components that do `useColorScheme() === "dark"` to pick
// icon colors etc. stay frozen when the user flips dark mode in Settings,
// because RN's useColorScheme only watches the OS appearance setting.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../mobile/src", import.meta.url).pathname.replace(/^\//, "");
const repoRoot = new URL("..", import.meta.url).pathname.replace(/^\//, "");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function fix(path) {
  // Skip the hook itself and the legacy reexports.
  if (path.includes("useAppColorScheme.ts")) return false;
  if (path.includes("use-color-scheme")) return false;
  if (path.includes("lib/theme.ts")) return false;

  let src = readFileSync(path, "utf8");
  if (!src.includes("useColorScheme")) return false;

  const original = src;

  // Match `import { ..., useColorScheme, ... } from "react-native";`
  // Strategy: capture the brace contents, drop useColorScheme, append the
  // app-hook import on a new line.
  const reactNativeImport = /import\s*\{\s*([^}]+)\}\s*from\s*["']react-native["'];?/;
  const match = src.match(reactNativeImport);
  if (!match) return false;

  const inner = match[1];
  if (!/\buseColorScheme\b/.test(inner)) return false;

  // Strip useColorScheme from the brace list (with surrounding commas).
  const cleaned = inner
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "useColorScheme")
    .join(",\n  ");

  const newRnImport = cleaned
    ? `import {\n  ${cleaned},\n} from "react-native";`
    : ""; // entire import was just useColorScheme — drop it

  src = src.replace(reactNativeImport, newRnImport);

  // Add the app-hook import. Insert after the last existing import line.
  const appImport = `import { useColorScheme } from "@/hooks/useAppColorScheme";`;
  const lines = src.split("\n");
  // Find the last contiguous import block's last line.
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\b/.test(lines[i])) lastImport = i;
  }
  if (lastImport < 0) {
    src = `${appImport}\n${src}`;
  } else {
    lines.splice(lastImport + 1, 0, appImport);
    src = lines.join("\n");
  }

  if (src === original) return false;
  writeFileSync(path, src, "utf8");
  return true;
}

let fixed = 0;
for (const f of walk(ROOT)) {
  if (fix(f)) {
    console.log(`  migrated  ${relative(repoRoot, f)}`);
    fixed++;
  }
}
console.log(`\nDone. ${fixed} files migrated.`);
