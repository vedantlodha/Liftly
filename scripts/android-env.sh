# Shared setup for the Android build and install scripts. Source it, don't run it.
#
# Everything here exists because of something that has already gone wrong once:
# see docs/BUILD.md for the JDK and Gradle traps, and for why the signing key is
# worth guarding.

# JDK 25 — what Android Studio and the JetBrains IDEs bundle — fails React
# Native's CMake step with an opaque "restricted method" error.
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# There is no android/local.properties, so Gradle finds the SDK only through
# ANDROID_HOME. Without it the build dies on "Cannot convert '' to File", which
# says nothing about the cause — so check here and say what is actually wrong.
if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "No JDK at JAVA_HOME=$JAVA_HOME" >&2
  echo "Install one with: brew install openjdk@17   (see docs/BUILD.md)" >&2
  return 1 2>/dev/null || exit 1
fi

if [ ! -d "$ANDROID_HOME/platform-tools" ]; then
  echo "No Android SDK at ANDROID_HOME=$ANDROID_HOME" >&2
  echo "Install it via Android Studio, or set ANDROID_HOME to an existing SDK." >&2
  return 1 2>/dev/null || exit 1
fi

# JDK 24+ restricts native access and fails React Native's CMake step. The error
# it produces — "A restricted method in java.lang.System has been called" — does
# not mention the JDK at all, so it is worth catching by version.
JAVA_MAJOR="$("$JAVA_HOME/bin/java" -version 2>&1 | sed -n 's/.*version "\([0-9]*\).*/\1/p' | head -1)"
if [ -n "$JAVA_MAJOR" ] && [ "$JAVA_MAJOR" -ge 24 ]; then
  echo "JAVA_HOME points at JDK $JAVA_MAJOR, which fails React Native's CMake step." >&2
  echo "Use JDK 17: brew install openjdk@17   (see docs/BUILD.md)" >&2
  return 1 2>/dev/null || exit 1
fi

# android/app/build.gradle shells out to `node` to locate react-native, hermes
# and the Expo CLI. Those calls run in the Gradle daemon, not this shell, and
# `node` on this machine is a Volta shim whose resolution depends on the caller.
# When the shim produces nothing, Gradle reports "Cannot convert '' to File" —
# which names neither node nor the shim. Resolving to the concrete binary and
# putting its directory first makes the lookup work from any entry point.
#
# `command -v node` alone is not enough to decide node is missing: pnpm ships a
# bundled Node, so `pnpm apk` runs happily in a shell that has no `node` command
# at all. Every plausible route is tried before giving up.
resolve_node() {
  candidate_execpath() {
    [ -n "$1" ] && [ -x "$1" ] || return 1
    resolved="$("$1" -e 'process.stdout.write(process.execPath)' 2>/dev/null || true)"
    [ -n "$resolved" ] && [ -x "$resolved" ] || return 1
    printf '%s' "$resolved"
  }

  # An explicit override wins, for a machine this heuristic cannot cope with.
  candidate_execpath "${NODE:-}" && return 0
  # Set by pnpm and npm when running a script — the node actually in use.
  candidate_execpath "${npm_node_execpath:-}" && return 0
  candidate_execpath "$(command -v node 2>/dev/null)" && return 0

  # pnpm can find a node even when this shell cannot.
  if command -v pnpm >/dev/null 2>&1; then
    viapnpm="$(pnpm exec node -e 'process.stdout.write(process.execPath)' 2>/dev/null || true)"
    [ -n "$viapnpm" ] && [ -x "$viapnpm" ] && { printf '%s' "$viapnpm"; return 0; }
  fi

  # Usual install locations, for a shell that never sourced a profile — an IDE
  # terminal or a launchd job, say.
  for guess in \
    "${VOLTA_HOME:-$HOME/.volta}/bin/node" \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    "$HOME/.nvm/current/bin/node"; do
    candidate_execpath "$guess" && return 0
  done

  return 1
}

REAL_NODE="$(resolve_node || true)"
if [ -z "$REAL_NODE" ]; then
  echo "Could not find a node binary, and the Android build shells out to one" >&2
  echo "from the Gradle daemon — without it Gradle fails on 'Cannot convert '' to File'." >&2
  echo "Fix by putting node on PATH, or run: NODE=/path/to/node pnpm apk" >&2
  return 1 2>/dev/null || exit 1
fi
export PATH="$(dirname "$REAL_NODE"):$PATH"

KEYSTORE="android/app/debug.keystore"
KEYSTORE_BACKUP="$HOME/.liftly/debug.keystore"
GRADLE_DIST="$PWD/.gradle-dist/gradle-9.3.1-bin.zip"
WRAPPER_PROPS="android/gradle/wrapper/gradle-wrapper.properties"

# The Gradle wrapper cannot fetch its own distribution here: services.gradle.org
# redirects to GitHub and the wrapper's 10s connect timeout gives up mid-chain.
# We keep a copy and point the wrapper at it — but `expo prebuild` rewrites this
# file, so the URL has to be re-applied rather than set once.
ensure_gradle_dist() {
  [ -f "$GRADLE_DIST" ] || return 0
  [ -f "$WRAPPER_PROPS" ] || return 0
  grep -q "^distributionUrl=file" "$WRAPPER_PROPS" && return 0
  # sed -i '' is the BSD form; this only ever runs on the developer's Mac.
  sed -i '' "s|^distributionUrl=.*|distributionUrl=file\\:$GRADLE_DIST|" "$WRAPPER_PROPS"
  echo "→ pointed the Gradle wrapper back at the cached distribution"
}

fingerprint() {
  keytool -list -v -keystore "$1" -storepass android -alias androiddebugkey 2>/dev/null |
    grep -m1 "SHA256:" | tr -d ' '
}

# The release build signs with a keystore inside the gitignored, prebuild-
# regenerated android/ tree. A different key means the next install is rejected
# for a signature mismatch, and the only way past that is an uninstall — which
# takes the training log with it.
ensure_signing_key() {
  if [ ! -f "$KEYSTORE_BACKUP" ]; then
    if [ -f "$KEYSTORE" ]; then
      mkdir -p "$(dirname "$KEYSTORE_BACKUP")"
      cp "$KEYSTORE" "$KEYSTORE_BACKUP"
      echo "→ saved the signing key to $KEYSTORE_BACKUP"
    fi
  elif [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$(dirname "$KEYSTORE")"
    cp "$KEYSTORE_BACKUP" "$KEYSTORE"
    echo "→ restored the signing key from $KEYSTORE_BACKUP"
  elif [ "$(fingerprint "$KEYSTORE")" != "$(fingerprint "$KEYSTORE_BACKUP")" ]; then
    cp "$KEYSTORE_BACKUP" "$KEYSTORE"
    echo "→ signing key had changed; restored the original so the update is accepted"
  fi
}
