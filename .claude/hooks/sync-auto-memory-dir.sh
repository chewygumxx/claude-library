#!/usr/bin/env bash
# SessionStart hook: keep .claude/settings.json's autoMemoryDirectory pointed
# at this repository's own .claude/memory, wherever the repository currently
# lives on disk. See notes/2026-09-03-repo-local-auto-memory.md for why.
set -euo pipefail

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
dir="$root/.claude/memory"
settings="$root/.claude/settings.json"

cur="$(jq -r '.autoMemoryDirectory // empty' "$settings")"
if [ "$cur" != "$dir" ]; then
  tmp="$settings.tmp"
  jq --arg d "$dir" '.autoMemoryDirectory = $d' "$settings" > "$tmp" && mv "$tmp" "$settings"
fi
