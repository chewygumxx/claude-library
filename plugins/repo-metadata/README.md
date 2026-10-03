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
  - skills
  - github
---

# Repo Metadata

Tells the agent that `.repo-metadata.jsonc`, applied by CI on every push to
`main`, is where a repository's GitHub description, topics and licence are
edited, since changes made on GitHub are silently reverted.

Plugins cannot ship `.claude/rules/`, so this was a path-scoped rule and is now
a skill with the same `paths` glob. It loads automatically when the agent works
with `.repo-metadata.jsonc`, and its description also lets the agent load it
when asked to change those GitHub settings without touching the file. It is
hidden from the `/` menu (`user-invocable: false`), as background knowledge.
