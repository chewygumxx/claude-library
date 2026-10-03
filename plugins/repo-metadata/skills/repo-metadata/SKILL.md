---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/repo-metadata/skills/repo-metadata/SKILL.md
  #
  #

ctime: 2026-09-27
title: Repository metadata
description: >-
  Use when editing .repo-metadata.jsonc, or when asked to change a GitHub
  repository's description, topics or licence. CI applies that file to GitHub
  on every push to main, so those settings are edited there, not on GitHub.
paths:
  - ".repo-metadata.jsonc"
user-invocable: false
tags:
  - llm
  - claude
---

# `.repo-metadata.jsonc` is the GitHub settings page

This file holds the GitHub repository's own description, topics and licence. CI
applies it on every push to `main`, so those settings are edited here and not in
the web interface.

Editing them in the web interface, or with `gh repo edit`, is the failure worth
naming: nothing rejects it, and the next push silently reverts it.
