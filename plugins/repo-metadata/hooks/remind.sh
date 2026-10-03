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
# filter. Prints Markdown file $1, without its YAML front matter, as context
# for Claude: the plugin form of a path-scoped rule, costing no tokens until
# the file is read.

set -eu

awk 'n >= 2; /^---$/ { n++ }' "$1" |
    jq -Rs '{
        hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext: sub("^\\s+"; "")
        }
    }'
