/**
 * Parser for `docs/catalog/gym-workout-catalog.md`.
 *
 * Pure — takes the markdown as a string and returns typed rows. Used by the
 * catalog checker and, in Phase 1, by the seed generator. Nothing reads the
 * markdown at runtime.
 */

import {
  CATALOG_GROUPS,
  deriveLoggingShape,
  normalizeEquipment,
  type CatalogGroup,
  type Equipment,
  type LoggingShape,
} from './taxonomy.ts';

export type CatalogParam = {
  name: string;
  /** `int`, `decimal`, `enum`, `text`, `duration`, or a `{a|b}` choice set. */
  type: string;
  optional: boolean;
  /** Present when the type was written as `{jumps|seconds}`. */
  choices?: string[];
};

export type CatalogExercise = {
  name: string;
  group: CatalogGroup;
  /** Verbatim from the Equipment column — never discarded. */
  equipmentRaw: string;
  equipment: Equipment;
  params: CatalogParam[];
  shape: LoggingShape;
};

export type CatalogFrontmatter = {
  version: string;
  lastUpdated: string;
  exerciseCount: number;
  unitSystem: string;
};

export type ParsedCatalog = {
  frontmatter: CatalogFrontmatter;
  /** Parameter names declared in the conventions table. */
  declared: string[];
  exercises: CatalogExercise[];
};

const GROUP_SET = new Set<string>(CATALOG_GROUPS);
const ROW = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*`(.+?)`\s*\|\s*$/;
const CONVENTION_ROW = /^\|\s*`([a-z_]+)`\s*\|/;
const PARAM = /^([a-z_]+):(.+?)(\?)?$/;

function parseFrontmatter(src: string): CatalogFrontmatter {
  const m = /^---\n([\s\S]*?)\n---/.exec(src);
  if (!m?.[1]) throw new Error('catalog is missing frontmatter');
  const get = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(m[1]!)?.[1]?.trim() ?? '';
  return {
    version: get('version'),
    lastUpdated: get('last_updated'),
    exerciseCount: Number(get('exercise_count')),
    unitSystem: get('unit_system'),
  };
}

/** Splits a parameter list, respecting the braces in `rep_unit:{jumps|seconds}`. */
function splitParams(spec: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of spec) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      out.push(buf.trim());
      buf = '';
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function parseParam(raw: string): CatalogParam | null {
  const m = PARAM.exec(raw);
  if (!m?.[1] || !m[2]) return null;
  const type = m[2];
  const choice = /^\{(.+)\}$/.exec(type);
  return {
    name: m[1],
    type,
    optional: Boolean(m[3]),
    ...(choice?.[1] ? { choices: choice[1].split('|').map((c) => c.replace(/\\/g, '').trim()) } : {}),
  };
}

export function parseCatalog(src: string): ParsedCatalog {
  const frontmatter = parseFrontmatter(src);
  const declared: string[] = [];
  const exercises: CatalogExercise[] = [];

  let group: CatalogGroup | null = null;
  let inConventions = false;

  for (const line of src.split('\n')) {
    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      inConventions = heading === 'Parameter conventions';
      group = GROUP_SET.has(heading) ? (heading as CatalogGroup) : null;
      continue;
    }

    if (inConventions) {
      const c = CONVENTION_ROW.exec(line);
      if (c?.[1]) declared.push(c[1]);
      continue;
    }

    if (!group) continue;
    const m = ROW.exec(line);
    if (!m?.[1] || !m[2] || !m[3]) continue;

    const params = splitParams(m[3])
      .map(parseParam)
      .filter((p): p is CatalogParam => p !== null);
    if (params.length === 0) continue;

    const required = params.filter((p) => !p.optional).map((p) => p.name);
    exercises.push({
      name: m[1],
      group,
      equipmentRaw: m[2],
      equipment: normalizeEquipment(m[2]),
      params,
      shape: deriveLoggingShape(required),
    });
  }

  return { frontmatter, declared, exercises };
}
