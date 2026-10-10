# Liftly project instructions

## Project context

- Liftly is an offline workout tracker built with Expo, React Native, TypeScript,
  Expo Router, Zustand, and SQLite through Drizzle. Preserve training data and
  keep logging a set responsive.
- Use `pnpm` and the scripts in `package.json`. Keep `pnpm-lock.yaml` consistent
  with dependency changes.
- Native builds persist data in SQLite. The web provider supports an in-memory
  preview; browser verification does not establish native persistence behavior.

## Architecture and references

- `app/` owns routes and screen composition; `src/features/` owns feature UI.
- Keep business rules in `src/domain/` as pure functions with no React Native,
  database, or mutable store dependencies. Pass time and other inputs explicitly.
- Screens read Zustand stores. Keep persisted data access in
  `src/db/repositories/` and use the existing persistence queue for store writes.
- Preserve boot ordering: migrate, seed, hydrate stores, attach the database,
  then enable normal app interaction and persistence subscriptions.
- Reuse `src/ui/` primitives and `src/theme/tokens.ts` for UI changes.
- Consult [architecture](docs/ARCHITECTURE.md), [build instructions](docs/BUILD.md),
  [verification notes](docs/VERIFY.md), and [changelog](CHANGELOG.md) as relevant.
  The [prototype](design/Workout%20Tracker.dc.html) supplies visual and behavioral
  reference; [catalog docs](docs/catalog/README.md) describe exercise data.
- Documentation includes planned and outdated behavior. Compare it with current
  code and the user's request; distinguish intended behavior, implemented
  behavior, and known gaps. Do not introduce MMKV or Vitest merely because an
  older document names them: persistence currently uses SQLite and tests use Node.

## Data integrity rules

- Preserve entity identity across rename, reorder, delete/undo, and restart.
  Prefer stable IDs for relationships, React keys, and delayed callbacks;
  array positions and editable names must not determine which record is changed.
- IDs created after recovery must remain unique among recovered records.
- Save related records atomically. Retain the active workout's recovery data
  until the completed workout has been persisted successfully. A failed write
  must leave a recoverable state and must not silently claim durable success.
- Hydration must preserve the meaning of persisted state. Keep blank versus rest,
  permanent plans versus temporary overrides, and original versus resolved
  values distinct. Undo must restore relationships as well as visible content.
- Keep complete dates and measurement semantics in data; format them for display.
  Date selection and week overrides must agree on local calendar boundaries.
  Respect each exercise's logging shape instead of treating duration or distance
  as repetitions. History limits require a way to retrieve the remaining records.
- Preserve the existing weight-unit behavior unless changing it is requested:
  switching KG/LB relabels the entered number. Mixed-unit aggregation is a known
  limitation, not authorization to silently convert existing data.
- Use additive migrations that preserve user data. Do not rewrite migrations
  already applied to installs. Generate catalog output through its build script.
- Keep `PREFILL_DEMO_DATA` off for real-use builds. Device updates must preserve
  the database; never use uninstall or app-data clearing as a routine install fix.

## Verification

- For code changes, run `pnpm typecheck`, `pnpm lint`, and relevant tests through
  `pnpm test`. Add regression coverage for substantive behavior fixes; prefer
  observable outcomes over tests that mirror implementation details.
- For persistence or migration changes, also run `pnpm db:verify` and exercise
  the affected save/hydrate round trip. Cover write failure, restart, and undo
  when the changed behavior depends on them.
- Inspect which database checks actually execute. The harness can skip routine,
  session, and override checks when demo data is disabled; a passing exit code
  alone does not establish coverage of those paths.
- For catalog changes, run `pnpm catalog:build` when regeneration is needed and
  `pnpm catalog:check` to validate the result.
- Verify native gestures, hardware back, keyboard behavior, and lifecycle changes
  on a device or emulator when available. Clearly report unverified behavior.
- Documentation-only changes need link and content checks, not app builds.
  Report checks run, failures, and skips accurately.

## Working and reviewing

- Inspect the working tree first and preserve unrelated edits. Make focused
  changes; update relevant documentation when behavior or verification changes.
- Follow the user's requested scope and resolve routine implementation choices
  autonomously. Surface material ambiguity with the evidence needed to decide.
- For code reviews, use [.agent/skills/code-review/SKILL.md](.agents/skills/code-review/SKILL.md)
  and keep Standards and Spec findings separate. A whole-repository request
  includes existing code and working-tree changes; it does not require a diff base.
- Findings need a concrete trigger, consequence, and file/line reference.
  Distinguish documented requirements from judgment calls and known limitations;
  do not invent a spec or report hypothetical risks as confirmed bugs.
- Keep temporary findings in review reports or issues. Add only durable project
  guidance here, keeping `CLAUDE.md` as a reference to this shared file.
