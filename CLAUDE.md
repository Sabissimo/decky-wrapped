# Deck Wrapped

Decky Loader (Steam Deck) plugin: Wrapped-style playtime stats — this-year and all-time hours and top games, tracked entirely locally.

## Commands

```bash
npm ci                        # install (npm, not pnpm; lockfile is package-lock.json)
npm run build                 # rollup: src/index.tsx -> dist/index.js
python3 -m py_compile main.py # backend syntax check (no test suite yet)
```

CI (`.github/workflows/build.yml`) runs the build + syntax check on push/PR, assembles the plugin zip, uploads it as an artifact, and attaches it to a Release on `v*` tags.

## Architecture

- `src/index.tsx` — frontend reads playtime from the Steam client's own `appStore.allApps` (`minutes_playtime_forever`, `rt_last_time_played`); no Web API key. Sends a snapshot to the backend on panel open.
- `main.py` — backend, pure stdlib. Persists at most one snapshot per calendar day to `DECKY_PLUGIN_SETTINGS_DIR/snapshots.json` (capped ~400 days). "This year" = current totals minus the earliest snapshot of the current year.

## Status and known risks

Runs on real hardware (2026-07-15): loads and reports stats on the user's
Deck. The `appStore.allApps` field names (`minutes_playtime_forever`,
`rt_last_time_played`) worked on that client build, but they're Valve
internals and can drift between Steam client versions — when they do, the
panel shows the "fields may have renamed" warning instead of silent zeros
(keep that diagnostic; it's the only signal). Backend/frontend errors are
surfaced in the panel, and the snapshot save is awaited before the
baseline read (ordering was racy).

## Releasing

Bump the version in `package.json`, push, then tag `v*` and push the tag separately (a tag pushed together with the branch may not trigger CI).
