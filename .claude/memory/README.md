<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/.claude/memory/README.md
   -
   -->

# .claude/memory/

This directory holds Claude Code's auto memory for this repository, a
`MEMORY.md` index plus one topic file per memory Claude has chosen to save
(user preferences, corrections, project context, references).

It is pinned here, rather than left at the default
`~/.claude/projects/<project>/memory/`, so these files are git-tracked
alongside the rest of the repository instead of scattered under the home
directory. The `repo-memory` plugin's `SessionStart` hook sets
`autoMemoryDirectory` to this directory's absolute path in the git ignored
`.claude/settings.local.json`, so the pinning follows every clone, move or
worktree without committing a machine-specific path.

Files here are plain markdown, Claude reads and writes them during a
session; review or edit them at any time via `/memory`.
