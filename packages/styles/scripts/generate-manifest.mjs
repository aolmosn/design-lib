/**
 * generate-manifest.mjs
 *
 * Build script for @aolmosn/styles.
 * 1. Compiles each utility SCSS file independently → extracts all class names per group
 * 2. Compiles the full bundle → dist/styles.css
 * 3. Writes dist/manifest.json with every purgeable class name, grouped by category
 *
 * Usage:  node scripts/generate-manifest.mjs
 */

import * as sass from 'sass';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Utility files to process, in order ───────────────────────────────
const UTILITY_GROUPS = {
  layout:     'src/utilities/_layout.scss',
  spacing:    'src/utilities/_spacing.scss',
  typography: 'src/utilities/_typography.scss',
  colors:     'src/utilities/_colors.scss',
  borders:    'src/utilities/_borders.scss',
  shadows:    'src/utilities/_shadows.scss',
};

// ── Extract class names from compiled CSS ─────────────────────────────
// Matches selectors like  .flex-col  .sm\:flex-col  .w-full
// Handles escaped colons in responsive variants (sm\:, md\:, etc.)
function extractClasses(css) {
  const classes = new Set();

  // Pattern breakdown:
  //   \.           → literal dot (class selector start)
  //   ([-\w]+      → base name: letters, digits, hyphens, underscores
  //   (?:\\:[-\w]+)?) → optional responsive prefix like sm\:flex-col (escaped colon)
  const selectorRe = /\.([-\w]+(?:\\:[-\w]+)?)/g;
  let m;
  while ((m = selectorRe.exec(css)) !== null) {
    // Unescape: sm\:flex-col → sm:flex-col
    const name = m[1].replace(/\\:/g, ':');
    classes.add(name);
  }

  return [...classes].sort();
}

// ── Compile a single SCSS file ────────────────────────────────────────
function compileSass(filePath) {
  return sass.compile(filePath, {
    // Allow each utility file to resolve its own @use '../mixins/...'
    style: 'expanded',
    quietDeps: true,
  }).css;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  await mkdir(resolve(ROOT, 'dist'), { recursive: true });

  const pkg = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf8'));

  // 1. Extract classes per group
  const groups = {};
  const allPurgeable = new Set();

  for (const [group, relPath] of Object.entries(UTILITY_GROUPS)) {
    const absPath = resolve(ROOT, relPath);
    try {
      const css = compileSass(absPath);
      const classes = extractClasses(css);
      groups[group] = classes;
      classes.forEach(c => allPurgeable.add(c));
      console.log(`  ✓ ${group.padEnd(12)} ${classes.length} classes`);
    } catch (err) {
      console.error(`  ✗ ${group}: ${err.message}`);
      groups[group] = [];
    }
  }

  // 2. Build the manifest
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    generatedAt: new Date().toISOString(),
    // All class names that CAN be safely purged from the final CSS
    purgeable: [...allPurgeable].sort(),
    // Class names that must never be removed regardless of usage scan
    // (empty for a pure-utility package — add here if needed)
    protected: [],
    // Same classes, grouped by source file for human reference
    groups,
  };

  await writeFile(
    resolve(ROOT, 'dist/manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\n  ✓ manifest.json  — ${allPurgeable.size} purgeable classes`);

  // 3. Compile full CSS bundle
  const fullCss = compileSass(resolve(ROOT, 'src/index.scss'));
  await writeFile(resolve(ROOT, 'dist/styles.css'), fullCss);
  console.log(`  ✓ styles.css     — ${(fullCss.length / 1024).toFixed(1)} kB`);

  // Minified copy
  const minCss = sass.compile(resolve(ROOT, 'src/index.scss'), {
    style: 'compressed',
    quietDeps: true,
  }).css;
  await writeFile(resolve(ROOT, 'dist/styles.min.css'), minCss);
  console.log(`  ✓ styles.min.css — ${(minCss.length / 1024).toFixed(1)} kB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
