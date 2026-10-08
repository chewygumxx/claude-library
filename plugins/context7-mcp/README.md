---
ctime: 2026-10-09
mtime: 2026-10-09
spdx: GPL-3.0-only
title: "Context7 MCP: README.md"
description: >-
  Gives Claude current documentation for libraries and tools, such as Biome,
  Bun and mise, from the Context7 MCP server.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - mcp
  - context7
  - documentation
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/context7-mcp/README.md
   -
   -->

# Context7 MCP

Gives Claude current documentation for libraries and tools, such as Biome,
Bun and mise, from the Context7 MCP server.

Tools such as these change faster than a model's training data. Biome 2, for
one, reads a nested configuration only as `biome.json` with `"root": false`
and matches nothing with a list of only negated globs, neither of which a
model may know. Context7 serves each library's documentation by version, so
Claude can look such things up rather than find them by experiment.

The server is Context7's hosted one, at `https://mcp.context7.com/mcp`,
without an API key, so requests share its anonymous rate limit.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
