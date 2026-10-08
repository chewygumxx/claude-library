---
name: commonmark-memory-links
description: "Link between memories with CommonMark links, never wikilinks"
metadata:
  node_type: memory
  spdx: GPL-3.0-only
  type: feedback
  originSessionId: cd0db894-70f1-4b44-b2f4-823da5b19cae
  modified: 2026-10-08T15:52:08.870Z
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/.claude/memory/commonmark-memory-links.md
   -
   -->

Link one memory to another with a CommonMark link to its file, as
`[granular-commits-backlog](./granular-commits-backlog.md)`, never with the
memory system's default wikilink form. Link only to memories that exist.

**Why:** the user wants CommonMark compliant Markdown. remark's
`no-undefined-references`, run with `--frail` by `lint:md` and the
pre-commit hook, also reads a wikilink as two undefined references and
fails the commit.

**How to apply:** in every memory body and in `MEMORY.md`, which takes
`./`-relative links and a colon, not a dash, before its hook.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
