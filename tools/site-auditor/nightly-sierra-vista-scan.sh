#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
OUTDIR="$HOME/Desktop/Audit reports/nightly-sierra-vista/$(date +%F)"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
mkdir -p "$OUTDIR" "$LOGDIR"

categories=(restaurants cafes salons barbers "home services" "auto repair" dental gyms retail "tattoo shops")

had_failure=0
ran_count=0

for category in "${categories[@]}"; do
  safe_category=$(echo "$category" | tr ' ' '-' )
  input_json="$WORKSPACE/tools/site-auditor/input/sierra-vista-${safe_category}.json"
  if [[ -f "$input_json" ]]; then
    ran_count=$((ran_count + 1))
    echo "Running $category with input list $input_json" | tee -a "$LOGDIR/sierra-vista-nightly.log"
    if ! "$NODE_BIN" "$WORKSPACE/tools/site-auditor/audit.js" \
      --city "Sierra Vista, AZ" \
      --category "$category" \
      --input "$input_json" \
      --output "$OUTDIR/$safe_category" >> "$LOGDIR/sierra-vista-nightly.log" 2>&1; then
      had_failure=1
      echo "Category failed: $category" | tee -a "$LOGDIR/sierra-vista-nightly.log"
    fi
  else
    echo "Skipping $category (no input list yet at $input_json)" | tee -a "$LOGDIR/sierra-vista-nightly.log"
  fi
done

if [[ "$had_failure" -eq 1 ]]; then
  openclaw system event --mode next-heartbeat --text "Sierra Vista nightly scan had failures. Check $LOGDIR/sierra-vista-nightly.log and $OUTDIR." >/dev/null 2>&1 || true
else
  openclaw system event --mode next-heartbeat --text "Sierra Vista nightly scan completed successfully for $ran_count categories. Reports: $OUTDIR" >/dev/null 2>&1 || true
fi

echo "Nightly Sierra Vista scan complete: $OUTDIR" | tee -a "$LOGDIR/sierra-vista-nightly.log"
