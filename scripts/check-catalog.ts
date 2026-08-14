/**
 * Validates docs/catalog/gym-workout-catalog.md against the resolutions in
 * src/catalog/taxonomy.ts. Run with `pnpm catalog:check`.
 *
 * Exits non-zero on any error, so a malformed catalog fails at build time
 * rather than in a gym.
 */

import { readFileSync } from 'node:fs';
import { parseCatalog } from '../src/catalog/parse.ts';
import { DERIVED_PARAMS, EXTRA_PARAMS, GROUP_LABEL, PARAM_ALIASES, SET_COLUMNS } from '../src/catalog/taxonomy.ts';

const PATH = 'docs/catalog/gym-workout-catalog.md';
const { frontmatter, declared, exercises } = parseCatalog(readFileSync(PATH, 'utf8'));

const errors: string[] = [];
const warnings: string[] = [];

// ── counts ───────────────────────────────────────────────────
if (exercises.length !== frontmatter.exerciseCount) {
  errors.push(`frontmatter says exercise_count: ${frontmatter.exerciseCount}, parsed ${exercises.length}`);
}
if (frontmatter.unitSystem !== 'metric') {
  errors.push(`unit_system must be metric, got "${frontmatter.unitSystem}"`);
}

// ── every used parameter is declared, and vice versa ─────────
const used = new Set(exercises.flatMap((e) => e.params.map((p) => p.name)));
for (const p of used) {
  if (!declared.includes(p)) errors.push(`parameter "${p}" is used but not declared in the conventions table`);
}
for (const p of declared) {
  if (!used.has(p)) warnings.push(`parameter "${p}" is declared but no exercise uses it`);
}

// ── every parameter has somewhere to live ────────────────────
const known = new Set<string>([
  ...SET_COLUMNS,
  ...Object.keys(PARAM_ALIASES),
  ...DERIVED_PARAMS,
  ...EXTRA_PARAMS,
  'sets', // a routine target, not a logged value
]);
for (const p of used) {
  if (!known.has(p)) errors.push(`parameter "${p}" has no storage rule in taxonomy.ts`);
}

// ── duplicates ───────────────────────────────────────────────
const seen = new Map<string, string>();
for (const e of exercises) {
  const prev = seen.get(e.name);
  if (prev) errors.push(`duplicate exercise "${e.name}" in ${prev} and ${e.group}`);
  seen.set(e.name, e.group);
}

// ── report ───────────────────────────────────────────────────
const byShape = new Map<string, number>();
const byEquipment = new Map<string, number>();
const byGroup = new Map<string, number>();
for (const e of exercises) {
  byShape.set(e.shape, (byShape.get(e.shape) ?? 0) + 1);
  byEquipment.set(e.equipment, (byEquipment.get(e.equipment) ?? 0) + 1);
  byGroup.set(e.group, (byGroup.get(e.group) ?? 0) + 1);
}
const desc = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]);

console.log(`catalog v${frontmatter.version} — ${exercises.length} exercises, ${declared.length} parameters\n`);

console.log('groups');
for (const [g, n] of desc(byGroup)) console.log(`  ${String(n).padStart(4)}  ${GROUP_LABEL[g as keyof typeof GROUP_LABEL]}  (${g})`);

console.log('\nlogging shapes');
for (const [s, n] of desc(byShape)) console.log(`  ${String(n).padStart(4)}  ${s}`);

console.log('\nequipment');
for (const [q, n] of desc(byEquipment)) console.log(`  ${String(n).padStart(4)}  ${q}`);

const other = exercises.filter((e) => e.equipment === 'Other');
if (other.length) {
  console.log(`\nfell through to "Other" (${other.length}) — add a rule if any of these should be tagged:`);
  for (const e of other) console.log(`  ${e.name}  ·  "${e.equipmentRaw}"`);
}

if (warnings.length) {
  console.log('\nwarnings');
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log('\nerrors');
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nok — catalog is consistent with taxonomy.ts');
