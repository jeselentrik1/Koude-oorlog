#!/usr/bin/env bash
set -euo pipefail

# Concatenate server source files into one text file for reading / analysis.
# Usage: ./concat-sources.sh [output-file]
# Default output: dist-concat/server-all.txt

cd "$(dirname "$0")"

out="${1:-dist-concat/server-all.txt}"
mkdir -p "$(dirname "$out")"

# Order: config and modules before entrypoint (easier to read top-down).
files=(
  quizConfig.json
  presenterStore.js
  quizStore.js
  index.js
)

: > "$out"
for f in "${files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "missing: $f" >&2
    exit 1
  fi
  {
    echo "// $f"
    cat -- "$f"
    echo
    echo
  } >> "$out"
done

echo "Wrote $(pwd)/$out"
