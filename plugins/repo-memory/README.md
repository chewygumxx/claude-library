---
ctime: 2026-10-03
mtime: 2026-10-09
spdx: GPL-3.0-only
title: "Repo Memory: README.md"
description: >-
  Keeps auto memory inside the repository. At session start, points
  autoMemoryDirectory in the git ignored .claude/settings.local.json at the
  project's .claude/memory, creating it, and blocks wikilinks written there.
  Disabled by default; enable it per project.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - hooks
  - memory
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/repo-memory/README.md
   -
   -->

# Repo Memory

Keeps auto memory inside the repository. At session start, points
`autoMemoryDirectory` in the git ignored `.claude/settings.local.json` at the
project's `.claude/memory`, creating it, and blocks wikilinks written there.

Auto memory then lives with the repository, git tracked, rather than under
`~/.claude/projects/<project>/memory/`.

## CommonMark links

Claude Code's memory system links one memory to another as `[[name]]`, which
CommonMark does not recognise: remark's `no-undefined-references` reads it as
two undefined references. A `PreToolUse` hook therefore blocks a Write or
Edit to a Markdown file in `.claude/memory/` whose new text holds one, and
names the lines to relink as `[name](./name.md)`.

The rule costs no context until it is broken: there is no standing
instruction, only the message on a blocked write. Code spans and fenced
code are exempt, as is `[[` followed by a space or colon, so a memory may
quote a Bash test or a bracket expression.

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

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
