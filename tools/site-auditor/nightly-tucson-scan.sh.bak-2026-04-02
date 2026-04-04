#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
OUTDIR="$HOME/Desktop/Audit reports/nightly-tucson/$(date +%F)"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
mkdir -p "$OUTDIR" "$LOGDIR"

# Categories to rotate through.
categories=(restaurants cafes salons barbers "home services")

for category in "${categories[@]}"; do
  safe_category=$(echo "$category" | tr ' ' '-' )
  input_json="$WORKSPACE/tools/site-auditor/input/tucson-${safe_category}.json"
  if [[ -f "$input_json" ]]; then
    echo "Running $category with input list $input_json" | tee -a "$LOGDIR/nightly.log"
    "$NODE_BIN" "$WORKSPACE/tools/site-auditor/audit.js" \
      --city "Tucson, AZ" \
      --category "$category" \
      --input "$input_json" \
      --output "$OUTDIR/$safe_category" >> "$LOGDIR/nightly.log" 2>&1 || true
  else
    echo "Skipping $category (no input list yet at $input_json)" | tee -a "$LOGDIR/nightly.log"
  fi
done

echo "Nightly Tucson scan complete: $OUTDIR" | tee -a "$LOGDIR/nightly.log"
