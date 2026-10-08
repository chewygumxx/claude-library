---
ctime: 2026-10-09
mtime: 2026-10-09
spdx: GPL-3.0-only
title: "Biome Lint: README.md"
description: >-
  After Claude writes or edits a file Biome handles, applies Biome's formatting
  and safe fixes and reports its remaining diagnostics back to Claude.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - biome
  - format
  - lint
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/biome-lint/README.md
   -
   -->

# Biome Lint

After Claude writes or edits a file Biome handles, applies Biome's formatting
and safe fixes and reports its remaining diagnostics back to Claude.

A `PostToolUse` hook on `Write|Edit`. It runs `biome check --write` on the
file from the project root, so Biome reads the project's own configuration,
including what it `extends` and the files it excludes. Then:

- When Biome rewrites the file, Claude is told to read it again before
  editing it
- Any error Biome cannot fix, or an error in its configuration, goes back to
  Claude with exit code 2; the edit itself stands. Warnings, which leave
  Biome's exit code at 0, are not reported

A configuration that is not valid JSON at all, or is empty, Biome reads as
no configuration, so the hook formats with Biome's defaults rather than
reporting it.

Biome decides which files it handles, from its languages and the project's
configuration, so no `if` filter names them and the hook starts on every
Write and Edit. It is disabled by default, as it rewrites files; a project
enables it in `.claude/settings.json`.

The hook does nothing when any of these hold:

- The file is outside the project once symlinks and `..` are resolved, or
  is itself a symlink
- The file is one Biome does not handle, or the configuration excludes
- The project root has no `biome.json`, `biome.jsonc`, `.biome.json` or
  `.biome.jsonc`, since Biome would otherwise apply its own defaults
- Biome does not run, from `node_modules/.bin` or else `PATH`

Requires `jq`.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
