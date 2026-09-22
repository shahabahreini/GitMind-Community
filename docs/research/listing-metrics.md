# Listing Metrics

Append-only. Snapshot the store columns with `docs/research/listing-snapshot.sh`. Rank: `python3 docs/research/listing-rank.py`. The last three columns are manual:
- **Hub views / conv.:** Marketplace publisher hub → Reports → Acquisition, last 30 days (page views and install conversion)
- **UTM hits:** `grep -c 'utm_source=extension-listing' <access log>` on the web host for the period
- **Note**

6.2.0 went live: OpenVSX 2026-09-22T20:27Z, Marketplace 2026-09-22T20:32Z. The baseline rows are due at **2026-09-29** (live + 7 days) and just before the 6.2.1 release.

| Date | MP ver | MP installs | MP downloads | MP rating | MP trending d/w/m | OV ver | OV downloads | OV rating | Hub views / conv. | UTM hits | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-09-22 | 6.2.0 | 1219 | 1752 | 5.00 (4) | 0.00 / 0.33 / 2.46 | 6.2.0 | 12252 | 5.0 (1) | — | — | Day 0 reference (6.2.0 just live; not a baseline) |
| 2026-09-22 | 6.2.0 | 1219 | 1752 | 5.00 (4) | 0.00 / 0.33 / 2.46 | 6.2.0 | 12317 | 5.0 (1) | — | — | Pre-release snapshot for 6.2.1 (released early, before the +7 day baseline, to supersede the 6.2.0 package leak) |
