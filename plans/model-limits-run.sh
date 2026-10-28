#!/usr/bin/env bash
# Runner: check <ID> <label> -- <cmd...> | mark <ID> <status> [evidence]
set -u
D="$(cd "$(dirname "$0")" && pwd)"; L="$D/model-limits-execution.md"; LOG="$D/model-limits-log.txt"
cd "$D/.."
case "$1" in
  check) id=$2; label=$3; shift 4
    start=$(wc -l < "$LOG" 2>/dev/null || echo 0)
    { echo "=== $(date +%T) $id $label: $*"; } >> "$LOG"
    if bash -c "$*" >> "$LOG" 2>&1; then echo "ok $id $label"; else echo "FAIL $id $label — log:$((start+1))"; fi ;;
  mark) id=$2; st=$3; ev=${4:-}
    tmp=$(mktemp); awk -F'|' -v id=" $id " -v st=" $st " -v ev=" $ev " 'BEGIN{OFS="|"} $2==id{$6=st; if(ev!=" ") $7=ev} {print}' "$L" > "$tmp" && mv "$tmp" "$L"
    echo "marked $id $st" ;;
esac
