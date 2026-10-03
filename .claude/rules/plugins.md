---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/.claude/rules/plugins.md
  #
  #

ctime: 2026-10-04
title: Writing plugins
tags:
  - llm
  - claude
paths:
  - "plugins/**"
---

# Writing plugins

## Hooks

- Run scripts in exec form: `command` is the interpreter, `sh` or `bash`, and
  `args` holds `${CLAUDE_PLUGIN_ROOT}/hooks/<script>`, so scripts need no
  executable bit. Use `bash` only when the script needs it
- On a tool event, prefer an `if` permission rule, such as `Edit(*.sh)`, so no
  process runs until a matching call. Check again in the script: Claude Code
  runs the hook regardless when it cannot parse a Bash command
- Exit 0 to proceed; stdout JSON is read only then. Exit 2 sends stderr to
  Claude, and blocks in `PreToolUse` but cannot undo a `PostToolUse` edit.
  Any other code is a non-blocking error shown to the user
- Act only on files beneath `CLAUDE_PROJECT_DIR`
- Test that a tool runs, with `tool --version`, rather than `command -v`: a
  mise shim is on `PATH` even where it has no version to run
- shfmt reads unquoted associative array keys such as `[--flag]` as
  arithmetic, so quote them
- Set `defaultEnabled` to `false` for a hook that writes files, so a user-wide
  install changes nothing until a project opts in

## Testing

Put test payloads in a script file rather than a Bash command: this
session's own hooks see the command, and one may deny it for merely
containing what it guards. For a full pass, hand the plugin to the
`hook-verifier` agent.

## Keeping the plugin consistent

- A change in behaviour bumps the version: `bun run bump <plugin>`, with
  `minor` or `major` as a second argument when warranted
- The README's front matter `description` and first paragraph match
  `plugin.json`'s `description`
- A tool from `mise.toml` names, in its comment there, the plugins that need it
- A new plugin starts from `/new-plugin`, which registers it everywhere it is
  listed
