# Building a standalone Android app

Expo Go needs Metro on the same network. For gym use you want a real APK that
runs offline.

```bash
pnpm android:install
```

Either entry point works and both do the same thing — `pnpm apk` is just shorter
than `./scripts/build-apk.sh`, which resolves its own paths and can be run from
anywhere in the repo.

Builds a release APK and installs it over the app already on the phone, keeping
the training log. The JS is bundled into the APK
(`assets/index.android.bundle`), so it runs with no dev server, and no Metro
process is left behind. Signed with the debug keystore — fine for personal
installs, not for distribution.

To build without installing:

```bash
pnpm apk
```

`npx expo run:android --variant release` also works but starts a Metro server
the release build has no use for, and leaves it running.

## Labelled APKs

`pnpm apk` files each build under a name you can identify weeks later:

```
build/apk/liftly-master-b007-02e3155.apk
                 │      │       └── commit it was built from
                 │      └────────── build number, incrementing across all branches
                 └───────────────── branch, with slashes flattened
```

A build made with uncommitted changes gets a `-dirty` suffix, because the commit
hash alone does not describe it. `build/apk/builds.tsv` keeps the full history —
build number, branch, commit, whether the tree was clean, and size.

`build/apk/latest.apk` is a **symlink** to the newest build, not a copy, so it
costs nothing and is always the same bytes as the labelled file it points at.
`pnpm android:install` installs through it. To hand the APK to someone else,
dereference it — `cp -L build/apk/latest.apk ~/Desktop/` — or copy the labelled
file, which is the better thing to send anyway since its name says what it is.

The build number lives in `build/apk/.build-number` and is spent only once an
APK actually exists, so a failed build does not burn one. It is a single counter
across all branches, so a number identifies a build on its own.

Each APK is over 100 MB. The ten most recent are kept and older ones are pruned,
naming each file as it goes; `APK_KEEP=25 pnpm apk` raises the limit. The whole
`build/` directory is gitignored.

The prune reads mtimes from `stat` rather than parsing `ls`, because `ls` is
often aliased — to `eza` on this machine — and then emits decorated names that
are not paths, which would delete nothing while still reporting success.

The label is not visible on the phone — Android shows the version from
`app.json`, and changing that per build would mean regenerating the native
project. Match an installed build by its file instead, or bump `expo.version`
when it matters.

## Keeping the training log across reinstalls

Android keeps an app's database across an **update** and destroys it on an
**uninstall**. `pnpm android:install` only ever updates: it uses `adb install -r`,
never uninstalls, never clears app data, and afterwards compares the app's
first-install timestamp — unchanged means the database was kept.

Three things would lose the log. The script handles the first two:

1. **A changed signing key.** The release build signs with
   `android/app/debug.keystore`, which sits inside the gitignored,
   prebuild-regenerated `android/` tree. A different key means the update is
   rejected and only an uninstall clears the way. A copy lives at
   `~/.liftly/debug.keystore` and is restored automatically. Do not delete it.
   Current key: the stock React Native template debug keystore, SHA256
   `FA:C6:17:45:DC:09:03:78:…`, valid to 2052.
2. **An uninstall dressed up as a fix.** `adb uninstall` and
   `adb shell pm clear` both wipe the database. The script never calls either,
   and if an install is refused it stops and explains rather than forcing it.
3. **A destructive schema migration.** This one is on you and me. Drizzle
   migrations in `drizzle/` run on every launch and are applied in order, so
   *additive* changes (new table, new nullable column) upgrade an existing
   database in place. Dropping or renaming a column rewrites the table and can
   discard rows. Check `pnpm db:verify` still passes after any schema change —
   it runs the real migrations against the real schema.

There is no way to copy the database off a release build without root, because
release APKs are not debuggable and `adb run-as` is refused. The signing key is
therefore the only thing standing between you and a lost log — which is why it
is backed up outside the repo.

## Two traps on this machine

**JDK 25 does not work.** Android Studio, IntelliJ and PyCharm all ship
OpenJDK 25, which restricts native access and fails
`:react-native-worklets:configureCMake…` with "A restricted method in
java.lang.System has been called". Use JDK 17:

```bash
brew install openjdk@17
```

**The Gradle wrapper cannot download Gradle.** `services.gradle.org` 307s to
GitHub releases, and the wrapper's 10s connect timeout gives up on the redirect
chain. curl handles it, so fetch the distribution once and point the wrapper at
the local copy:

```bash
mkdir -p .gradle-dist
curl -L -o .gradle-dist/gradle-9.3.1-bin.zip \
  https://services.gradle.org/distributions/gradle-9.3.1-bin.zip
```

then in `android/gradle/wrapper/gradle-wrapper.properties`:

```
distributionUrl=file\:/Users/vedantlodha/Projects/Liftly/.gradle-dist/gradle-9.3.1-bin.zip
```

`android/` is gitignored and regenerated by prebuild, so **this edit is lost on
`expo prebuild --clean`** — redo it if the download starts timing out again.

## "Could not find a node binary"

`android/app/build.gradle` shells out to `node` to locate react-native, hermes
and the Expo CLI, and those calls run in the **Gradle daemon**, not your shell.
Two things make that fragile here: `node` is a Volta shim rather than a real
binary, and pnpm ships its own bundled Node — so `pnpm apk` can run perfectly
well in a shell where `node` is not a command at all.

`scripts/android-env.sh` resolves the concrete binary and puts its directory
first on PATH, trying `$NODE`, `$npm_node_execpath`, `command -v node`,
`pnpm exec node`, then the usual install locations. If all of those miss:

```bash
NODE=/path/to/node pnpm apk
```

When node cannot be found and the guard is bypassed, Gradle fails with
`Cannot convert '' to File` — the empty string being the output of a node call
that never ran.

## Before a real-use build

`src/config.ts` — `PREFILL_DEMO_DATA` must be `false`, or the install ships with
demo routines and four fake sessions in History.

The standalone app has its own database. Nothing carries over from Expo Go.
