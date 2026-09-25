<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/notes/2026-09-26-plugin-marketplace-stale-config-path.md
   -
   -->

# "its marketplace directory does not exist": plugin state files store absolute paths

## The symptom

Every Claude Code start printed a pair of lines before the prompt appeared:

```
Installing plugin "lua-lsp@claude-plugins-official"...
✘ Failed to install plugin "lua-lsp@claude-plugins-official": Cannot install lua-lsp@claude-plugins-official: its marketplace directory does not exist
```

The message is literally true and yet completely misleading. The marketplace
directory did exist, fully cloned and current. It simply was not where the
registry claimed it was.

## The cause

This machine sets `CLAUDE_CONFIG_DIR=/home/chewygum/.config/claude`, an
XDG-style location. The config directory used to be the default
`/home/chewygum/.claude`, and was migrated at some earlier point. Claude Code's
plugin state files record **absolute** paths, and nothing rewrote them during
the move. So `~/.config/claude/plugins/known_marketplaces.json` still read:

```json
"installLocation": "/home/chewygum/.claude/plugins/marketplaces/claude-plugins-official"
```

while `/home/chewygum/.claude` no longer existed at all. The same stale prefix
appeared on all ten `installPath` entries in `installed_plugins.json`.

The interesting part is that two subsystems disagree about how to find the
marketplace, and only one of them is broken:

- The **marketplace refresh** derives paths from the live config directory. It
  worked fine, and had re-cloned `anthropics/claude-plugins-official` into
  `~/.config/claude/plugins/marketplaces/claude-plugins-official` minutes before
  the failure.
- The **plugin installer** trusts the stored `installLocation` string verbatim.
  Its existence check hit the dead legacy path and aborted.

Worse, the refresh updates the `lastUpdated` field but leaves `installLocation`
alone, so the broken state is self-perpetuating. It cannot heal itself no matter
how many times the marketplace is refreshed, and the error recurs on every
single start.

A secondary consequence: roughly 90 minutes after the migration, the plugin
cache sweeper ran, failed to match the cached plugin directories to any
resolvable install record, and dropped `.orphaned_at` marker files into both of
them. Those markers flag a cache entry for garbage collection. Had the sweep
been left alone, it would eventually have deleted perfectly good cached plugins,
turning a path bug into an actual data loss and a forced re-download.

## Diagnosing it

The sequence that isolated this, useful for any "Claude Code cannot find its own
files" report:

1. `echo $CLAUDE_CONFIG_DIR` to learn where config is supposed to live.
2. `ls -ld ~/.claude` to check whether the default location still exists. Here
   it did not, which immediately implicates a migration.
3. Read `installLocation` out of
   `$CLAUDE_CONFIG_DIR/plugins/known_marketplaces.json` and compare it against
   what is actually on disk. The mismatch is the whole bug.
4. `grep -rl '/home/chewygum/\.claude/' "$CLAUDE_CONFIG_DIR"` to find every file
   still carrying the legacy prefix. Filter out `projects/`, `history.jsonl`,
   `file-history/`, `shell-snapshots/`, and `session-env/`, which are historical
   transcripts and must not be touched. Only two live config files remained.

Directory mtimes were a strong corroborating signal throughout. Everything under
`plugins/` shared a single timestamp, which dates the migration precisely, and
the `.orphaned_at` epoch values pinned the follow-up sweep to 93 minutes later.

## The fix

Purely a search and replace of `/home/chewygum/.claude/` to
`/home/chewygum/.config/claude/` in exactly two files,
`plugins/known_marketplaces.json` and `plugins/installed_plugins.json`, followed
by deleting the two `.orphaned_at` markers so the sweeper would not collect the
now correctly referenced cache entries. No re-download was needed, because every
path resolved to something already present once corrected.

Verification was to confirm both files still parse as JSON, confirm zero
remaining occurrences of the legacy prefix, and programmatically `test -d` every
`installLocation` and `installPath` value extracted from the repaired files.

The stale `projectPath` entries pointing into `~/.local/share/chezmoi`
subdirectories were deliberately left in place. They are inert install-scope
records rather than resolution inputs, so they cost nothing.

## Verifying the fix without restarting, and a false alarm

Immediately after the repair, running `/plugin list` inside the already open
session still reported all ten entries as `✘ failed to load`. This looks like
the fix having failed, or having merely traded one error for another. It had
not. **Plugin load status is resolved once at session startup and then cached in
memory for the life of the session.** The session predated the repair by four
minutes, so the slash command was faithfully reporting state captured while the
paths were still broken. A running session will never notice a plugin config
repair.

The way to check the real state without killing the session is to ask a fresh
process:

```sh
claude plugin list
```

That spawns a new process which re-resolves everything from disk. It reported
all ten as `✔ enabled` with zero failures, which confirmed the repair.
`claude plugin` also offers `details`, `enable`, and `disable` subcommands, and
is generally the way to inspect plugin state out of band.

The broader habit: when verifying a fix to anything Claude Code reads at
startup, hooks, settings, plugins, MCP servers, treat in-session slash command
output as a stale cache and reach for a fresh process or a restart.

Investigating the false alarm did surface a genuine design detail. The ten LSP
plugins, alone among the marketplace's forty-one, ship as bare directories with
no `.claude-plugin/plugin.json`. That is deliberate, and it is declared: every
one of them carries `"strict": false` in `marketplace.json` alongside its
`lspServers` block. The `strict: false` flag is what permits a plugin directory
to omit a manifest and take its metadata from the marketplace entry instead. So
a bare plugin directory is only suspicious if the marketplace entry is missing
that flag.

## Lessons

The generalisable finding is that **Claude Code's plugin state stores absolute
paths that do not survive a config directory move**. Anyone relocating
`~/.claude`, whether to an XDG path or anywhere else, should grep the new
location for the old prefix afterwards rather than assuming the move was
complete. A directory move that looks clean at the filesystem level can still
leave the application's internal bookkeeping pointing at nothing.

A second, narrower observation worth remembering: a cached LSP plugin whose
directory contains only `LICENSE` and `README.md` is **not** truncated or
corrupt, which was the first instinct on seeing it. The marketplace's own
`plugins/lua-lsp/` directory holds those same two files and nothing else. For
this family of plugins the entire functional payload is the `lspServers` block
declared in the marketplace's `marketplace.json`, so there is genuinely nothing
else to ship. Do not go chasing a failed download that never happened.

Finally, the error text is worth criticising on its own terms. "Its marketplace
directory does not exist" would have been far more actionable as "marketplace
directory /home/chewygum/.claude/plugins/marketplaces/claude-plugins-official
does not exist", since printing the path it actually checked would have made the
stale prefix obvious on sight instead of requiring an investigation.
