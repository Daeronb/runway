# Runway — Residency Matrix

Offline-first PWA that tracks physical days per country against **tax-residency thresholds** and **visa limits**, for the 2027 NL exit → Asia plan.

- **Today** — current location, visa days left, alerts, per-country day counters, NL exit countdown
- **Trips** — the log everything runs on (arrival + departure days both count)
- **Rules** — researched cards per country: crypto stance 🟢🟡🔴, tax residency rule, visa (NL passport), sources, verified date (auto-flags STALE after 6 months)
- **Plan** — "if I stay in X until date Y, what turns red?" with last-safe-departure dates

Data lives in localStorage on-device; use ☰ → Export backup to move between devices.

## Deploy (GitHub Pages)
1. Create a new **public** repo named `runway` on github.com (Daeronb account)
2. **Add file → Upload files** → drag everything in this folder (incl. `icons/`) → Commit
3. Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)` → Save
4. After ~2 min: **https://daeronb.github.io/runway/** → open on phone → Add to Home Screen
5. Updates: upload changed files, then in-app ☰ → **Check for updates**

**Not tax, legal or immigration advice.** Rule cards verified 2026-07-12 — re-verify anything stale before acting on it.
