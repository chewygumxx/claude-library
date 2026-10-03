#!/usr/bin/env bash
# vim:set expandtab shiftwidth=4 filetype=bash:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/repo-metadata/hooks/deny-gh-repo-edit.sh
#
#

# PreToolUse hook on Bash, filtered by `if` to `gh repo edit` commands. Denies
# a flag whose setting .repo-metadata.jsonc holds, which CI would silently
# revert, and points Claude at the file. sync-repo-metadata leaves a key the
# file omits alone on GitHub, so only the keys present are guarded.
#
# Claude Code runs the hook regardless of `if` when it cannot tell which
# commands a Bash call runs, so the command is checked again here.

set -euo pipefail

readonly GH_REPO_EDIT='(^|[^[:alnum:]_-])gh[[:space:]]+repo[[:space:]]+edit([[:space:]][^;&|]*)?([;&|]|$)'

# Each gh repo edit flag, by the .repo-metadata.jsonc key holding its setting.
# Flags with no key, such as --default-branch and --enable-discussions, are
# not applied by sync-repo-metadata and so are never denied.
declare -rA KEY_OF_FLAG=(
    ["-d"]=description
    ["--description"]=description
    ["-h"]=homepage
    ["--homepage"]=homepage
    ["--add-topic"]=topics
    ["--remove-topic"]=topics
    ["--visibility"]=visibility
    ["--template"]=is_template
    ["--enable-issues"]=has_issues
    ["--enable-projects"]=has_projects
    ["--enable-wiki"]=has_wiki
    ["--allow-forking"]=allow_forking
    ["--enable-squash-merge"]=allow_squash_merge
    ["--enable-merge-commit"]=allow_merge_commit
    ["--enable-rebase-merge"]=allow_rebase_merge
    ["--enable-auto-merge"]=allow_auto_merge
    ["--delete-branch-on-merge"]=delete_branch_on_merge
    ["--allow-update-branch"]=allow_update_branch
    ["--squash-merge-commit-message"]=squash_merge_commit_message
)

command -v jq >/dev/null 2>&1 || {
    echo 'repo-metadata: Command not found: jq' >&2
    exit 1
}

readonly METADATA="${CLAUDE_PROJECT_DIR:-${PWD}}/.repo-metadata.jsonc"
[[ -f "${METADATA}" ]] || exit 0

command=$(jq -r '.tool_input.command // empty')
[[ ${command} =~ ${GH_REPO_EDIT} ]] || exit 0
readonly arguments="${BASH_REMATCH[2]}"

# The file is JSONC, which jq cannot parse, so a key counts as present when
# its name opens a property outside a // comment.
metadata_keys=$(sed 's|//.*||' -- "${METADATA}")
readonly metadata_keys

denied=()
for flag in "${!KEY_OF_FLAG[@]}"; do
    key="${KEY_OF_FLAG[${flag}]}"
    [[ ${arguments} =~ (^|[[:space:]])${flag}([[:space:]=]|$) ]] || continue
    [[ ${metadata_keys} =~ \"${key}\"[[:space:]]*: ]] || continue
    denied+=("${flag} (${key})")
done
((${#denied[@]} > 0)) || exit 0

reason="Set by .repo-metadata.jsonc, which CI applies on every push to main, \
so gh repo edit would be silently reverted: $(printf '%s, ' "${denied[@]}" |
    sed 's/, $//'). Edit .repo-metadata.jsonc instead."

jq -n --arg reason "${reason}" '{
    hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
    }
}'
