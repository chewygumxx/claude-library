---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/prohibit-em-dash/README.md
  #
  #

ctime: 2026-10-03
title: "Prohibit Em Dash: README.md"
description: >-
  Blocks any write or edit within the project directory whose proposed text
  contains an em dash, and tells the agent which lines to rewrite. Em dashes
  already in a file do not block, and a one-sentence reminder at session start
  keeps most from being written at all.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - linter
  - em-dash
---

# Prohibit Em Dash

Blocks any write or edit within the project directory whose proposed text
contains an em dash, and tells the agent which lines to rewrite. Em dashes
already in a file do not block.

A `PreToolUse` hook on `Write|Edit` checks `tool_input.content` (Write) or
`tool_input.new_string` (Edit) before the tool runs. A match exits 2, which
blocks the call and returns the offending line numbers, counted within that
proposed text, to the agent. Checking the proposed text rather than the whole
file mirrors a pre-commit check of added lines only.

A `SessionStart` hook, which also runs after compaction, puts one sentence
saying so in Claude's context. It costs about 40 tokens a session, and saves
regenerating a whole file when a `Write` is blocked.
