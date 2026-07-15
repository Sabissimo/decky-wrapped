import json
import os
import time

import decky

SNAP_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "snapshots.json")

# Roughly a year of daily snapshots plus headroom
MAX_SNAPSHOTS = 400


def _load():
    try:
        with open(SNAP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return []


def _save(snaps):
    os.makedirs(os.path.dirname(SNAP_FILE), exist_ok=True)
    with open(SNAP_FILE, "w", encoding="utf-8") as f:
        json.dump(snaps, f)


class Plugin:
    async def save_snapshot(self, apps):
        """Record today's per-app playtime totals (appid -> minutes).

        One snapshot per calendar day; re-running the same day replaces it.
        """
        snaps = _load()
        today = time.strftime("%Y-%m-%d")
        snaps = [s for s in snaps if s.get("day") != today]
        snaps.append({"day": today, "ts": int(time.time()), "apps": apps})
        snaps.sort(key=lambda s: s["ts"])
        _save(snaps[-MAX_SNAPSHOTS:])

    async def get_baseline(self):
        """Earliest snapshot from the current year, or None on first run."""
        year = time.strftime("%Y")
        for s in _load():
            if s.get("day", "").startswith(year):
                return s
        return None

    async def _main(self):
        decky.logger.info("Deck Wrapped loaded")

    async def _unload(self):
        decky.logger.info("Deck Wrapped unloaded")
