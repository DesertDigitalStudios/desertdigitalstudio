#!/bin/zsh
# nightly-scan-yelp.sh
# Yelp-powered nightly scan — discovers fresh businesses automatically.
# Falls back to static input lists if Yelp is unavailable.
set -euo pipefail

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
mkdir -p "$LOGDIR"

categories=(restaurants cafes salons barbers "home-services" "auto-repair" dental gyms retail "tattoo-shops")

cities=(
  "Tucson, AZ"
  "Sierra Vista, AZ"
  "Benson, AZ"
  "Tombstone, AZ"
  "Willcox, AZ"
  "Vail, AZ"
)

had_failure=0
ran_count=0
TODAY=$(date +%F)

for city_full in "${cities[@]}"; do
  city_slug=$(echo "$city_full" | tr ',' ' ' | awk '{print $1}' | tr '[:upper:]' '[:lower:]')
  OUTDIR="$HOME/Desktop/Audit reports/nightly-${city_slug}/${TODAY}"
  mkdir -p "$OUTDIR"

  for category in "${categories[@]}"; do
    safe_cat=$(echo "$category" | tr ' ' '-')
    ran_count=$((ran_count + 1))

    # Try Yelp discovery first
    YELP_INPUT="/tmp/yelp-${city_slug}-${safe_cat}.json"
    yelp_ok=0

    if "$NODE_BIN" "$WORKSPACE/tools/site-auditor/yelp-discovery.js" \
        --city "$city_full" \
        --category "$safe_cat" \
        --limit 25 \
        > "$YELP_INPUT" 2>>"$LOGDIR/nightly.log"; then
      entry_count=$(python3 -c "import json,sys; d=json.load(open('$YELP_INPUT')); print(len(d))" 2>/dev/null || echo 0)
      if [[ "$entry_count" -gt 0 ]]; then
        yelp_ok=1
        echo "[Yelp] $city_full $category: $entry_count businesses" | tee -a "$LOGDIR/nightly.log"
      fi
    fi

    # Fallback to static input list
    if [[ "$yelp_ok" -eq 0 ]]; then
      static_input="$WORKSPACE/tools/site-auditor/input/${city_slug}-${safe_cat}.json"
      if [[ -f "$static_input" ]]; then
        YELP_INPUT="$static_input"
        echo "[Static] $city_full $category: using input list" | tee -a "$LOGDIR/nightly.log"
      else
        echo "[Skip] $city_full $category: no Yelp result and no static list" | tee -a "$LOGDIR/nightly.log"
        continue
      fi
    fi

    if ! "$NODE_BIN" "$WORKSPACE/tools/site-auditor/audit.js" \
        --city "$city_full" \
        --category "$category" \
        --input "$YELP_INPUT" \
        --limit 25 \
        --output "$OUTDIR/$safe_cat" >> "$LOGDIR/nightly.log" 2>&1; then
      had_failure=1
      echo "Category failed: $city_full $category" | tee -a "$LOGDIR/nightly.log"
    fi

    # Clean up temp Yelp file
    [[ -f "/tmp/yelp-${city_slug}-${safe_cat}.json" ]] && rm -f "/tmp/yelp-${city_slug}-${safe_cat}.json"
  done
done

if [[ "$had_failure" -eq 1 ]]; then
  openclaw system event --mode next-heartbeat --text "Yelp nightly scan had some failures. Check $LOGDIR/nightly.log." >/dev/null 2>&1 || true
else
  openclaw system event --mode next-heartbeat --text "Yelp nightly scan complete: $ran_count category runs across all cities." >/dev/null 2>&1 || true
fi

echo "Yelp nightly scan done. $ran_count runs." | tee -a "$LOGDIR/nightly.log"
