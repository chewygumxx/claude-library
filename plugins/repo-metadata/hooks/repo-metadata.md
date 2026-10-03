---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/repo-metadata/hooks/repo-metadata.md
  #
  #

ctime: 2026-09-27
title: Repository metadata
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
