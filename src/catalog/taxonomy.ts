/**
 * Resolutions for the ambiguities in `docs/catalog/gym-workout-catalog.md`.
 *
 * The catalog is authored for humans: groups are spelled out, equipment is free
 * text, and each exercise lists its own parameters. This module is the single
 * place those become machine values. The Phase 1 importer reads the markdown,
 * runs it through here, and emits the seed — so changing a rule here changes
 * the whole catalog consistently.
 */

// ─────────────────────────────────────────────────────────────
// Groups — catalog spelling is canonical, chips get a short label
// ─────────────────────────────────────────────────────────────

/** Verbatim `## Section` headings, so a re-import is lossless. */
export const CATALOG_GROUPS = [
  'Chest',
  'Back',
  'Shoulders and Traps',
  'Biceps, Triceps, and Forearms',
  'Legs and Glutes',
  'Core',
  'Full-Body, Functional, and Plyometric',
  'Cardio',
  'Mobility and Warm-Up',
] as const;

export type CatalogGroup = (typeof CATALOG_GROUPS)[number];

/**
 * Short labels for the Library's filter chips. The design draws seven; the
 * catalog has nine, so Full body and Mobility are added. The chip row already
 * scrolls horizontally, so the two extra chips cost nothing.
 */
export const GROUP_LABEL: Record<CatalogGroup, string> = {
  Chest: 'Chest',
  Back: 'Back',
  'Shoulders and Traps': 'Shoulders',
  'Biceps, Triceps, and Forearms': 'Arms',
  'Legs and Glutes': 'Legs',
  Core: 'Core',
  'Full-Body, Functional, and Plyometric': 'Full body',
  Cardio: 'Cardio',
  'Mobility and Warm-Up': 'Mobility',
};

/** Chip order for the Library, after "All". */
export const GROUP_ORDER: CatalogGroup[] = [...CATALOG_GROUPS];

// ─────────────────────────────────────────────────────────────
// Equipment — 84 free-text strings down to one tag
// ─────────────────────────────────────────────────────────────

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Band',
  'Cardio',
  'Other',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

/**
 * Ordered rules — first match wins, tested against the lowercased raw string.
 * Order matters: "Cable machine" must hit Cable before Machine, and
 * "Bodyweight or barbell" must hit Barbell before Bodyweight so the tag names
 * the loadable option.
 */
const EQUIPMENT_RULES: [RegExp, Equipment][] = [
  [/\b(treadmill|elliptical|stair machine|rowing ergometer|ski ergometer|exercise bike|spin bike|recumbent bike|bicycle|arm bike|cardio machines?|pool|step platform)\b/, 'Cardio'],
  [/\bcable\b/, 'Cable'],
  [/\bkettlebell\b/, 'Kettlebell'],
  [/\b(barbell|ez bar|smith machine|trap bar|landmine|t-bar)\b/, 'Barbell'],
  [/\bdumbbell/, 'Dumbbell'],
  [/\b(band|dowel)\b/, 'Band'],
  [/\bmachine\b/, 'Machine'],
  [/\b(pec deck|captain’s chair|captain's chair|roman chair)\b/, 'Machine'],
  [/\b(bodyweight|none|mat|pull-up bar|pull-up station|dip bars|open floor|support bar|wall or wedge|bench or partner)\b/, 'Bodyweight'],
  // Last resort before Other: a bare bench or box is a surface, not equipment —
  // loaded variants ("Barbell, bench") already matched their implement above.
  [/\b(bench|box)\b/, 'Bodyweight'],
];

/** Maps a catalog equipment string to the single tag the design renders. */
export function normalizeEquipment(raw: string): Equipment {
  const s = raw.toLowerCase();
  for (const [re, tag] of EQUIPMENT_RULES) if (re.test(s)) return tag;
  return 'Other';
}

// ─────────────────────────────────────────────────────────────
// Logging shapes — how the active-workout screen renders a set
// ─────────────────────────────────────────────────────────────

/**
 * The 157 exercises reduce to 13 distinct required-parameter signatures, which
 * reduce to these six shapes. Each is a different row renderer.
 *
 * This replaces the three-way `set_type` enum in the original plan: that could
 * not express assisted work, carries, or a cardio session with no sets at all.
 */
export const LOGGING_SHAPES = [
  /** weight × reps. The classic, 85 exercises. */
  'weight_reps',
  /** reps, with optional added weight. Bodyweight work, 39 exercises. */
  'reps',
  /** reps against machine assistance — less assistance is progress. 2 exercises. */
  'assisted',
  /** a timed hold, no reps. Planks, dead hangs, stretches. 8 exercises. */
  'hold',
  /** loaded distance or time. Carries and sleds. 4 exercises. */
  'carry',
  /** one continuous effort, no sets. 19 exercises. */
  'cardio',
] as const;

export type LoggingShape = (typeof LOGGING_SHAPES)[number];

/** True when the shape logs discrete sets. `cardio` is the only one that does not. */
export function hasSets(shape: LoggingShape): boolean {
  return shape !== 'cardio';
}

/**
 * Derives the shape from an exercise's required parameters.
 *
 * `kettlebell_weight_kg` and `ball_weight_kg` are just `weight_kg` wearing the
 * implement's name, so they fold into `weight_reps`.
 */
export function deriveLoggingShape(required: readonly string[]): LoggingShape {
  const has = (p: string) => required.includes(p);
  const anyWeight = has('weight_kg') || has('kettlebell_weight_kg') || has('ball_weight_kg');

  if (has('duration_min') || has('rounds')) return 'cardio';
  if (has('assistance_kg')) return 'assisted';
  if (anyWeight && (has('distance_m') || !has('reps'))) return 'carry';
  if (anyWeight) return 'weight_reps';
  if (has('duration_sec')) return 'hold';
  return 'reps';
}

// ─────────────────────────────────────────────────────────────
// Parameter storage — form schema vs storage schema
// ─────────────────────────────────────────────────────────────

/**
 * Parameters promoted to real columns on `session_sets`. Everything else goes
 * into the `extras` JSON blob.
 *
 * Chosen by frequency across the catalog: these cover every exercise's primary
 * measurements, while the 16 in the tail are used by 19 exercises or fewer —
 * several by exactly one. Giving those their own columns would mean 20-odd
 * always-null fields and a migration every time the catalog gains a parameter.
 */
export const SET_COLUMNS = ['reps', 'weight_kg', 'duration_sec', 'distance_m', 'rpe', 'rest_sec', 'side'] as const;

/**
 * Catalog parameters that are stored under a different name, so everything
 * lands in SI and progression math has one field to read.
 */
export const PARAM_ALIASES: Record<string, { column: (typeof SET_COLUMNS)[number]; scale: number }> = {
  kettlebell_weight_kg: { column: 'weight_kg', scale: 1 },
  ball_weight_kg: { column: 'weight_kg', scale: 1 },
  duration_min: { column: 'duration_sec', scale: 60 },
  distance_km: { column: 'distance_m', scale: 1000 },
};

/**
 * Derived at read time rather than stored — both are a ratio of distance to
 * duration, and storing them invites the three values disagreeing.
 */
export const DERIVED_PARAMS = ['speed_kph', 'pace_min_per_km'] as const;

/** Everything else the catalog can attach to a set, kept in `extras`. */
export const EXTRA_PARAMS = [
  'assistance_kg',
  'band_level',
  'box_height_cm',
  'cadence_rpm',
  'calories_kcal',
  'floors',
  'heart_rate_bpm',
  'incline_pct',
  'rep_unit',
  'resistance_level',
  'rounds',
  'steps',
  'stroke_rate_spm',
  'work_sec',
] as const;
