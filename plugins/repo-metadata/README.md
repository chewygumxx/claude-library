---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/repo-metadata/README.md
  #
  #

ctime: 2026-10-03
title: "Repo Metadata: README.md"
description: >-
  Tells the agent that .repo-metadata.jsonc, applied by CI on every push to
  main, is where a repository's GitHub description, topics and licence are
  edited, since changes made on GitHub are silently reverted.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - github
---

# Repo Metadata

Tells the agent that `.repo-metadata.jsonc`, applied by CI on every push to
`main`, is where a repository's GitHub description, topics and licence are
edited, since changes made on GitHub are silently reverted.

Plugins cannot ship `.claude/rules/`, and a skill's description sits in context
every session, wanted or not. Two hooks, each gated by an `if` filter so no
process runs until a matching tool call, replace the rule at no standing token
cost:

- `PostToolUse` on `Read(.repo-metadata.jsonc)` adds
  [`hooks/repo-metadata.md`](hooks/repo-metadata.md) to Claude's context, as a
  path-scoped rule would when the file is read
- `PreToolUse` on `Bash(gh repo edit *)` denies changing the description,
  topics or default branch in a project with a `.repo-metadata.jsonc`, and
  points Claude at the file instead

Requires `jq`.
