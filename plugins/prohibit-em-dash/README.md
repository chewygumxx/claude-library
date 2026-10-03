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
  Parses any file an agent writes or edits within the project directory for em
  dashes. No em dashes, exits 0. Otherwise, exits 2 with line numbers of em
  dash locations.
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

Parses any file an agent writes or edits within the project directory for em
dashes. No em dashes, exits 0. Otherwise, exits 2 with line numbers of em dash
locations.
