# Exercise catalog

`gym-workout-catalog.md` is the **master list of exercises**. It is hand-edited
and versioned via its own frontmatter (`version`, `last_updated`,
`exercise_count`); new exercises and new parameters land here first, then flow
into the app.

```
docs/catalog/gym-workout-catalog.md   ← authored here (source of truth)
          │
          │  pnpm catalog:build   (Phase 1)
          ▼
src/db/seed/exercises.generated.ts    ← never hand-edited
          │
          ▼
SQLite `exercises` + `exercise_parameters`
```

Nothing reads the markdown at runtime. The build step parses it once and emits
typed TypeScript, so a malformed row fails at build time rather than in a gym.

## Updating

1. Edit `gym-workout-catalog.md` — add rows, or add a parameter to the
   conventions table first if it is new.
2. Bump `version` and `last_updated`, and correct `exercise_count`.
3. Re-run the build step. It re-checks that every parameter used in a row is
   declared in the conventions table, and that `exercise_count` matches.

Adding an exercise is additive and safe. Adding a **parameter** is not — it may
need a new input control and a migration, so treat those as schema changes.

## Structure

Frontmatter, then a **parameter conventions** table defining all 28 parameters,
then one `## Group` section per muscle group, then example records and
implementation notes.

Every exercise row is `| Workout | Equipment | Parameters |`, where Parameters
is a comma-separated list of `name:type` entries. A trailing `?` marks the
parameter optional; braces mean choose-one, as in `rep_unit:{jumps|seconds}`.

```
| Assisted Pull-Up | Assisted machine | `sets:int, reps:int, assistance_kg:decimal, rest_sec:int?` |
```

## Current contents

157 exercises across 9 groups: Chest, Back, Shoulders and Traps, Biceps
Triceps and Forearms, Legs and Glutes, Core, Full-Body Functional and
Plyometric, Cardio, Mobility and Warm-Up.

## Resolutions

Every rule below lives in `src/catalog/taxonomy.ts`, and `pnpm catalog:check`
enforces it. See `docs/ARCHITECTURE.md` §3 for the resulting schema.

**Group taxonomy.** The catalog's nine spellings stay canonical so a re-import
is lossless; `GROUP_LABEL` maps them to the short chip labels the design draws.
Seven match the prototype exactly; Full body and Mobility are added. The chip
row already scrolls, so two more chips cost nothing.

**Parameter model.** Split in two: `exercise_params` is the *form* schema
(generated from the catalog, drives which inputs render), `session_sets` is the
*storage* schema (fixed columns plus an `extras` JSON blob). Seven parameters
earn columns on frequency; the other sixteen — used by ≤19 exercises, several
by one — go in `extras`. Four aliases normalise on import so progression maths
reads one field.

**Duration-first exercises.** Formalised as six `logging_shape` values derived
from each exercise's required parameters. `cardio` (19 exercises) has no sets
and needs its own screen treatment rather than a set-row variant.

**Equipment.** `equipment_raw` keeps the catalog string verbatim; an ordered
rule list narrows it to one of nine tags for the filter and the detail pill.
Order matters — "Cable machine" must reach Cable before Machine, and
"Bodyweight or barbell" must reach Barbell so the tag names the loadable
option. Eleven genuinely miscellaneous implements (sled, sandbag, battle ropes,
medicine ball, ab wheel, jump rope, foam roller, plate/vest) stay `Other`.

**`jumps` / `rep_unit`.** This was two defects, not one. `jumps` was declared
and unused, and `rep_unit` — used by Skipping and described in the notation
paragraph — was never declared at all. Resolved in **catalog v1.1** by
replacing the `jumps` row with a `rep_unit` row. `reps` + `rep_unit` is the
better model anyway: one exercise can be logged either way. The checker now
fails on any used-but-undeclared parameter, so this class of drift cannot
return.

## Checking

```bash
pnpm catalog:check
```

Verifies `exercise_count` matches the parsed rows, that every used parameter is
declared and vice versa, that every parameter has a storage rule, and that no
exercise name is duplicated. It also prints the group, shape and equipment
breakdown, and lists anything that fell through to `Other`.
