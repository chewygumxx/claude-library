---
ctime: 2026-10-04
mtime: 2026-10-05
spdx: GPL-3.0-only
title: "Header Metadata: README.md"
description: >-
  In any repository whose files already carry the house header, writes it
  into each new file Claude creates, copied from the nearest headed file, and
  says so at session start.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - headers
  - spdx
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/header-metadata/README.md
   -
   -->

# Header Metadata

In any repository whose files already carry the house header, writes it into
each new file Claude creates, copied from the nearest headed file, and says so
at session start.

The header is a modeline, an SPDX licence line, and a banner whose
`~owner/repo.git` and `::: :/<path>` lines name the file's repository and
path, which [sync-header-metadata][] keeps true in CI. Writing one costs
Claude tokens and invites mistakes, such as a path left over from the file it
was copied from; a script does it exactly, for nothing.

A repository opts in simply by having headed files: the hooks act only where
a tracked file already carries the `::: :/<path>` marker, so the plugin can
be enabled user-wide and leaves other people's repositories alone.

## On Write

A `PreToolUse` hook on `Write` rewrites the content through `updatedInput`,
so the file is never written without its header, and tells Claude what it
added. The header is copied, not templated, so the licence, indentation,
shebang and Markdown style follow whatever the repository already does. The
source is, in order:

1. The file itself, when Claude overwrites a headed file and drops its header
2. The nearest headed file of the same type: the longest matching suffix
   first, so `x.toml.tmpl` prefers a `.toml.tmpl` to any `.tmpl`; for an
   extensionless file, one of the same name, then any extensionless file
   beside it, such as a zsh autoload function
3. The nearest headed file whose banner uses the same comment leader, keeping
   only its modeline, with the new file's filetype, its licence line and its
   banner; an extensionless script goes by its shebang

Nearest means the most shared directories, then the shallowest. In every case
only the `~owner/repo.git` line, taken from the `origin` remote, and the
`::: :/<path>` line change. A shebang in Claude's content comes first; in
Markdown, so does front matter, unless the header lives in it under a
`__cgxx` key.

Content that already holds a header only has those two lines corrected.

## At session start

In a headed repository, a `SessionStart` hook adds one sentence, about 70
tokens, telling Claude to leave the header out of new files and to keep it
intact in existing ones, and that after moving or renaming files
`bunx sync-header-metadata --update` corrects their paths. It can stand in
for the same instruction in a repository's CLAUDE.md.

## When it does nothing

- The repository has no headed file, or the file is outside the project
- The file is git ignored, or excluded by the `-sync-header-metadata`
  attribute or, where the attribute is not set, by sync-header-metadata's own
  defaults, such as `*.json` and `LICENSE*`
- The file's path holds whitespace, which the path marker cannot, as
  sync-header-metadata matches it
- No source is found, as for a type the repository has no comment leader for
- The tool is `Edit`, whose changes leave the header alone; a header that
  drifts after a move is sync-header-metadata's to correct

Requires `jq` and `git`.

[sync-header-metadata]: https://github.com/chewygumxx/sync-header-metadata

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
