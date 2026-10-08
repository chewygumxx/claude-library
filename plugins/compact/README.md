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

Run `/compact:compact` and Claude writes a `/compact <instructions>` to run,
then justifies and rates it in four fixed lines, for a person or a driver to
parse:

- Appraisal, 1-100: the share of the context the foreseeable work no longer
  needs, the benefit of compacting
- Risk, 1-100: how likely the instructions are to let compaction lose what
  that work needs, weighted by the severity of the loss, the cost

A driver measures how full the context is itself and compacts when it is
full enough, Appraisal is high enough and Risk is low enough. A driver that
knows the next task passes it as `/compact:compact <foreseeable work>`, and
both ratings judge against it rather than Claude's own expectation.

The skill is user invoked only. As a standing instruction in `CLAUDE.md`, the
same request cost tokens in every session, prompted superfluous summaries
when context was low and still had to be asked for when context was high.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
