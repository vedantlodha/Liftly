/**
 * Generates src/db/seed/exercises.generated.ts from the catalog markdown.
 * Run with `pnpm catalog:build`.
 *
 * IDs are a deterministic hash of the exercise name, so re-running produces
 * byte-identical output and re-seeding never duplicates a row.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseCatalog } from '../src/catalog/parse.ts';

const SOURCE = 'docs/catalog/gym-workout-catalog.md';
const OUT = 'src/db/seed/exercises.generated.ts';

/** UUID-shaped, derived from a namespace and key. Stable across runs and machines. */
function stableId(namespace: string, key: string): string {
  const h = createHash('sha1').update(`${namespace}:${key}`).digest('hex');
  return [h.slice(0, 8), h.slice(8, 12), `5${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)].join('-');
}

const { frontmatter, exercises } = parseCatalog(readFileSync(SOURCE, 'utf8'));

const body = exercises
  .map((e) => {
    const params = e.params
      .map((p) => {
        const choices = p.choices ? `, choices: ${JSON.stringify(p.choices)}` : '';
        return `      { param: ${JSON.stringify(p.name)}, type: ${JSON.stringify(p.type)}, required: ${!p.optional}${choices} },`;
      })
      .join('\n');
    return `  {
    id: '${stableId('exercise', e.name)}',
    name: ${JSON.stringify(e.name)},
    catalogGroup: ${JSON.stringify(e.group)},
    equipment: ${JSON.stringify(e.equipment)},
    equipmentRaw: ${JSON.stringify(e.equipmentRaw)},
    loggingShape: ${JSON.stringify(e.shape)},
    params: [
${params}
    ],
  },`;
  })
  .join('\n');

const out = `// GENERATED FILE — do not edit.
// Source: ${SOURCE} (v${frontmatter.version}, ${frontmatter.lastUpdated})
// Regenerate with \`pnpm catalog:build\`.

import type { Equipment, LoggingShape } from '@/catalog/taxonomy';

export const CATALOG_VERSION = ${JSON.stringify(frontmatter.version)};

export type SeedParam = {
  param: string;
  type: string;
  required: boolean;
  choices?: string[];
};

export type SeedExercise = {
  id: string;
  name: string;
  catalogGroup: string;
  equipment: Equipment;
  equipmentRaw: string;
  loggingShape: LoggingShape;
  params: SeedParam[];
};

export const SEED_EXERCISES: SeedExercise[] = [
${body}
];
`;

mkdirSync('src/db/seed', { recursive: true });
writeFileSync(OUT, out);
console.log(`wrote ${OUT} — ${exercises.length} exercises from catalog v${frontmatter.version}`);
