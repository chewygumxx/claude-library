#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/plugin-lint/hooks/plugin-lint.sh
#
#

# PostToolUse. After Claude edits a plugin or marketplace manifest, a hooks
# file, a skill or an agent, runs claude plugin validate on it and reports any
# problem back to Claude.

set -eu

# Exit Status
#     0  Not a plugin file, or valid
#     1  Execution Error (non-blocking, user viewable)
#     2  Invalid: the edit stands, and the validation report goes to Claude
#
# A plugin's files are validated from the plugin's directory, the nearest
# holding .claude-plugin/plugin.json; a marketplace from its root; and the
# project's own skills and agents from .claude. Validation is --strict, so a
# field the runtime would ignore is reported too.

command -v jq >/dev/null 2>&1 || {
    echo 'plugin-lint: Command not found: jq' >&2
    exit 1
}
command -v claude >/dev/null 2>&1 || exit 0

file=$(jq -r '.tool_input.file_path // empty')
[ -n "${file}" ] && [ -f "${file}" ] || exit 0
project=${CLAUDE_PROJECT_DIR:-${PWD}}
case ${file} in
"${project}"/*) ;;
*) exit 0 ;;
esac

case ${file} in
*/.claude-plugin/plugin.json | */.claude-plugin/marketplace.json)
    target=${file%/.claude-plugin/*}
    ;;
"${project}"/.claude/skills/*/SKILL.md | "${project}"/.claude/agents/*.md | \
    "${project}"/.claude/commands/*.md)
    target=${project}/.claude
    ;;
*/hooks/hooks.json | */skills/*/SKILL.md | */agents/*.md | */commands/*.md)
    target=${file%/*}
    while [ ! -f "${target}/.claude-plugin/plugin.json" ]; do
        [ "${target}" != "${project}" ] || exit 0
        target=${target%/*}
    done
    ;;
*)
    exit 0
    ;;
esac

report=$(claude plugin validate --strict "${target}" 2>&1) && exit 0
printf 'plugin-lint: %s\n' "${report}" >&2
exit 2
