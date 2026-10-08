---
name: granular-commits-backlog
description: Backlogged 2026-10-09; dedupe the granular commit rule from ~11 repo CLAUDE.md files into a plugin
metadata:
  node_type: memory
  spdx: GPL-3.0-only
  type: project
  originSessionId: cd0db894-70f1-4b44-b2f4-823da5b19cae
  modified: 2026-10-08T15:49:21.649Z
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/.claude/memory/granular-commits-backlog.md
   -
   -->

The "Continuously granularly commit as you work..." paragraph is duplicated
across this repo's `.claude/CLAUDE.md` and about 10 other repositories'.
Backlogged on 2026-10-09 while the `compact` plugin's ratings are resolved
first.

**Why:** the user will not move it to the global CLAUDE.md, because a repo
should not depend on an external asset it does not reference. A plugin
enabled in the repo's checked in `.claude/settings.json` is such a
reference.

**How to apply:** when resumed, weigh a `SessionStart` hook injecting the
rule (constant context, which this rule warrants) against a `Stop` hook
checking `git status --porcelain` (cheaper, but it nudges at the turn's end
and so favours batched commits). The commitlint specifics stay in each
repo's CLAUDE.md, being tied to its own config. Do not start it until the
user lifts the backlog.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
