#!/usr/bin/env bash
#
# Build a release APK and file it under a name you can identify later:
#
#     build/apk/liftly-master-b007-02e3155.apk
#             │      │       │      └── commit it was built from
#             │      │       └───────── build number, incrementing per build
#             │      └───────────────── branch, with slashes flattened
#             └──────────────────────── suffixed -dirty if the tree was not clean
#
# A `-dirty` build came from uncommitted work, so the commit hash alone does not
# describe it. That distinction matters when an APK misbehaves a week later and
# the only clue is its filename.
#
# Usage: pnpm apk            # build, print the path
#        pnpm apk --open     # …and reveal it in Finder
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=scripts/android-env.sh
. scripts/android-env.sh

OUT_DIR="build/apk"
COUNTER="$OUT_DIR/.build-number"
MANIFEST="$OUT_DIR/builds.tsv"
GRADLE_APK="android/app/build/outputs/apk/release/app-release.apk"

ensure_signing_key
ensure_gradle_dist
mkdir -p "$OUT_DIR"

# `gradlew clean` cannot be used here: its externalNativeBuildCleanRelease task
# re-runs CMake against stale .cxx state and fails before deleting anything.
# Removing the directories does what the task is supposed to do.
if [ "${1:-}" = "--clean" ]; then
  echo "→ removing previous build output"
  rm -rf android/app/build android/build android/app/.cxx
  shift
fi

# ── Label ────────────────────────────────────────────────────────────────────
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo detached)"
# Branch names may contain / and other characters a filename should not.
BRANCH="$(printf '%s' "$BRANCH" | tr -cs 'A-Za-z0-9._-' '-' | sed 's/^-*//;s/-*$//')"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
DIRTY=""
[ -n "$(git status --porcelain 2>/dev/null)" ] && DIRTY="-dirty"

# One counter for the whole project rather than one per branch, so a build
# number is unambiguous on its own.
PREVIOUS="$(cat "$COUNTER" 2>/dev/null || echo 0)"
case "$PREVIOUS" in
  ''|*[!0-9]*) PREVIOUS=0 ;;
esac
NUMBER=$((PREVIOUS + 1))

LABEL="$(printf 'liftly-%s-b%03d-%s%s' "$BRANCH" "$NUMBER" "$SHA" "$DIRTY")"
TARGET="$OUT_DIR/$LABEL.apk"

echo "→ building $LABEL"

# ── Build ────────────────────────────────────────────────────────────────────
# assembleRelease bundles the JS itself, so no Metro server is started and
# nothing is left running afterwards.
./android/gradlew -p android app:assembleRelease -x lint -x test

if [ ! -f "$GRADLE_APK" ]; then
  echo "Gradle reported success but produced no APK at $GRADLE_APK" >&2
  exit 1
fi

# Copied rather than moved: the unlabelled path is where Gradle expects to find
# its own output, and leaving it intact keeps incremental builds working.
cp "$GRADLE_APK" "$TARGET"

# Only now, once there is an artefact to attach it to, does the number get spent.
printf '%s\n' "$NUMBER" > "$COUNTER"
[ -s "$MANIFEST" ] || printf 'build\tbranch\tcommit\tclean\tsize\tfile\n' > "$MANIFEST"
printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
  "$NUMBER" "$BRANCH" "$SHA" "$([ -n "$DIRTY" ] && echo no || echo yes)" \
  "$(du -h "$TARGET" | cut -f1 | tr -d ' ')" "$LABEL.apk" >> "$MANIFEST"

# A stable path for anything that just wants the newest build.
ln -sf "$LABEL.apk" "$OUT_DIR/latest.apk"

# Each APK is over 100 MB, so a week of incremental builds would quietly eat
# several gigabytes. Older ones go, newest KEEP survive, and anything removed is
# named rather than deleted silently. The manifest keeps the full history.
KEEP="${APK_KEEP:-10}"
# Sorted by mtime read from stat rather than by parsing `ls`: `ls` is commonly
# aliased (eza, lsd) and then emits decorated names that are not paths, which
# would make this delete nothing while still claiming to have pruned.
stat -f '%m %N' "$OUT_DIR"/liftly-*.apk 2>/dev/null |
  sort -rn |
  tail -n "+$((KEEP + 1))" |
  cut -d' ' -f2- |
  while IFS= read -r old; do
    [ -f "$old" ] || continue
    echo "  pruned $(basename "$old")"
    rm -f "$old"
  done

echo "✓ $TARGET  ($(du -h "$TARGET" | cut -f1 | tr -d ' '))"
[ -n "$DIRTY" ] && echo "  built from uncommitted changes — the commit hash does not describe it"

if [ "${1:-}" = "--open" ]; then
  open -R "$TARGET"
fi
