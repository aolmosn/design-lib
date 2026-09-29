#!/usr/bin/env node
/**
 * @aolmosn/styles — Purge CLI
 *
 * Scans your source files for the utility classes you actually use,
 * then produces a minimal CSS containing only those rules.
 *
 * Usage (from your project root):
 *   node node_modules/@aolmosn/styles/bin/purge.mjs [options]
 *
 * Options:
 *   --src <path>       Directory to scan  (default: ./src)
 *   --out <path>       Output CSS file    (default: ./src/styles-purged.css)
 *   --ext <list>       Extensions to scan (default: html,ts,scss)
 *   --safelist <list>  Classes to always keep, comma-separated
 *   --verbose          Print every kept/dropped class
 *   --help             Show this message
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT  = resolve(__dirname, '..');

// ── CLI arg parser ────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { src: './src', out: './src/styles-purged.css',
                 ext: ['html', 'ts', 'scss'], safelist: [], verbose: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--src':      args.src      = argv[++i]; break;
      case '--out':      args.out      = argv[++i]; break;
      case '--ext':      args.ext      = argv[++i].split(',').map(e => e.trim()); break;
      case '--safelist': args.safelist = argv[++i].split(',').map(c => c.trim()); break;
      case '--verbose':  args.verbose  = true; break;
      case '--help':
        console.log(HELP); process.exit(0);
    }
  }
  return args;
}

const HELP = `
@aolmosn/styles — purge

  node node_modules/@aolmosn/styles/bin/purge.mjs [options]

Options:
  --src <path>       Source directory to scan          (default: ./src)
  --out <path>       Output CSS file path              (default: ./src/styles-purged.css)
  --ext <list>       Comma-separated file extensions   (default: html,ts,scss)
  --safelist <list>  Classes to always keep            (default: none)
  --verbose          List every kept / dropped class
  --help             Show this help
`.trim();

// ── CSS block parser ──────────────────────────────────────────────────
// Splits flat (post-sass) CSS into top-level blocks.
// Each block is: { header: string, text: string, isAtRule: boolean }

function parseTopLevel(css) {
  const blocks = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const text = css.slice(start, i + 1).trim();
        if (text) {
          const brace  = text.indexOf('{');
          const header = text.slice(0, brace).trim();
          blocks.push({ header, text, isAtRule: header.startsWith('@') });
        }
        start = i + 1;
      }
    }
  }
  return blocks;
}

// ── Class name helpers ────────────────────────────────────────────────

// Extract unescaped class names from a CSS selector string.
// .sm\:flex-col  →  'sm:flex-col'
function classesInSelector(selector) {
  const names = [];
  const re = /\.([-\w]+(?:\\:[-\w]+)?)/g;
  let m;
  while ((m = re.exec(selector)) !== null) {
    names.push(m[1].replace(/\\:/g, ':'));
  }
  return names;
}

// ── Purge logic ───────────────────────────────────────────────────────

/**
 * Decide whether to keep a CSS rule block.
 *
 * Rules:
 *  • If the selector contains NO class from purgeableSet → always keep
 *    (e.g. :root vars, base element styles — nothing to purge here)
 *  • If the selector contains a class from purgeableSet:
 *    → keep only if at least one of those classes is also in usedSet
 */
function shouldKeepSelector(selector, purgeableSet, usedSet) {
  const classes = classesInSelector(selector);
  if (classes.length === 0) return true;

  const hasPurgeable = classes.some(c => purgeableSet.has(c));
  if (!hasPurgeable) return true;

  return classes.some(c => usedSet.has(c));
}

/**
 * Filter one top-level CSS block.
 * Returns the (possibly re-written) block text, or null to drop it.
 */
function filterBlock(block, purgeableSet, usedSet) {
  if (!block.isAtRule) {
    // Simple rule: .flex-col { ... }
    return shouldKeepSelector(block.header, purgeableSet, usedSet)
      ? block.text
      : null;
  }

  // @media (or @supports, @layer …): filter inner rules
  if (block.header.startsWith('@media') || block.header.startsWith('@supports') || block.header.startsWith('@layer')) {
    const openBrace = block.text.indexOf('{');
    const atHeader  = block.text.slice(0, openBrace + 1).trim();
    const body      = block.text.slice(openBrace + 1, block.text.lastIndexOf('}'));

    const inner = parseTopLevel(body);
    const kept  = inner
      .map(b => filterBlock(b, purgeableSet, usedSet))
      .filter(Boolean);

    if (kept.length === 0) return null;
    return atHeader + '\n' + kept.map(t => '  ' + t.replace(/\n/g, '\n  ')).join('\n') + '\n}';
  }

  // Other at-rules (@keyframes, @font-face, @charset …) — always keep
  return block.text;
}

// ── Source file scanner ───────────────────────────────────────────────

function scanContent(content, purgeableSet, foundSet) {
  // Match any token that could be a class name, including responsive sm:flex-col
  const re = /([a-zA-Z][a-zA-Z0-9_-]*(?::[a-zA-Z][a-zA-Z0-9_-]*)?)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    if (purgeableSet.has(m[1])) foundSet.add(m[1]);
  }
}

async function scanDirectory(dir, extensions, purgeableSet) {
  const used = new Set();

  async function walk(current) {
    let entries;
    try { entries = await readdir(current, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        await walk(full);
      } else if (entry.isFile() && extensions.includes(extname(entry.name).slice(1))) {
        const content = await readFile(full, 'utf8').catch(() => '');
        scanContent(content, purgeableSet, used);
      }
    }
  }

  await walk(resolve(dir));
  return used;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Load manifest
  const manifestPath = resolve(PKG_ROOT, 'dist/manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    console.error(`✗ Could not read manifest at ${manifestPath}`);
    console.error('  Run: node node_modules/@aolmosn/styles/scripts/generate-manifest.mjs');
    process.exit(1);
  }

  const purgeableSet = new Set(manifest.purgeable);

  // Load full CSS
  const cssPath = resolve(PKG_ROOT, 'dist/styles.css');
  let css;
  try {
    css = await readFile(cssPath, 'utf8');
  } catch {
    console.error(`✗ Could not read CSS at ${cssPath}`);
    process.exit(1);
  }

  console.log(`\n@aolmosn/styles purge  v${manifest.version}`);
  console.log(`─────────────────────────────────────────`);
  console.log(`  manifest : ${purgeableSet.size} purgeable classes`);
  console.log(`  scanning : ${resolve(args.src)}  [${args.ext.join(', ')}]`);

  // Scan source files
  const usedClasses = await scanDirectory(args.src, args.ext, purgeableSet);

  // Apply safelist
  args.safelist.forEach(c => usedClasses.add(c));

  console.log(`  found    : ${usedClasses.size} classes used`);

  if (args.verbose) {
    const unused = [...purgeableSet].filter(c => !usedClasses.has(c));
    console.log(`\n  Used (${usedClasses.size}):`);
    [...usedClasses].sort().forEach(c => console.log(`    + ${c}`));
    console.log(`\n  Dropped (${unused.length}):`);
    unused.sort().forEach(c => console.log(`    - ${c}`));
  }

  // Filter CSS
  const blocks  = parseTopLevel(css);
  const kept    = blocks.map(b => filterBlock(b, purgeableSet, usedClasses)).filter(Boolean);
  const outCss  = [
    `/* @aolmosn/styles v${manifest.version} — purged build */`,
    `/* generated: ${new Date().toISOString()} */`,
    `/* classes used: ${usedClasses.size} / ${purgeableSet.size} */`,
    '',
    ...kept,
  ].join('\n');

  // Write output
  const outPath = resolve(args.out);
  await writeFile(outPath, outCss);

  const ratio = ((1 - outCss.length / css.length) * 100).toFixed(1);
  console.log(`  output   : ${outPath}`);
  console.log(`  original : ${(css.length / 1024).toFixed(1)} kB`);
  console.log(`  purged   : ${(outCss.length / 1024).toFixed(1)} kB  (−${ratio}%)`);
  console.log(`─────────────────────────────────────────\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
