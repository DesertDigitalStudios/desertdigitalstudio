#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
OUTDIR="$HOME/Desktop/Audit reports/nightly-sierra-vista/$(date +%F)"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
mkdir -p "$OUTDIR" "$LOGDIR"

categories=(restaurants cafes salons barbers "home services")

for category in "${categories[@]}"; do
  safe_category=$(echo "$category" | tr ' ' '-' )
  input_json="$WORKSPACE/tools/site-auditor/input/sierra-vista-${safe_category}.json"
  if [[ -f "$input_json" ]]; then
    echo "Running $category with input list $input_json" | tee -a "$LOGDIR/sierra-vista-nightly.log"
    "$NODE_BIN" "$WORKSPACE/tools/site-auditor/audit.js" \
      --city "Sierra Vista, AZ" \
      --category "$category" \
      --input "$input_json" \
      --output "$OUTDIR/$safe_category" >> "$LOGDIR/sierra-vista-nightly.log" 2>&1 || true
  else
    echo "Skipping $category (no input list yet at $input_json)" | tee -a "$LOGDIR/sierra-vista-nightly.log"
  fi
done

echo "Nightly Sierra Vista scan complete: $OUTDIR" | tee -a "$LOGDIR/sierra-vista-nightly.log"
