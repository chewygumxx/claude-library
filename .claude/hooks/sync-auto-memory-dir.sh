#!/usr/bin/env bash
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/.claude/hooks/sync-auto-memory-dir.sh
#
#

#
# SessionStart hook: Synchronises .claude/settings.json's autoMemoryDirectory to
# this repository's own .claude/memory.
#

set -euo pipefail

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
dir="$root/.claude/memory"
settings="$root/.claude/settings.json"

cur="$(jq -r '.autoMemoryDirectory // empty' "$settings")"
if [[ "$cur" != "$dir" ]]; then
    tmp="$settings.tmp"
    jq --arg d "$dir" '.autoMemoryDirectory = $d' "$settings" >"$tmp" && mv "$tmp" "$settings"
fi
