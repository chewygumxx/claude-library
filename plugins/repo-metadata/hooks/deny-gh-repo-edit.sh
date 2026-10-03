#!/usr/bin/env bash
# vim:set expandtab shiftwidth=4 filetype=bash:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/repo-metadata/hooks/deny-gh-repo-edit.sh
#
#

# PreToolUse hook on Bash, filtered by `if` to `gh repo edit` commands. In a
# project with a .repo-metadata.jsonc, denies changing the settings that file
# manages, which CI would silently revert, and points Claude at the file.
#
# Claude Code runs the hook regardless of `if` when it cannot tell which
# commands a Bash call runs, so the command is checked again here.

set -euo pipefail

readonly REASON="This repository's GitHub description, topics and default \
branch come from .repo-metadata.jsonc, which CI applies on every push to \
main, so a change made with gh repo edit would be silently reverted. Edit \
.repo-metadata.jsonc instead."

readonly GH_REPO_EDIT='(^|[^[:alnum:]_-])gh[[:space:]]+repo[[:space:]]+edit([[:space:]]|$)'
readonly MANAGED_FLAG='(^|[[:space:]])(-d|--description|--add-topic|--remove-topic|--default-branch)([[:space:]=]|$)'

command -v jq >/dev/null 2>&1 || {
    echo 'repo-metadata: Command not found: jq' >&2
    exit 1
}

[[ -f "${CLAUDE_PROJECT_DIR:-$PWD}/.repo-metadata.jsonc" ]] || exit 0

command=$(jq -r '.tool_input.command // empty')
[[ $command =~ $GH_REPO_EDIT && $command =~ $MANAGED_FLAG ]] || exit 0

jq -n --arg reason "$REASON" '{
    hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
    }
}'
