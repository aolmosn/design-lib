#!/usr/bin/env node
// Parsea src/tokens.css y regenera src/index.ts.
// Uso: node scripts/generate-tokens.mjs   (o `npm run generate` en packages/tokens)
//
// tokens.css puede anidar la salida con marcadores en comentarios:
//   /* @group semanticos */ ... /* @endgroup */
//   /* @group semanticos.surface */ ... /* @endgroup */   (path con puntos = varios niveles)
//   /* @group primitivos:scale */ ... /* @endgroup */     (":scale" separa --wk-green-500 en green['500'])

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(__dirname, '..', 'src', 'tokens.css');
const TS_PATH = join(__dirname, '..', 'src', 'index.ts');

function toCamelCase(parts) {
  return parts
    .map((part, i) => (i === 0 || /^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function varNameParts(cssVarName) {
  return cssVarName.replace(/^--/, '').split('-');
}

// Dentro de un grupo ":scale", separa --wk-green-500 en familia "green" + shade "500".
// Si no termina en número (--wk-white), no hay shade y queda como key plana en el grupo.
function splitScale(cssVarName) {
  const allParts = varNameParts(cssVarName);
  const parts = ['wk', 'ui'].includes(allParts[0]) ? allParts.slice(1) : allParts;
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && /^\d+$/.test(last)) {
    return { extraPath: [toCamelCase(parts.slice(0, -1))], key: last };
  }
  return { extraPath: [], key: toCamelCase(parts) };
}

function parseTokens(css) {
  const marker = /\/\*\s*@group\s+([\w.:]+)\s*\*\/|\/\*\s*@endgroup\s*\*\/|(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  const leaves = []; // { path: string[], key, cssVarName, value }
  const seenVarNames = new Set();
  const seenLeafPaths = new Map(); // "path.key" -> cssVarName (collision check)
  const stack = []; // { segments: string[], scale: boolean }

  let match;
  while ((match = marker.exec(css))) {
    const [full, groupSpec, cssVarName, rawValue] = match;

    if (groupSpec !== undefined) {
      const scale = groupSpec.endsWith(':scale');
      const segments = (scale ? groupSpec.slice(0, -':scale'.length) : groupSpec).split('.');
      for (const segment of segments) {
        if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment)) {
          throw new Error(
            `Nombre de grupo inválido "${segment}" en "/* @group ${groupSpec} */". Usá "." para anidar (ej. "semanticos.surface") y ":scale" solo como sufijo final (ej. "primitivos:scale").`
          );
        }
      }
      stack.push({ segments, scale });
      continue;
    }

    if (full.includes('@endgroup')) {
      if (stack.length === 0) throw new Error('`@endgroup` sin `@group` abierto en tokens.css.');
      stack.pop();
      continue;
    }

    if (seenVarNames.has(cssVarName)) continue; // keep first-seen (default/light) value
    seenVarNames.add(cssVarName);

    const basePath = stack.flatMap((f) => f.segments);
    const top = stack[stack.length - 1];
    const { extraPath, key } = top?.scale ? splitScale(cssVarName) : { extraPath: [], key: toCamelCase(varNameParts(cssVarName)) };
    const path = [...basePath, ...extraPath];

    const leafId = [...path, key].join('.');
    const existing = seenLeafPaths.get(leafId);
    if (existing) {
      throw new Error(`Token key collision: "${cssVarName}" and "${existing}" both map to "tokens.${leafId}".`);
    }
    seenLeafPaths.set(leafId, cssVarName);

    leaves.push({ path, key, cssVarName, value: rawValue.trim() });
  }

  if (stack.length > 0) {
    throw new Error(`${stack.length} bloque(s) "@group" sin cerrar con "@endgroup" en tokens.css.`);
  }

  return leaves;
}

// Arma un árbol { __leaves: [...], children: Map<name, node> } a partir de los paths.
function buildTree(leaves) {
  const root = { children: new Map(), leaves: [] };
  for (const leaf of leaves) {
    let node = root;
    for (const segment of leaf.path) {
      if (!node.children.has(segment)) node.children.set(segment, { children: new Map(), leaves: [] });
      node = node.children.get(segment);
    }
    node.leaves.push(leaf);
  }
  return root;
}

function renderNode(node, indent) {
  const pad = '  '.repeat(indent);
  const lines = [];

  for (const leaf of node.leaves) {
    const comment = leaf.value.replace(/\s+/g, ' ');
    lines.push(`${pad}${leaf.key}: 'var(${leaf.cssVarName})', // ${comment}`);
  }

  for (const [name, child] of node.children.entries()) {
    lines.push(`${pad}${name}: {`);
    lines.push(...renderNode(child, indent + 1));
    lines.push(`${pad}},`);
  }

  return lines;
}

function generateTs(leaves) {
  const tree = buildTree(leaves);
  const lines = [
    '// AUTO-GENERADO desde tokens.css — no editar a mano.',
    '// Regenerar con: npm run generate --workspace=packages/tokens',
    '',
    'export const tokens = {',
    ...renderNode(tree, 1),
    '} as const;',
    '',
  ];
  return lines.join('\n');
}

const css = readFileSync(CSS_PATH, 'utf8');
const leaves = parseTokens(css);
const ts = generateTs(leaves);
writeFileSync(TS_PATH, ts);

console.log(`Generado ${TS_PATH} con ${leaves.length} tokens.`);
