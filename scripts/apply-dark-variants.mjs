#!/usr/bin/env node
// scripts/apply-dark-variants.mjs
//
// Token-aware bulk insertion of `dark:` variants into Tailwind className
// strings. Safe to run multiple times — already-darkened classes are skipped.
//
// Scope: only edits double-quoted className attributes and template-literal
// className attributes that contain NO ${...} interpolation. Template literals
// with conditional expressions are left to manual review (they need ternary-
// branch-specific handling that is unsafe to automate).
//
// Usage:  node scripts/apply-dark-variants.mjs <file> [file ...]

import fs from "node:fs";

const mapping = {
  // backgrounds (page/card neutrals)
  "bg-white": "bg-white dark:bg-gray-900",
  "bg-gray-50": "bg-gray-50 dark:bg-gray-800",
  "bg-gray-100": "bg-gray-100 dark:bg-gray-800",
  "bg-gray-200": "bg-gray-200 dark:bg-gray-700",
  "bg-gray-300": "bg-gray-300 dark:bg-gray-600",

  // text neutrals
  "text-gray-900": "text-gray-900 dark:text-gray-100",
  "text-gray-800": "text-gray-800 dark:text-gray-200",
  "text-gray-700": "text-gray-700 dark:text-gray-300",
  "text-gray-600": "text-gray-600 dark:text-gray-400",
  "text-gray-500": "text-gray-500 dark:text-gray-400",
  "text-gray-400": "text-gray-400 dark:text-gray-500",

  // borders
  "border-gray-100": "border-gray-100 dark:border-gray-800",
  "border-gray-200": "border-gray-200 dark:border-gray-700",
  "border-gray-300": "border-gray-300 dark:border-gray-700",

  // hover (neutrals)
  "hover:bg-gray-50": "hover:bg-gray-50 dark:hover:bg-gray-800",
  "hover:bg-gray-100": "hover:bg-gray-100 dark:hover:bg-gray-800",
  "hover:bg-gray-200": "hover:bg-gray-200 dark:hover:bg-gray-700",

  // colored tints — light, mid-light
  "bg-indigo-50": "bg-indigo-50 dark:bg-indigo-950/40",
  "bg-indigo-100": "bg-indigo-100 dark:bg-indigo-900/40",
  "bg-red-50": "bg-red-50 dark:bg-red-950/30",
  "bg-red-100": "bg-red-100 dark:bg-red-900/40",
  "bg-green-50": "bg-green-50 dark:bg-green-950/30",
  "bg-green-100": "bg-green-100 dark:bg-green-900/40",
  "bg-amber-50": "bg-amber-50 dark:bg-amber-950/30",
  "bg-amber-100": "bg-amber-100 dark:bg-amber-900/40",
  "bg-orange-50": "bg-orange-50 dark:bg-orange-950/30",
  "bg-orange-100": "bg-orange-100 dark:bg-orange-900/40",
  "bg-blue-50": "bg-blue-50 dark:bg-blue-950/30",
  "bg-blue-100": "bg-blue-100 dark:bg-blue-900/40",
  "bg-purple-50": "bg-purple-50 dark:bg-purple-950/30",
  "bg-purple-100": "bg-purple-100 dark:bg-purple-900/40",
  "bg-slate-100": "bg-slate-100 dark:bg-slate-800",
  "bg-yellow-50": "bg-yellow-50 dark:bg-yellow-950/30",
  "bg-yellow-100": "bg-yellow-100 dark:bg-yellow-900/40",
  "bg-pink-50": "bg-pink-50 dark:bg-pink-950/30",
  "bg-pink-100": "bg-pink-100 dark:bg-pink-900/40",
  "bg-teal-50": "bg-teal-50 dark:bg-teal-950/30",
  "bg-teal-100": "bg-teal-100 dark:bg-teal-900/40",

  // hover on colored tints
  "hover:bg-indigo-50": "hover:bg-indigo-50 dark:hover:bg-indigo-950/40",
  "hover:bg-indigo-100": "hover:bg-indigo-100 dark:hover:bg-indigo-900/40",
  "hover:bg-red-50": "hover:bg-red-50 dark:hover:bg-red-950/30",
  "hover:bg-red-100": "hover:bg-red-100 dark:hover:bg-red-900/40",

  // colored text
  "text-indigo-500": "text-indigo-500 dark:text-indigo-400",
  "text-indigo-600": "text-indigo-600 dark:text-indigo-300",
  "text-indigo-700": "text-indigo-700 dark:text-indigo-300",
  "text-indigo-800": "text-indigo-800 dark:text-indigo-200",
  "text-red-500": "text-red-500 dark:text-red-400",
  "text-red-600": "text-red-600 dark:text-red-300",
  "text-red-700": "text-red-700 dark:text-red-300",
  "text-red-800": "text-red-800 dark:text-red-200",
  "text-red-900": "text-red-900 dark:text-red-200",
  "text-green-500": "text-green-500 dark:text-green-400",
  "text-green-600": "text-green-600 dark:text-green-300",
  "text-green-700": "text-green-700 dark:text-green-300",
  "text-green-800": "text-green-800 dark:text-green-200",
  "text-green-900": "text-green-900 dark:text-green-200",
  "text-amber-600": "text-amber-600 dark:text-amber-300",
  "text-amber-700": "text-amber-700 dark:text-amber-300",
  "text-amber-800": "text-amber-800 dark:text-amber-200",
  "text-amber-900": "text-amber-900 dark:text-amber-200",
  "text-blue-600": "text-blue-600 dark:text-blue-300",
  "text-blue-700": "text-blue-700 dark:text-blue-300",
  "text-blue-800": "text-blue-800 dark:text-blue-200",
  "text-blue-900": "text-blue-900 dark:text-blue-200",
  "text-orange-600": "text-orange-600 dark:text-orange-300",
  "text-orange-700": "text-orange-700 dark:text-orange-300",
  "text-orange-800": "text-orange-800 dark:text-orange-200",
  "text-orange-900": "text-orange-900 dark:text-orange-200",
  "text-purple-600": "text-purple-600 dark:text-purple-300",
  "text-purple-700": "text-purple-700 dark:text-purple-300",
  "text-purple-800": "text-purple-800 dark:text-purple-200",
  "text-purple-900": "text-purple-900 dark:text-purple-200",
  "text-slate-600": "text-slate-600 dark:text-slate-300",
  "text-slate-700": "text-slate-700 dark:text-slate-300",
  "text-slate-800": "text-slate-800 dark:text-slate-200",
  "text-slate-900": "text-slate-900 dark:text-slate-200",
  "text-yellow-600": "text-yellow-600 dark:text-yellow-300",
  "text-yellow-700": "text-yellow-700 dark:text-yellow-300",
  "text-yellow-800": "text-yellow-800 dark:text-yellow-200",
  "text-yellow-900": "text-yellow-900 dark:text-yellow-200",
  "text-pink-600": "text-pink-600 dark:text-pink-300",
  "text-pink-700": "text-pink-700 dark:text-pink-300",
  "text-pink-800": "text-pink-800 dark:text-pink-200",
  "text-pink-900": "text-pink-900 dark:text-pink-200",
  "text-teal-600": "text-teal-600 dark:text-teal-300",
  "text-teal-700": "text-teal-700 dark:text-teal-300",
  "text-teal-800": "text-teal-800 dark:text-teal-200",
  "text-teal-900": "text-teal-900 dark:text-teal-200",
  "text-indigo-900": "text-indigo-900 dark:text-indigo-200",
};

// Property family for a token, used to detect "a dark variant of this same
// property family is already present". e.g.:
//   dark:bg-gray-900       → "dark:bg"
//   dark:hover:bg-red-50   → "dark:hover:bg"
//   dark:text-red-300      → "dark:text"
function darkFamily(tok) {
  if (!tok.startsWith("dark:")) return null;
  // Strip the value at the tail (last "-X..." chunk).
  const lastDash = tok.lastIndexOf("-");
  if (lastDash <= 4) return null;
  return tok.slice(0, lastDash);
}

function rewriteClassString(classes) {
  if (classes.includes("${")) return null; // skip interpolated literals
  const tokens = classes.split(/\s+/);
  const existingTokens = new Set(tokens);
  const existingDarkFamilies = new Set();
  for (const t of tokens) {
    const fam = darkFamily(t);
    if (fam) existingDarkFamilies.add(fam);
  }

  const out = [];
  for (const tok of tokens) {
    const repl = mapping[tok];
    if (!repl) {
      out.push(tok);
      continue;
    }
    const darkParts = repl.split(" ").slice(1);
    // Skip if exact dark tokens already present, OR any dark token of the
    // same property family is already present (a manual override exists).
    const conflict = darkParts.some(
      (d) => existingTokens.has(d) || existingDarkFamilies.has(darkFamily(d)),
    );
    out.push(conflict ? tok : repl);
    for (const d of darkParts) {
      existingTokens.add(d);
      const fam = darkFamily(d);
      if (fam) existingDarkFamilies.add(fam);
    }
  }
  return out.join(" ");
}

// Heuristic: does this string look like Tailwind class soup?
// - all tokens match CSS-class shape (no spaces between non-class chars)
// - at least one token is in our mapping (so we know it's worth touching)
// - no prose-y characters (commas, periods inside words, apostrophes, etc.)
const CLASS_TOKEN_RE = /^[a-z0-9:/\[\]_.()@&%-]+$/i;
function looksLikeClassString(s) {
  if (!s || s.length === 0) return false;
  if (/["<>{}=,;]/.test(s)) return false; // commas/quotes/etc → prose or JSX
  const tokens = s.trim().split(/\s+/);
  if (tokens.length === 0) return false;
  let anyKnown = false;
  for (const t of tokens) {
    if (!CLASS_TOKEN_RE.test(t)) return false;
    if (mapping[t]) anyKnown = true;
  }
  return anyKnown;
}

function processFile(file) {
  const src = fs.readFileSync(file, "utf-8");
  let out = src;
  let changes = 0;

  // Pass 1: className="..."
  out = out.replace(/className="([^"]+)"/g, (m, classes) => {
    const rewritten = rewriteClassString(classes);
    if (rewritten === null || rewritten === classes) return m;
    changes++;
    return `className="${rewritten}"`;
  });

  // Pass 2: className={`...`} (only when no ${...}, full-string rewrite)
  out = out.replace(/className=\{`([^`]*?)`\}/g, (m, classes) => {
    if (classes.includes("${")) return m;
    const rewritten = rewriteClassString(classes);
    if (rewritten === null || rewritten === classes) return m;
    changes++;
    return `className={\`${rewritten}\`}`;
  });

  // Pass 3: any "..." or '...' string literal that looks like a Tailwind
  // class string — covers ternary branches inside template literals
  // (e.g. `condition ? "bg-white" : "bg-gray-100"`) plus standalone class
  // constant strings.
  out = out.replace(/(["'])([^"'\n]+?)\1/g, (m, q, str) => {
    if (!looksLikeClassString(str)) return m;
    const rewritten = rewriteClassString(str);
    if (rewritten === null || rewritten === str) return m;
    changes++;
    return `${q}${rewritten}${q}`;
  });

  if (out !== src) {
    fs.writeFileSync(file, out);
    console.log(`  ${file}  (${changes} class strings updated)`);
  } else {
    console.log(`  ${file}  (no change)`);
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node scripts/apply-dark-variants.mjs <file> [file ...]");
  process.exit(1);
}
for (const f of files) processFile(f);
