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
`~/.claude/projects/<project>/memory/`, via `autoMemoryDirectory` in
`.claude/settings.json`, so these files are git-tracked alongside the rest
of the repository instead of scattered under the home directory. A
`SessionStart` hook in that same settings file keeps `autoMemoryDirectory`
in sync with this repository's current absolute path on disk, so the
pinning survives a clone or move. See
`notes/2026-09-03-repo-local-auto-memory.md` for the full rationale.

Files here are plain markdown, Claude reads and writes them during a
session; review or edit them at any time via `/memory`.
