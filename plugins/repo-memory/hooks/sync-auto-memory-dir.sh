#!/usr/bin/env bash
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/repo-memory/hooks/sync-auto-memory-dir.sh
#
#

#
# SessionStart hook: Synchronises the project's .claude/settings.local.json
# autoMemoryDirectory to the project's own .claude/memory, creating it.
#
# The value must be absolute, so it is specific to each checkout's location on
# disk; it belongs in the git ignored local settings, not the shared ones.
# Projects opt in by enabling the plugin, which is disabled by default.
#

set -euo pipefail

fatal() {
    printf 'repo-memory: %s\n' "$*" >&2
    exit 1
}

command -v jq >/dev/null 2>&1 || fatal "Command not found: jq"

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
dir="$root/.claude/memory"
settings="$root/.claude/settings.local.json"

# An absolute home path must never be committed, so refuse a settings file git
# would track, before creating anything. Outside a work tree there is nothing
# to commit it to.
if git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1 &&
    ! git -C "$root" check-ignore -q -- "$settings"; then
    fatal "Not git ignored, so left unchanged: $settings"
fi

mkdir -p -- "$dir"

[[ -s "$settings" ]] || printf '{}\n' >"$settings"

cur="$(jq -r '.autoMemoryDirectory // empty' "$settings")"
if [[ "$cur" != "$dir" ]]; then
    tmp="$(mktemp "$settings.XXXXXX")"
    trap 'rm -f -- "$tmp"' EXIT
    jq --arg d "$dir" '.autoMemoryDirectory = $d' "$settings" >"$tmp"
    mv -- "$tmp" "$settings"

    # Settings are read before SessionStart hooks run, so this session keeps
    # the default memory directory. Tell the user, not Claude: a
    # systemMessage costs no context.
    jq -n --arg d "$dir" '{
        systemMessage: ("repo-memory: autoMemoryDirectory now points at " + $d
            + ", from the next session. Until then, memory stays in the default"
            + " directory, and writes into .claude/memory are refused.")
    }'
fi
