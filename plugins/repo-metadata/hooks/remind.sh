#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/repo-metadata/hooks/remind.sh
#
#

# PostToolUse hook, run only on a Read of .repo-metadata.jsonc by its `if`
# filter. Prints Markdown file $1, without its YAML front matter or its file
# header, as context for Claude: the plugin form of a path-scoped rule,
# costing no tokens until the file is read.

set -eu

# The header is the HTML comment boxing the path marker, first after the
# front matter, and the modeline comment on the last line. Any other comment
# is the file's own, and stays.
awk '
    n < 2 { if ($0 == "---") n++; next }
    !body && !box && /^<!--/ { box = 1 }
    box {
        held[++h] = $0
        if ($0 ~ /-->/) {
            box = 0; body = 1
            for (i = 1; i <= h; i++) if (held[i] ~ / ::: :\//) h = 0
            for (i = 1; i <= h; i++) print held[i]
        }
        next
    }
    $0 != "" { body = 1 }
    /^<!-- vim:set [^>]*: -->$/ { next }
    { print }
' "$1" |
    jq -Rs '{
        hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext: sub("^\\s+"; "") | sub("\\s+$"; "")
        }
    }'
