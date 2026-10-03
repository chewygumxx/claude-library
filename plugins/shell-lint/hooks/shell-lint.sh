#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/shell-lint/hooks/shell-lint.sh
#
#

# PostToolUse. After Claude writes or edits a shell script, found by shebang as
# well as extension, formats it with shfmt and reports shellcheck's findings
# back to Claude.

set -eu

# Exit Status
#     0  Not a shell script, or clean; a reformat is noted for Claude
#     1  Execution Error (non-blocking, user viewable)
#     2  Findings: the edit stands, and shellcheck's report goes to Claude
#
# Files outside the project are left alone, and each tool is skipped when it
# does not run, such as a mise shim with no version set for the project. shfmt reads the project's .editorconfig and shellcheck its
# .shellcheckrc, so both follow the project's own settings.

command -v jq >/dev/null 2>&1 || {
    echo 'shell-lint: Command not found: jq' >&2
    exit 1
}
shfmt --version >/dev/null 2>&1 || exit 0

file=$(jq -r '.tool_input.file_path // empty')
[ -n "${file}" ] && [ -f "${file}" ] || exit 0
case ${file} in
"${CLAUDE_PROJECT_DIR:-${PWD}}"/*) ;;
*) exit 0 ;;
esac

# shfmt -f prints the file only when it is a shell script.
listed=$(shfmt -f "${file}") || exit 0
[ -n "${listed}" ] || exit 0

note='' report=''
if ! shfmt -d "${file}" >/dev/null 2>&1; then
    if errors=$(shfmt -w "${file}" 2>&1); then
        note="shfmt reformatted ${file}; read it again before editing it."
    else
        report=${errors}
    fi
fi

if shellcheck --version >/dev/null 2>&1; then
    if ! findings=$(shellcheck -f gcc "${file}" 2>&1); then
        report=${report:+${report}
}${findings}
    fi
fi

# Hook JSON is read only on exit 0, so with findings the note joins stderr.
if [ -n "${report}" ]; then
    printf 'shell-lint: %s\n' ${note:+"${note}"} "${report}" >&2
    exit 2
fi
[ -z "${note}" ] && exit 0
jq -n --arg note "${note}" '{
    hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: $note
    }
}'
