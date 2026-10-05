---
ctime: 2026-10-03
mtime: 2026-10-05
spdx: GPL-3.0-only
title: "Repo Metadata: README.md"
description: >-
  Tells the agent that .repo-metadata.jsonc, applied by CI on every push to
  main through sync-repo-metadata, is where the GitHub settings it sets are
  edited, and denies gh repo edit changing them, since changes made on GitHub
  are silently reverted.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - github
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/repo-metadata/README.md
   -
   -->

# Repo Metadata

Tells the agent that `.repo-metadata.jsonc`, applied by CI on every push to
`main` through [sync-repo-metadata][], is where the GitHub settings it sets are
edited, and denies `gh repo edit` changing them, since changes made on GitHub
are silently reverted.

Plugins cannot ship `.claude/rules/`, and a skill's description sits in context
every session, wanted or not. Two hooks, each gated by an `if` filter so no
process runs until a matching tool call, replace the rule at no standing token
cost:

- `PostToolUse` on `Read(.repo-metadata.jsonc)` adds
  [`hooks/repo-metadata.md`](hooks/repo-metadata.md), less its front matter
  and file header, to Claude's context, as a path-scoped rule would when the
  file is read
- `PreToolUse` on `Bash(gh repo edit *)` denies a flag whose setting the
  project's `.repo-metadata.jsonc` sets, and points Claude at the file instead.
  sync-repo-metadata leaves a key the file omits alone on GitHub, so a flag
  such as `--enable-wiki` is allowed until the file sets `has_wiki`, and flags
  it never applies, such as `--default-branch`, are always allowed

Requires `jq`.

`gh api` and the web interface are not caught; the next push reverts them.

[sync-repo-metadata]: https://github.com/chewygumxx/sync-repo-metadata

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
