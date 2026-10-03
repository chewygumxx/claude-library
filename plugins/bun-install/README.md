---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/bun-install/README.md
  #
  #

ctime: 2026-10-03
title: "Bun Install: README.md"
description: >-
  At the start of a remote (cloud) session, installs the project's dependencies
  with bun install --frozen-lockfile, when the project has a Bun lockfile.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - bun
---

# Bun Install

At the start of a remote (cloud) session, installs the project's dependencies
with `bun install --frozen-lockfile`, when the project has a Bun lockfile.

A remote session starts from a fresh checkout with no `node_modules/`, so
lifecycle scripts, such as husky wiring git hooks from `prepare`, have not run.
This installs before anything else in the session does.

The hook does nothing when any of these hold:

- `CLAUDE_CODE_REMOTE` is not `true`, as in a local session
- The project has no `package.json`, or no `bun.lock` or `bun.lockb`
- `bun` is not on `PATH`
