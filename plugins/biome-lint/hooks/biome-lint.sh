#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/biome-lint/hooks/biome-lint.sh
#
#

# PostToolUse. After Claude writes or edits a file Biome handles, applies
# Biome's formatting and safe fixes and reports its remaining diagnostics back
# to Claude.

set -eu

# Exit Status
#     0  Not Biome's file, or clean; a rewrite is noted for Claude
#     1  Execution Error (non-blocking, user viewable)
#     2  Diagnostics: the edit stands, and Biome's report goes to Claude
#
# Only a project with a Biome configuration at its root is touched, as Biome
# would otherwise apply its own defaults, and only with the project's Biome,
# from node_modules or else PATH, so the version is the one its checks pin.
# Biome decides which files it handles, so no if filter names them.

command -v jq >/dev/null 2>&1 || {
    echo 'biome-lint: Command not found: jq' >&2
    exit 1
}

file=$(jq -r '.tool_input.file_path // empty')
# A symlink could lead Biome to a file outside the project.
[ -n "${file}" ] && [ -f "${file}" ] && [ ! -L "${file}" ] || exit 0

# Physical paths, so neither .., a symlink nor a trailing slash defeats the
# prefix test below.
project=$(cd -- "${CLAUDE_PROJECT_DIR:-${PWD}}" && pwd -P) || exit 0
dir=$(cd -- "${file%/*}" && pwd -P) || exit 0
file=${dir}/${file##*/}
case ${file} in
"${project}"/*) ;;
*) exit 0 ;;
esac

configured=false
for config in biome.json biome.jsonc .biome.json .biome.jsonc; do
    if [ -f "${project}/${config}" ]; then
        configured=true
        break
    fi
done
[ "${configured}" = true ] || exit 0

biome=${project}/node_modules/.bin/biome
"${biome}" --version >/dev/null 2>&1 || biome=biome
"${biome}" --version >/dev/null 2>&1 || exit 0

# Biome finds its configuration from the working directory.
cd "${project}"
# The file can go between the checks above and Biome, as another process
# moves it; then there is nothing to report on.
before=$(cksum 2>/dev/null <"${file}") || exit 0
status=0
report=$("${biome}" check --write --colors=off --no-errors-on-unmatched \
    --files-ignore-unknown=true "${file}" 2>&1) || status=$?

after=$(cksum 2>/dev/null <"${file}") || after=${before}
note=''
if [ "${after}" != "${before}" ]; then
    note="Biome rewrote ${file}; read it again before editing it."
fi

# Hook JSON is read only on exit 0, so with diagnostics the note joins stderr.
if [ "${status}" -ne 0 ]; then
    printf 'biome-lint: %s\n' ${note:+"${note}"} "${report}" >&2
    exit 2
fi
[ -z "${note}" ] && exit 0
jq -n --arg note "${note}" '{
    hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: $note
    }
}'
