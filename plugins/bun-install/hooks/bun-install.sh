#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/bun-install/hooks/bun-install.sh
#
#

# SessionStart. In remote (cloud) sessions, which start from a fresh checkout,
# installs the project's dependencies with Bun from its lockfile, so lifecycle
# scripts such as husky's git hook wiring run before anything else in the
# session. Local sessions, and projects without a Bun lockfile, are skipped.

set -u

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

root=${CLAUDE_PROJECT_DIR:-}
[ -n "$root" ] || root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -n "$root" ] || exit 0

[ -f "$root/package.json" ] || exit 0
[ -f "$root/bun.lock" ] || [ -f "$root/bun.lockb" ] || exit 0
command -v bun >/dev/null 2>&1 || exit 0

cd "$root" || exit 0
bun install --frozen-lockfile >/dev/null
