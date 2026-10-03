---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/plugin-lint/README.md
  #
  #

ctime: 2026-10-03
title: "Plugin Lint: README.md"
description: >-
  After Claude edits a plugin or marketplace manifest, a hooks file, a skill or
  an agent, runs claude plugin validate on it and reports any problem back to
  Claude.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - plugins
  - validate
  - lint
---

# Plugin Lint

After Claude edits a plugin or marketplace manifest, a hooks file, a skill or an
agent, runs claude plugin validate on it and reports any problem back to Claude.

A `PostToolUse` hook on `Write|Edit`. A broken `hooks.json` otherwise goes
unnoticed until `/reload-plugins` fails to load the plugin, or its hooks
silently never fire. The edited file decides what is validated:

- `.claude-plugin/plugin.json` or `marketplace.json`: the plugin or
  marketplace it belongs to
- `hooks/hooks.json`, or a skill, agent or command inside a plugin: the
  nearest plugin above it
- A skill, agent or command under the project's `.claude/`: `.claude`

Validation is `--strict`, so fields the runtime would ignore are reported
too. A failing report goes back to Claude with exit code 2; the edit itself
stands.

The hook does nothing when any of these hold:

- The file is outside the project, or is none of the above
- `claude` is not on `PATH`

Requires `jq`.
