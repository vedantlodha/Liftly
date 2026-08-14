# Verification backlog

Things built but not proven, and how to prove them. Most are blocked on a real
runtime — the browser preview cannot run SQLite, native gestures, notifications
or MMKV, so anything in those areas is currently code-review-only.

Automated checks that *do* run today: `pnpm typecheck`, `pnpm test`,
`pnpm catalog:check`, `pnpm db:verify`.

## Blocked on a device or emulator

| # | What | Why it is unproven | How to check |
|---|---|---|---|
| 4 | Hardware back → leave dialog | `BackHandler` is inert on web, so the dialog has never been triggered by a real back press. | Start a session, press the system back button, confirm the leave dialog appears rather than the route popping. |
| 5 | Safe-area insets | Web reports zero insets. The tab bar, toast (`bottom: 104`) and keypad all assume real ones. | Check the tab bar clears the gesture bar and the toast sits above it. |
| 6 | Layout at 412×892 | The design's frame. The browser preview is 375×812. | Compare against `design/Workout Tracker.dc.html` at the Pixel 8's dimensions. |
| 7 | Fonts on Android | Archivo and DM Mono load via `expo-font`; web loads them from a different path. | Confirm numerics are DM Mono, not a fallback. |
| 8 | Keypad vs the OS keyboard | The custom keypad should mean the system keyboard never appears. | Tap a weight cell; only the in-app keypad should show. |

## Not built yet — will need verifying when they are

| # | What | Notes |
|---|---|---|
| 10 | Rest-timer notification | The reason the app is native at all. Must fire with the screen locked. |
| 11 | Session survives app kill | Needs the MMKV persistence layer; requires a dev build, not Expo Go. |
| 12 | Haptics on set complete | Not wired. |
| 13 | Screen keep-awake during a session | Not wired. |

## Known-unverified behaviour

| # | What | Notes |
|---|---|---|
| 14 | Week rollover in real time | The rule is unit-tested with injected dates and verified through SQL, but never observed across an actual Monday. | 
| 15 | Mixed-unit volume | Per the design, volume sums raw numbers regardless of unit, so a session mixing KG and LB reports a meaningless total. Accepted deliberately; revisit if it bites. |
| 16 | Routines vanishing mid-session | During development the Routines list briefly showed zero entries after a Fast Refresh, then recovered on a clean reload and never reproduced. Cause unconfirmed — most likely HMR re-running the store while a swipe-delete callback was pending, but a real spurious `onDelete` cannot be ruled out. Watch for it on device. |
| 17 | Catalog re-import after an edit | `syncCatalog` is idempotent in the harness. Not yet run against a database that already holds user routines referencing those exercises. |

## Verified on device

Galaxy S24+ via Expo Go, 14 Aug 2026:

- Migration, seed and hydration on a cold install — 157 exercises, 5 starter
  routines, 4 demo sessions.
- Swipe-to-delete a set. Note it is **rightwards only**, by design.
- A finished workout reaches History with its sets and survives a force-stop.
- Scroll indicators are hidden everywhere.
- Week strip: month header, day selection, the Today link.
- The day card in all three modes — today, logged, scheduled.
- Drag-to-reorder in the builder.

## Persistence

Wired, verified under Node (`pnpm db:verify`) and confirmed end to end on a
device: a workout finished in the app is still in History after a force-stop
and relaunch, and the week's totals recompute from the database.

The gap that remains is the **live** session: a workout in progress is still
in-memory only, so killing the app mid-set loses it. That needs MMKV and a dev
build (item 11).
