#!/usr/bin/env bash
#
# Build a labelled release APK and install it over the app already on the phone.
#
# The whole point of this script is that your logged workouts survive. Android
# keeps an app's database across an *update* (`adb install -r`) and destroys it
# on an *uninstall*. Two things can silently turn the first into the second:
#
#   1. A changed signing key — handled in scripts/android-env.sh.
#   2. A silent fallback to uninstall-then-install. This script never uninstalls
#      and never clears app data; if the update is refused it stops and says so.
#
# Usage: pnpm android:install
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=scripts/android-env.sh
. scripts/android-env.sh

PKG="com.vedantlodha.liftly"

# ── What is on the phone now ─────────────────────────────────────────────────
# Checked before building, so a missing phone costs a second rather than a
# seven-minute build.
if ! adb get-state >/dev/null 2>&1; then
  echo "No device. Plug the phone in, unlock it, and check 'adb devices'." >&2
  exit 1
fi

installed_at() {
  adb shell dumpsys package "$PKG" 2>/dev/null | grep -m1 "firstInstallTime" | sed 's/.*=//' | tr -d '\r'
}

BEFORE="$(installed_at)"
if [ -n "$BEFORE" ]; then
  echo "→ app already installed (first installed $BEFORE) — this will be an update"
else
  echo "→ app not installed — this will be a fresh install, starting with an empty database"
fi

# ── Build ────────────────────────────────────────────────────────────────────
bash scripts/build-apk.sh
APK="build/apk/latest.apk"

# ── Install as an update ─────────────────────────────────────────────────────
# -r replaces the app and keeps its data. There is deliberately no uninstall
# fallback: losing the training log is worse than a failed install.
echo "→ installing…"
if ! adb install -r "$APK"; then
  cat >&2 <<'MSG'

Install refused. Your data is still on the phone and this script has not
touched it.

The usual cause is a signature mismatch, which means the APK was signed with a
different key than the installed app. Uninstalling would fix the install and
delete every logged workout, so decide deliberately rather than reflexively:

    adb uninstall com.vedantlodha.liftly   # DESTROYS the training log
MSG
  exit 1
fi

# ── Confirm the data survived ────────────────────────────────────────────────
AFTER="$(installed_at)"
if [ -z "$BEFORE" ]; then
  echo "✓ installed"
elif [ "$BEFORE" = "$AFTER" ]; then
  # An uninstall/reinstall resets firstInstallTime; an update leaves it alone.
  echo "✓ updated in place — first-install timestamp unchanged, so the database was kept"
else
  echo "⚠ first-install timestamp changed ($BEFORE → $AFTER): the app was replaced, not updated." >&2
  echo "  The database will have started empty." >&2
  exit 1
fi
