# Changelog

## Unreleased — first real-use pass

Everything below came out of actually training with the app rather than
reviewing it. Where a fix has a "why", it is because the failure was not
obvious from the code.

### Data loss and correctness

- **Finished workouts now reach History.** `finish()` cleared the session but
  never computed a summary, added to the log, or saved — `summariseSession`,
  `toHistory` and `saveSession` were all imported and unused. This is also why
  the summary screen never appeared.
- **The demo seed and the exercise catalog were two parallel name sets.**
  `saveSession` resolves exercises by name and *skips* the ones it cannot find,
  so workouts saved with every set silently dropped. Unified on the catalog and
  added a test that fails if the two ever drift again.
- **Today and Schedule read frozen demo data**, not the hydrated store, so a
  saved edit never showed up. Both now resolve through `useRoutines`.
- **An in-progress workout survives the app being killed.** Mirrored to
  `app_settings` on every change, flushed again when the app backgrounds, and
  restored on launch — paused, timed to the last snapshot, so the hours the app
  spent closed do not count as training time.
- **The mirror above never actually ran** on first attempt: it was subscribed
  inside the effect that sets `seeded`, so React tore it down one render later
  and the early return stopped it re-subscribing. It now owns its own effect.
- **Leaving a workout could close the app.** `router.back()` pops the last
  route, and the workout screen is often the only one in the stack (cold start,
  restored task, deep link). Now `router.navigate('/(tabs)')`.
- **Duplicate routine names silently overwrote** the existing routine. Now
  refused with an inline error.
- **The weight unit followed the app default retroactively.** `routine_items`
  had no unit column, so it was dropped on save and every item fell back to the
  live default. Added the column (migration 0003) with a backfill that freezes
  existing rows at whatever they currently display.
- **A day could not be cleared back to blank** once something was on it, and
  "rest day" was indistinguishable from "never configured" (migration 0002).
- **Last-performed weights** now come from any logged workout rather than being
  hardcoded to `'no history'` in all three places that set them.
- Week-strip ticks come from the real log, not demo constants — a blank install
  used to claim a finished workout on Monday.
- `This week so far` and the schedule stats are computed rather than static.
- Demo history durations parsed `"1h 04m"` as 1 minute.

### Design sync

Pulled from the Claude Design prototype and implemented:

- Week strip: month header that tracks scroll, a Today link, and day selection
  that re-points the card instead of navigating away.
- Day-aware card: `TODAY'S SESSION` / `LOGGED ·` / `SCHEDULED ·` / `UPCOMING ·`,
  with past days read-only and — once today is done — showing what was trained.
- Drag-to-reorder in the routine builder and in a live workout.
- Swipe-to-delete: trash glyph, "Release to delete" past the threshold, undo in
  the toast for 5s, and a one-off peek hint.
- Empty states for Routines and History; first-run copy that no longer reads
  "Next up is nothing."
- Filter chips in the exercise picker, shared with the Library screen.
- Search sheets hold their height while filtering and sit above the keyboard.
- Clear button on every search field.
- Name-required validation with a shake, and a discard-changes dialog.
- "+ New routine" in the Today switcher and the Schedule day sheet, which
  assigns the new routine to the day it was started from.
- Scroll indicators hidden everywhere, matching the prototype's global rule.
- Ad-hoc workout renamed to Freestyle, then to "Add new workout" below the card.

### Workout screen

- Hardware back prompts — keep training / pause and go home / exit and discard
  — instead of leaving.
- Per-exercise weight unit switch.
- Completing a set prefills the later sets of that exercise, never overwriting
  one already typed into.
- Screen stays awake during a session, which also makes the process less likely
  to be reclaimed.

### Build tooling

- `pnpm apk` builds a labelled release APK: `liftly-<branch>-b<NNN>-<sha>[-dirty]`,
  with a build manifest, a `latest.apk` symlink and pruning of old builds.
- `pnpm android:install` only ever updates — `adb install -r`, never an
  uninstall — and verifies afterwards that the first-install timestamp is
  unchanged, which is the proof the database survived.
- `scripts/android-env.sh` guards the three things that silently break this
  machine's builds: JDK 24+ (fails React Native's CMake step), a missing
  `ANDROID_HOME` (fails as `Cannot convert '' to File`), and a `node` that
  cannot be resolved from the Gradle daemon. It also restores the signing key
  and the cached Gradle distribution, both of which `expo prebuild` discards.
- App icons generated from `assets/logo.svg` via `pnpm icons`, including an
  adaptive foreground scaled into Android's safe zone.
- `docs/BUILD.md` documents all of the above.

### Tests

44 → 97. New pure-domain modules with coverage: `dayView`, `stats`, `reorder`,
`sets`, `lastPerformed`, plus the seed/catalog consistency check and three
schedule checks in `db:verify`.

### Known gaps

- No foreground service, so Android can still reclaim the app mid-workout. The
  persistence above recovers the session; it does not prevent the kill.
- Rest-timer notifications are not wired, so the timer only runs while the app
  is open.
- Logged workouts store no unit, so an old session's volume *label* follows the
  current default even though the number is frozen.
- Three `console.log` calls remain, tagged `[liftly]`, for confirming the
  session mirror and the leave path on device.
