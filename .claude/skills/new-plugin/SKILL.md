---
ctime: 2026-10-03
mtime: 2026-10-05
spdx: GPL-3.0-only
title: New plugin
name: new-plugin
description: Scaffold a hook plugin in this marketplace and register it everywhere a plugin is listed.
tags:
  - llm
  - claude
argument-hint: <name> <what the plugin should do>
disable-model-invocation: true
allowed-tools: Bash(bun .claude/skills/new-plugin/scripts/new-plugin.mts *)
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/.claude/skills/new-plugin/SKILL.md
   -
   -->

# New plugin

Create the hook plugin described by: $ARGUMENTS

The script writes every file whose content follows from a few options, so
spend effort only on what it cannot know: the hook logic and the prose.

## 1. Choose the options

- `--name`: kebab-case; it is also the commitlint scope
- `--description`: one sentence in the present tense, as the other plugins'
  `plugin.json` descriptions read; it fills `plugin.json`, the README front
  matter and the README's first paragraph
- `--scope`: `Plugin: <Event> hook ...`, terse, as in `.commitlintrc.mts`
- `--event`, and for tool events `--matcher`
- `--if`: on a tool event, filter with a permission rule, such as
  `Edit(*.sh)` or `Bash(gh repo edit *)`, so no process runs until a matching
  call; the script must check again, since an unparseable Bash command runs
  the hook regardless
- `--shell bash` only when the hook needs Bash; `sh` otherwise
- `--keyword` for each topic beyond `hooks`; `--disabled` when the hook
  writes files or would surprise a project that did not ask for it

## 2. Run the script

`--help` lists the options; pass them in place of it.

```sh
bun .claude/skills/new-plugin/scripts/new-plugin.mts --help
```

It creates `plugins/<name>/` (manifest, `hooks/hooks.json`, a hook script
holding only its header and summary, and a README), adds the plugin to
`.claude-plugin/marketplace.json`, `.claude/settings.json` and the scopes in
`.commitlintrc.mts`, then formats them with Biome.

## 3. Write what it cannot

- The hook script's logic. A tool not already needed goes in `mise.toml`,
  and its comment there names the plugin
- The README beyond its first paragraph: why the hook exists, when it does
  nothing, and what it requires
- The summary comment in the hook script, if the generated one reads badly

## 4. Verify and commit

1. `bun run check`
2. Hand the plugin to the `hook-verifier` agent
3. Commit as `feat(<name>): Add <name> plugin`, then ask the user to run
   `/reload-plugins`

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
