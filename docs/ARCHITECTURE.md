# Liftly — Architecture & Tech Stack

Derived from the Claude Design prototype `design/Workout Tracker.dc.html`
(project `e30c8058-afdf-4c2d-8e33-972f4d5d15ac`).

The prototype's markup is the **visual spec**; its `renderVals()` method is the
**behavior spec**. `android-frame.jsx` (device bezel) and `support.js` (the
Design Component runtime) are prototype scaffolding and do not port.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | Expo (managed) + React Native + TypeScript (`strict`) |
| Build | Development build, **not** Expo Go — MMKV, notifications and Reanimated need native modules |
| Routing | `expo-router` (file-based) |
| State | Zustand + Immer |
| Database | `expo-sqlite` + Drizzle ORM + `drizzle-kit` migrations |
| Live session draft | Zustand `persist` → `react-native-mmkv` |
| Styling | `src/theme/tokens.ts` + `StyleSheet.create` + primitive components |
| Gestures | `react-native-gesture-handler` |
| Animation | `react-native-reanimated` v3 |
| Bottom sheets | `@gorhom/bottom-sheet` |
| Rest timer | `expo-notifications` (local) + `expo-keep-awake` + `expo-haptics` |
| Fonts | `@expo-google-fonts/archivo`, `@expo-google-fonts/dm-mono` |
| Dates | `date-fns` |
| Tests | Vitest (domain logic) + Maestro (E2E flows) |
| Backend | **None in v1.** Fully offline. |

### Why native, not a PWA

The rest timer is the load-bearing decision. You put the phone down between
sets and the screen locks; the timer has to fire a notification. iOS Safari
cannot do that reliably. Everything else — pointer-capture swipes,
drag-to-reorder, haptic on set-complete, keep-awake during a session — points
the same way.

---

## 2. Project structure

```
app/                         # expo-router
  (tabs)/
    index.tsx                # Today
    routines.tsx             # Routines
    schedule.tsx             # Schedule
    _layout.tsx              # custom pill tab bar
  session/
    active.tsx               # Active workout (fullscreen, no tabs)
    summary.tsx              # Post-session summary
  routine/[id].tsx           # Builder (also handles `new`)
  library/index.tsx
  history/index.tsx
  history/[id].tsx
  _layout.tsx                # providers: GH root, sheets, db, fonts
src/
  theme/tokens.ts            # colors, radii, type, spacing
  ui/                        # Text, Card, Button, Stat, Pill, Eyebrow,
                             # IconButton, Sheet, SwipeToDelete, Stepper, Toast
  db/
    schema.ts                # Drizzle tables
    migrations/
    seed/exercises.ts        # the 51 exercises from the prototype
    repositories/            # ALL data access goes through here
  stores/
    useSessionStore.ts       # live workout, MMKV-persisted
    useUiStore.ts            # sheets, toasts, keypad target
  domain/                    # pure, testable, zero RN imports
    volume.ts  reps.ts  reconcile.ts  weekPlan.ts  stats.ts
```

`src/domain/` is the rule that matters: the reconciliation logic, rep-range
math and volume aggregation are pure functions with no React and no SQLite, so
they can be unit-tested directly.

---

## 3. Data model

```
exercises        id, name, catalog_group, equipment, equipment_raw,
                 logging_shape, is_custom
exercise_params  exercise_id, param, type, unit, required, position
routines         id, name, tag
routine_items    id, routine_id, exercise_id, position,
                 target_sets, target_reps, target_weight, rest_seconds?
schedule_days    id, day_of_week (0–6), routine_id?,
                 override_routine_id?, override_week_start?
sessions         id, routine_id?, name, started_at, ended_at?,
                 paused_ms, status (active|completed|discarded)
session_exercises  id, session_id, exercise_id, position,
                   target_snapshot
session_sets     id, session_exercise_id, position, done, completed_at?,
                 reps?, weight_kg?, duration_sec?, distance_m?,
                 rpe?, rest_sec?, side?, extras (JSON)
session_changes  id, session_id, kind (sets|weight|swap|add), payload
```

Derived at query time, never stored: session volume, week stats, per-exercise
"last" and best set, and `speed_kph` / `pace_min_per_km` (both are just
distance over duration, and storing them invites the three disagreeing).

### How stores and SQLite relate

Screens read zustand stores synchronously and never await. The database is
loaded into those stores once at boot and written back afterwards:

```
migrate → seed → hydrateStores(db) → attachDatabase(db) → app renders
                                      └─ writes enabled only now
```

`src/db/persistence.ts` holds the attached handle and a serialised write queue.
Writes are fire-and-forget — the store has already updated, so the UI is
correct, and blocking a tap on a disk write would make logging a set feel
sluggish. A failed write is logged, not thrown; losing one write should not end
a workout in progress.

**No database attached is a supported state.** The web build has no SQLite, so
`persist()` is a no-op there and the app runs entirely in memory. Nothing
downstream branches on platform.

### Form schema vs storage schema

The catalog gives each of its 157 exercises its own parameter list, drawn from
a pool of 28. Those two concerns are deliberately split:

- **`exercise_params`** is the *form* schema — generated from the catalog, it
  tells the active-workout screen which inputs to render for an exercise.
- **`session_sets`** is the *storage* schema — a fixed, mostly-typed table.

Seven parameters earn real columns because they carry every exercise's primary
measurements. The remaining sixteen live in an `extras` JSON blob: each is used
by nineteen exercises or fewer, several by exactly one, so giving them columns
would mean twenty-odd perpetually-null fields and a migration every time the
catalog grows. `src/catalog/taxonomy.ts` holds the split, and
`pnpm catalog:check` fails the build if a parameter has no home.

Four catalog parameters are aliases that normalise on the way in, so
progression maths reads one field: `kettlebell_weight_kg` and `ball_weight_kg`
→ `weight_kg`, `duration_min` → `duration_sec` (×60), `distance_km` →
`distance_m` (×1000).

### Fixing what the prototype fakes

| Prototype | Real implementation |
|---|---|
| `tw` flag "reverts Monday" but never does | `override_week_start` date; an override is live only while it matches the current ISO week |
| Week stats hardcoded `'1'/'16'/'8.4'` | Aggregate over `session_sets` where `done` |
| Per-exercise `last: '77.5 × 8'` hardcoded | Query the most recent completed set for that exercise |
| Detail sheet best set / `'24'` times logged | Same — real aggregation |
| `reps` is an overloaded string: `'6–8'`, `'500m'`, `'30s'` | A `logging_shape` per exercise — see below. Cardio stops pretending to be a rep count |
| Single global 90s rest | `rest_seconds` per routine item, falling back to a user default |
| kg only | Store SI (kg, metres, seconds); convert at the display boundary only |

### Logging shapes

The catalog's 157 exercises reduce to 13 distinct required-parameter
signatures, and those reduce to six shapes. Each is a different set-row
renderer in the active workout — replacing the single `weight × reps` row the
prototype assumes:

| Shape | Count | Row |
|---|---|---|
| `weight_reps` | 85 | kg × reps — the classic |
| `reps` | 39 | reps, optional added weight |
| `cardio` | 19 | one continuous effort, **no sets at all** |
| `hold` | 8 | a duration, no reps (planks, dead hangs, stretches) |
| `carry` | 4 | load plus distance or time (carries, sleds) |
| `assisted` | 2 | reps against machine assistance, where *less* is progress |

`cardio` is the one that breaks the prototype's layout outright: nineteen
exercises have no `sets` parameter, so there is no set list to render. It needs
its own screen treatment, not a row variant.

---

## 4. Local-only now, sync-ready later

Three things are cheap today and expensive to retrofit. Everything else waits.

1. **UUID primary keys, not autoincrement.** Migrating int PKs to UUIDs across
   a populated database with foreign keys is genuinely painful. UUIDs cost
   nothing now.
2. **`created_at` / `updated_at` on every table.** Last-write-wins needs them
   and they cannot be reconstructed after the fact.
3. **Soft deletes (`deleted_at` tombstones).** A hard delete is invisible to a
   future sync — the other device just re-adds the row. Deletion history cannot
   be recovered later.

Deliberately deferred: no `owner_id` column (`ALTER TABLE ADD COLUMN` is
trivial in SQLite), no outbox/change-log table, no auth, no conflict UI. Those
are additive when sync actually arrives — likely Supabase or PowerSync over
this same local SQLite, so the gym path never touches the network.

---

## 5. Where state lives

| Data | Home | Why |
|---|---|---|
| Routines, schedule, history, exercises | SQLite | Relational, grows unbounded, needs migrations |
| **Active session** | Zustand → MMKV | Must survive an app kill mid-set. MMKV writes synchronously; SQLite on every keypad tap is wrong |
| Sheets, toast, keypad target, drag offsets | Zustand, in-memory | Ephemeral by definition |
| Timer tick | Local `useState` in the session screen | The prototype re-renders the world every 500ms — scope it to the header instead |

The active session is written to SQLite exactly once, on finish. Discard just
clears MMKV.

---

## 6. Design tokens

Pulled from the markup. The prototype was generated, so its greys and border
alphas drifted — **19 distinct greys and 11 border alphas** for what is really
about six of each. Collapsing them is the first real design decision:

```ts
color: {
  bg: '#F4F5F7',   surface: '#FFFFFF',
  accent: '#2F6BFF', accentBg: '#EBF1FF',
  fill: '#F3F4F7', fillInput: '#F1F2F5', fillHover: '#F5F6F8',
  dangerBg: '#FFECEA', dangerInk: '#B3311F',
  ink:    ['#14161A','#434548','#6A6B6E','#848587','#919193','#9D9EA0'],
  border: { hair: 'rgba(20,22,26,.08)', base: 'rgba(20,22,26,.12)',
            strong: 'rgba(20,22,26,.16)', dashed: 'rgba(20,22,26,.20)' },
}
radius: { sm: 8, md: 11, lg: 14, xl: 18, xxl: 22, sheet: 26, pill: 999 }
```

Type: **Archivo** 400/500/600 for prose, **DM Mono** 400/500 for every numeric
and every uppercase eyebrow label (`.14–.16em` tracking). Page titles are
`600 31px/1.05` at `-0.025em`; stat numbers are `500 22–25px` DM Mono at
`-0.02em`. Page gutter is 22px throughout.

---

## 7. Build phases

0. **Scaffold** — Expo + router + fonts + `tokens.ts` + `src/ui` primitives
1. **Data** — Drizzle schema, migrations, seed 51 exercises, repositories
2. **Read screens** — Today, Schedule, Routines, Library, History, Detail
3. **Editing** — Builder, day-edit sheet with every-week/this-week scope, picker
4. **Active workout** — session store, keypad, rest timer + notifications,
   swipe-to-delete, drag-reorder, pause/resume
5. **Reconciliation** — `changes[]`, off-plan sheet, `finishInto`, summary,
   history write
6. **Polish** — haptics, keep-awake, toasts, empty states, week rollover, real
   stats aggregation

Phases 4 and 5 are the bulk of the work and where the app's actual
differentiator lives — the *"you trained off plan, keep it for today or write
it into the routine?"* flow.
