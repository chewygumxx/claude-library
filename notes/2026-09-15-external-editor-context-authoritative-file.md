<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/notes/2026-09-15-external-editor-context-authoritative-file.md
   -
   -->

# `externalEditorContext` silently not taking effect: which file actually rules it

## The symptom

`externalEditorContext` was set to `true`, `$EDITOR`/`$VISUAL` were both `nvim`, and
Ctrl+G correctly spawned `nvim --embed` against a real scratch file
(`/tmp/claude-1000/claude-prompt-*.md`) that round-tripped typed prompt text fine. But
the documented behaviour of the setting, Claude's last response prepended as `#` comment
lines above a "write your reply below this line" marker, never appeared. This had
reportedly worked a week earlier; nothing changed in the user's own environment in the
meantime except routine package upgrades (Claude Code CLI itself, `2.1.272-1` via the
Arch `claude-code` pacman package).

## Dead ends ruled out before finding the real cause

- Not a Neovim or terminal problem: confirmed by locating the live scratch file
  directly from `ps` output while the buffer was still open (`nvim --embed
  /tmp/claude-1000/claude-prompt-<uuid>.md` as a child of the `claude` process), and
  reading the buffer from inside Neovim itself. Genuinely no comment block was ever
  written, not stripped or hidden client-side.
- Not sandboxing: the interactive `claude` process and its `nvim` child share the same
  mount namespace as the shell doing the inspecting; no `bubblewrap` process was
  involved despite it being an optional dependency of the package.
- Not a per-project override: the project-scoped blob under the `projects` key in the
  global `~/.claude.json` has no editor-related fields for this repository.
- A red herring encountered along the way: `:vs e /tmp/...` in Neovim is not `:vsplit`
  plus `:edit`, `:vsplit` treats the rest of the line as one filename including the
  space, so it opens a new, nonexistent file literally named `e /tmp/...`, which
  triggers the user's own `BufNewFile` note-template autocmd. That template output
  (SPDX header, `ctime:`/`title:`/`tags:` frontmatter) looked superficially like it
  could be Claude-related but had nothing to do with this setting.

## The actual cause

Three separate files on disk can plausibly claim to hold this key:

- `~/.claude.json`, the legacy home-root location.
- `$CLAUDE_CONFIG_DIR/.claude.json` (XDG-relocated, `~/.config/claude/.claude.json` in
  this setup).
- `~/.config/claude/settings.json`.

Only the second one is authoritative for `externalEditorContext`. Per the current docs
(`https://code.claude.com/docs/en/settings-reference#externaleditorcontext`), the
setting's scope is explicitly "Global config", its documented location is
`~/.claude.json` (or its `$CLAUDE_CONFIG_DIR`-relocated equivalent), and critically:
"Claude Code ignores this key in `settings.json`." All three files can say `true`
simultaneously while the live, effective value is `false`, exactly what was observed
here: the legacy file said `true` and did nothing, `settings.json` said `true` and did
nothing (ignored by design for this key), and the real global config file was the one
actually holding `false`.

The `/config` menu inside a running session (`Show last response in external editor`)
reads live, in-process state and is not fooled by any of this. Toggling it there fixed
the problem immediately, and was confirmed to have rewritten
`$CLAUDE_CONFIG_DIR/.claude.json` specifically.

## Takeaway

When a Claude Code setting silently isn't taking effect, prefer `/config` over grepping
or hand-editing JSON on disk. Several files can plausibly hold the same key name at
different scopes (legacy home-root, XDG global, project), and some keys are documented
to be honored in exactly one of those locations and silently ignored elsewhere. A file
saying the right thing is not proof the running process agrees with it.
