---
ctime: 2026-09-29
mtime: 2026-10-09
spdx: GPL-3.0-only
title: CLAUDE.md
description: >-
  Claude Code's guide to this plugin marketplace: commit rules, the checks, the
  house header and the prose style.
tags:
  - llm
  - claude
  - claude-library
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/.claude/CLAUDE.md
   -
   -->

# CLAUDE.md

Continuously granularly commit as you work. Compose single-line commit messages
whenever appropriate. If the granular commit does indeed warrant further
context, include such within the commit message body.

Commit messages are checked by commitlint: a header of at most 50 characters,
as `type(scope): Sentence-case subject`, and body lines of at most 72. Scopes
are those in `.commitlintrc.mts`, one per plugin, and are omitted for changes
beyond a single plugin. Changes to the project's own Claude Code assets in
`.claude/` take the `ai` type, unscoped, as `ai: Subject`.

## Conventions

- `bun run check` runs every check CI runs; the pre-commit hook runs those
  that apply to the staged files. Tools come from `mise.toml` and
  `package.json`, not whatever happens to be on `PATH`
- Every file that can hold comments opens with the house header: vim
  modeline, SPDX licence, then `~chewygumxx/claude-library.git` and
  `::: :/<path>` between empty comment lines. Markdown splits it: `spdx:` is
  a front matter key, the box an HTML comment beneath the front matter and
  the modeline an HTML comment on the last line. Copy it from a sibling
  file; CI rewrites the path after a move
- Prose is in British English, and em dashes are prohibited
- JSON is indented with 4 spaces and formatted by Biome. A global git
  textconv shows JSON diffs sorted and re-indented; `git diff --no-textconv`
  shows the file as it is

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
