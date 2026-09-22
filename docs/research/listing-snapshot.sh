#!/usr/bin/env bash
# Prints one Markdown table row of store metrics for docs/research/listing-metrics.md.
set -euo pipefail
ID="ShahabBahreiniJangjoo.ai-commit-assistant"
MP=$(curl -s -X POST 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery' \
  -H 'Content-Type: application/json' -H 'Accept: application/json;api-version=7.2-preview.1' \
  -d "{\"filters\":[{\"criteria\":[{\"filterType\":7,\"value\":\"$ID\"}]}],\"flags\":914}")
OV=$(curl -s "https://open-vsx.org/api/${ID/.//}")
MP="$MP" OV="$OV" python3 - <<'PY'
import datetime, json, os
e = json.loads(os.environ["MP"])["results"][0]["extensions"][0]
s = {x["statisticName"]: x["value"] for x in e["statistics"]}
o = json.loads(os.environ["OV"])
print(f'| {datetime.date.today()} | {e["versions"][0]["version"]} | {int(s.get("install", 0))} | {int(s.get("downloadCount", 0))} '
      f'| {s.get("averagerating", 0):.2f} ({int(s.get("ratingcount", 0))}) | {s.get("trendingdaily", 0):.2f} / {s.get("trendingweekly", 0):.2f} / {s.get("trendingmonthly", 0):.2f} '
      f'| {o["version"]} | {o["downloadCount"]} | {o.get("averageRating") or 0} ({o.get("reviewCount", 0)}) | | | |')
PY
