---
__cgxx: |
  # vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3:
  # SPDX-License-Identifier: GPL-3.0-only

  #
  #
  # ~chewygumxx/claude-library.git
  # ::: :/plugins/repo-memory/README.md
  #
  #

ctime: 2026-10-03
title: "Repo Memory: README.md"
description: >-
  Keeps auto memory inside the repository. At session start, points
  autoMemoryDirectory in the git ignored .claude/settings.local.json at the
  project's .claude/memory, creating it. Disabled by default; enable it per
  project.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - memory
---

# Repo Memory

Keeps auto memory inside the repository. At session start, points
`autoMemoryDirectory` in the git ignored `.claude/settings.local.json` at the
project's `.claude/memory`, creating it.

Auto memory then lives with the repository, git tracked, rather than under
`~/.claude/projects/<project>/memory/`.

## Opting in

The plugin is disabled by default, since it creates `.claude/memory/` in every
project where it runs. Enable it per project in `.claude/settings.json`:

```json
{
    "enabledPlugins": {
        "repo-memory@chewygumxx": true
    }
}
```

## Why local settings

`autoMemoryDirectory` must be an absolute path, so its value differs for every
checkout. In the shared `.claude/settings.json` it would publish a home
directory path and be rewritten by every other clone or worktree. The hook
therefore refuses to write `.claude/settings.local.json` unless git ignores it.

Requires `jq`.
