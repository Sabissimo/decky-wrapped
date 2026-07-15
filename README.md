# 🎁 Deck Wrapped

**Your Steam Deck year in review — Spotify Wrapped, but for gaming.**

Open the panel any time to see:

- 🗓 **This year** — hours played and your top 5 games since tracking began
- 🏆 **All time** — total hours, games played, and your all-time top 5

Everything is tracked **locally on your Deck**. No accounts, no uploads, no
telemetry — your data never leaves the device.

## How it works

Every time you open the panel, Deck Wrapped takes a snapshot of your playtime
(one per day). Your "this year" stats are computed from the difference between
today and the earliest snapshot of the year — so the longer you have it
installed, the better your Wrapped gets. Install it in January, thank
yourself in December. 🎄

## Installation

Not on the Decky store yet. To install:

1. In Decky settings, enable **Developer mode**
2. In the **Developer** tab, choose **Install Plugin from URL** and paste:

   ```
   https://github.com/Sabissimo/decky-wrapped/releases/latest/download/decky-wrapped.zip
   ```

## Roadmap

- Shareable Wrapped card (image you can post)
- Playtime calendar heatmap & streaks
- Fun superlatives ("most abandoned game", "comfort game of the year")

<details>
<summary>🛠 For developers</summary>

Playtime comes from the Steam client's own `appStore.allApps`
(`minutes_playtime_forever`, `rt_last_time_played`) — read in the frontend,
no Web API key needed.

The Python backend persists daily snapshots to
`DECKY_PLUGIN_SETTINGS_DIR/snapshots.json` (max ~400 days, one per calendar
day). "This year" = current totals minus the earliest snapshot of the
current year.

```bash
npm install   # or pnpm i
npm run build # outputs dist/index.js
```

</details>

## License

MIT
