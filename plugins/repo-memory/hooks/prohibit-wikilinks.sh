#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/repo-memory/hooks/prohibit-wikilinks.sh
#
#

#
# PreToolUse hook on Write and on Edit, each narrowed by its own `if` filter
# to the project's .claude/memory. Blocks a write or edit whose proposed text
# (Write's content, Edit's new_string) holds a wikilink, and tells Claude
# which lines to relink in CommonMark. Only the text being introduced is
# checked, so wikilinks already in a file do not block.
#
# Code spans and fenced code are skipped, and a wikilink must open with
# neither a space nor a colon, so a Bash test, [[ -n x ]], or a bracket
# expression, [[:space:]], is not one.
#
# Exit status follows the hook contract:
#     0  No wikilink, or not a memory file
#     1  Execution error (non-blocking, user viewable)
#     2  Wikilink found: tool call blocked, line numbers printed to stderr
#

set -eu

fatal() {
    printf 'repo-memory: %s\n' "$*" >&2
    exit 1
}

jq --version >/dev/null 2>&1 || fatal "Command not found: jq"
[ -n "${CLAUDE_PROJECT_DIR:-}" ] ||
    fatal "Script intended as a Claude Code hook. Not set: CLAUDE_PROJECT_DIR"

payload=$(cat)
printf '%s' "$payload" | jq -e '.tool_input | objects' >/dev/null 2>&1 ||
    fatal "Unable to parse the tool payload."

file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""')

# Checked again past the `if` filter, which Claude Code skips when it cannot
# parse the call. A path stepping through . or .. is left alone rather than
# resolved.
case $file_path in
*/./* | */../*) exit 0 ;;
"${CLAUDE_PROJECT_DIR%/}"/.claude/memory/*.md) ;;
*) exit 0 ;;
esac

field=$(printf '%s' "$payload" | jq -r '
    .tool_input | if has("content") then "content" else "new_string" end')

# Blanks fenced code and strips code spans, keeping every line so grep's
# line numbers stay those of the proposed text.
lines=$(
    printf '%s' "$payload" |
        jq -r '.tool_input | .content // .new_string // ""' |
        awk '
            /^[ \t]*(```|~~~)/ { fenced = !fenced; print ""; next }
            fenced { print ""; next }
            { gsub(/`[^`]*`/, ""); print }
        ' |
        grep -nE '\[\[[^][:space:]:][^]]*\]\]' |
        cut -d: -f1 |
        paste -sd, - |
        sed 's/,/, /g'
)

[ -n "$lines" ] || exit 0

printf '%s\n' \
    "Wikilink found in $file_path: line(s) $lines of the proposed $field." \
    'Memories link in CommonMark, to the file, as [name](./name.md); rewrite those lines and retry.' \
    >&2
exit 2
