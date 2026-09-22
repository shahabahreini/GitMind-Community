#!/usr/bin/env python3
"""Record GitMind's search rank for seed terms on the VS Code Marketplace and OpenVSX.

Usage: python3 docs/research/listing-rank.py [--top]
  --top  also print the top 10 results per term (store, name, installs, tags).
"""
import json
import sys
import urllib.parse
import urllib.request

EXT_ID = "ShahabBahreiniJangjoo.ai-commit-assistant"
TERMS = [
    "ai commit", "commit message", "commit message generator", "conventional commits",
    "copilot commit", "ollama commit", "git ai", "gitmoji", "changelog generator",
]
PAGE = 50


def marketplace(term):
    body = json.dumps({
        "filters": [{
            "criteria": [
                {"filterType": 8, "value": "Microsoft.VisualStudio.Code"},
                {"filterType": 10, "value": term},
            ],
            "pageSize": PAGE, "pageNumber": 1, "sortBy": 0,
        }],
        "flags": 914,
    }).encode()
    req = urllib.request.Request(
        "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
        data=body,
        headers={"Content-Type": "application/json",
                 "Accept": "application/json;api-version=7.2-preview.1"},
    )
    exts = json.load(urllib.request.urlopen(req, timeout=30))["results"][0]["extensions"]
    rows = []
    for e in exts:
        stats = {s["statisticName"]: s["value"] for s in e.get("statistics", [])}
        rows.append((f'{e["publisher"]["publisherName"]}.{e["extensionName"]}',
                     e["displayName"], int(stats.get("install", 0)), e.get("tags") or []))
    return rows


def openvsx(term):
    url = f"https://open-vsx.org/api/-/search?query={urllib.parse.quote(term)}&size={PAGE}"
    exts = json.load(urllib.request.urlopen(url, timeout=30)).get("extensions", [])
    return [(f'{e["namespace"]}.{e["name"]}', e.get("displayName") or e["name"],
             int(e.get("downloadCount", 0)), []) for e in exts]


def rank(rows):
    ids = [r[0] for r in rows]
    return str(ids.index(EXT_ID) + 1) if EXT_ID in ids else f">{PAGE}"


def main():
    show_top = "--top" in sys.argv
    table, top = [], []
    for term in TERMS:
        mp, ov = marketplace(term), openvsx(term)
        table.append(f"| {term} | {rank(mp)} | {rank(ov)} |")
        if show_top:
            for store, rows in (("MP", mp), ("OV", ov)):
                for i, (_, name, installs, tags) in enumerate(rows[:10], 1):
                    top.append(f"{store} | {term} | {i} | {name} | {installs} | {', '.join(tags[:15])}")
    print(f"| Term | Marketplace rank (of {PAGE}) | OpenVSX rank (of {PAGE}) |")
    print("|---|---|---|")
    print("\n".join(table))
    if top:
        print("\nstore | term | pos | name | installs/downloads | tags")
        print("\n".join(top))


if __name__ == "__main__":
    main()
