#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
OUTDIR="$HOME/Desktop/Audit reports/nightly-tombstone/$(date +%F)"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
mkdir -p "$OUTDIR" "$LOGDIR"

categories=(restaurants cafes salons barbers "home services" "auto repair" dental gyms retail "tattoo shops")

had_failure=0
ran_count=0

for category in "${categories[@]}"; do
  safe_category=$(echo "$category" | tr ' ' '-')
  input_json="$WORKSPACE/tools/site-auditor/input/tombstone-${safe_category}.json"
  if [[ -f "$input_json" ]]; then
    ran_count=$((ran_count + 1))
    echo "Running $category with input list $input_json" | tee -a "$LOGDIR/nightly.log"
    if ! "$NODE_BIN" "$WORKSPACE/tools/site-auditor/audit.js" \
      --city "Tombstone, AZ" \
      --category "$category" \
      --input "$input_json" \
      --limit 10 \
      --output "$OUTDIR/$safe_category" >> "$LOGDIR/nightly.log" 2>&1; then
      had_failure=1
      echo "Category failed: $category" | tee -a "$LOGDIR/nightly.log"
    fi
  else
    echo "Skipping $category (no input list at $input_json)" | tee -a "$LOGDIR/nightly.log"
  fi
done

if [[ "$had_failure" -eq 1 ]]; then
  openclaw system event --mode next-heartbeat --text "Tombstone nightly scan had failures. Check $LOGDIR/nightly.log." >/dev/null 2>&1 || true
else
  openclaw system event --mode next-heartbeat --text "Tombstone nightly scan completed: $ran_count categories. Reports: $OUTDIR" >/dev/null 2>&1 || true
fi

echo "Nightly Tombstone scan complete: $OUTDIR" | tee -a "$LOGDIR/nightly.log"
