---
ctime: 2026-10-09
mtime: 2026-10-09
spdx: GPL-3.0-only
title: Compact
description: >-
  Generate a compaction invocation
tags:
  - llm
  - claude
  - claude-code
  - agent-skill
  - compaction
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/compact/README.md
   -
   -->

# Compact

Generate a compaction invocation.

Run `/compact:compact` and Claude rates the case for compacting now, then
writes a `/compact <summary>` to run.

The skill is user invoked only. As a standing instruction in `CLAUDE.md`, the
same request cost tokens in every session, prompted superfluous summaries
when context was low and still had to be asked for when context was high.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
