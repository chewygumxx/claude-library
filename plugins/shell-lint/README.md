---
ctime: 2026-10-03
mtime: 2026-10-05
spdx: GPL-3.0-only
title: "Shell Lint: README.md"
description: >-
  After Claude writes or edits a shell script, found by shebang as well as
  extension, formats it with shfmt and reports shellcheck's findings back to
  Claude.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - shell
  - shellcheck
  - shfmt
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/shell-lint/README.md
   -
   -->

# Shell Lint

After Claude writes or edits a shell script, found by shebang as well as
extension, formats it with shfmt and reports shellcheck's findings back to
Claude.

A `PostToolUse` hook on `Write|Edit`. `shfmt -f` decides what counts as a
shell script, so a git hook with a shebang and no extension is linted too,
which an `if` filter on the path could not do. Then:

- shfmt formats the file in place, following the project's `.editorconfig`,
  and Claude is told to read the file again before editing it
- shellcheck checks the file, following the project's `.shellcheckrc`, and
  any findings, or a syntax error shfmt cannot format, go back to Claude with
  exit code 2; the edit itself stands

The hook does nothing when any of these hold:

- The file is outside the project, or is not a shell script
- `shfmt` does not run, as when it is not on `PATH` or is a mise shim with no
  version set for the project; without `shellcheck`, it only formats

Requires `jq`.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
