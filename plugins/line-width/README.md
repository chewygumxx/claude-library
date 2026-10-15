---
ctime: 2026-10-15
mtime: 2026-10-16
spdx: GPL-3.0-only
title: "Line Width: README.md"
description: >-
  Wraps Claude's replies in the terminal at whitespace to 80 columns, leaving
  tables, code blocks and long paths and URLs at full width.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - ui
  - markdown
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/line-width/README.md
   -
   -->

# Line Width

Wraps Claude's replies in the terminal at whitespace to 80 columns, leaving
tables, code blocks and long paths and URLs at full width.

## Why

Replies drawn the full width of a wide terminal are hard to read. This
draws each reply's prose at a measure of 80 columns, wrapped at
whitespace, while tables, code blocks and any word too long for the
measure (a file path, a URL) keep the terminal's width, so none is broken
or squeezed.

Only the drawing changes: the stored reply, what Claude reads and the
ctrl+o transcript are left as they were.

## When it does nothing

- Off the terminal: the desktop app, VS Code and mobile draw as before
- In a terminal no wider than the measure and its two-column gutter
- On a summary of a reply, and on a reply that is one table, one code
  block or one long word

## Options

`columns`, the measure of reply text after the gutter: 80 by default,
from 40 to 200. Set it in `/config`.

## Requires

Claude Code 2.1.300 or later, for function hooks.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
