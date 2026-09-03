<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/notes/2026-09-03-repo-local-auto-memory.md
   -
   -->

# Pinning auto memory to a repo-local, git-tracked directory

## The grievance

Claude Code writes repository-specific state, including auto memory, under
`~/.claude/projects/<mangled-or-derived-name>/` rather than to the
repository's own `.claude/` directory. For a repository whose stated purpose
is portability and full git tracking of its own documentation, that means
Claude's accumulated notes about this project live entirely outside the
repository and outside version control.

## What the docs actually say

Checked against the current Claude Code docs
(`https://code.claude.com/docs/en/memory.md`), fetched during this
conversation rather than assumed:

- Auto memory's default storage path is `~/.claude/projects/<project>/memory/`.
  `<project>` is derived from the git repository itself, not the checkout
  path, so that "all worktrees and subdirectories within the same repo share
  one auto memory directory." Repo-local storage would break that: every
  worktree or clone would fork its own disconnected memory.
- The docs state directly that "auto memory is machine-local... Files are
  not shared across machines or cloud environments." It is designed as local
  session state, not a portable team artifact.
- Auto memory files are explicitly excluded from the `cleanupPeriodDays`
  transcript-retention sweep; they persist until edited or deleted, unlike
  ordinary session transcripts.
- A real override exists: `autoMemoryDirectory`, settable from any settings
  scope (user, project, local, policy, or `--settings`). Quoting the docs:
  "The value must be an absolute path or start with `~/`." A relative,
  clone-portable path is explicitly rejected. This is the one place a
  repo-local fix cannot be fully portable on its own, the committed value is
  necessarily tied to wherever the repository happens to live on the current
  machine.

## The fix implemented here

`.claude/settings.json` now sets `autoMemoryDirectory` to this repository's
`.claude/memory` directory as an absolute path, and, since that absolute
path is exactly the part that isn't portable across a clone or a move, a
`SessionStart` hook in the same file resolves the repository root fresh on
every session start and rewrites `autoMemoryDirectory` if it no longer
matches. A hook was used instead of a `CLAUDE.md` instruction on purpose,
`CLAUDE.md` content is context Claude tries to follow but the client doesn't
enforce, whereas a hook fires unconditionally every session regardless of
what Claude decides. Given the hook already guarantees the sync, adding a
parallel `CLAUDE.md` instruction would have been redundant, so none was
added.

The logic originally lived as one long inline command in
`.claude/settings.json`. Moved out to `.claude/hooks/sync-auto-memory-dir.sh`
for readability, invoked from the hook using exec form so the path
placeholder needs no shell quoting:

```json
{
  "type": "command",
  "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/sync-auto-memory-dir.sh",
  "args": []
}
```

`${CLAUDE_PROJECT_DIR}` is a Claude Code path placeholder, substituted into
the command and also exported into the spawned process's environment, "the
project root where the session started." The script itself:

```bash
#!/usr/bin/env bash
set -euo pipefail

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
dir="$root/.claude/memory"
settings="$root/.claude/settings.json"

cur="$(jq -r '.autoMemoryDirectory // empty' "$settings")"
if [ "$cur" != "$dir" ]; then
  tmp="$settings.tmp"
  jq --arg d "$dir" '.autoMemoryDirectory = $d' "$settings" > "$tmp" && mv "$tmp" "$settings"
fi
```

It prefers `$CLAUDE_PROJECT_DIR` (falling back to `git rev-parse
--show-toplevel`, then the current directory, for when the script is run
standalone outside a hook invocation), computes the expected
`<root>/.claude/memory` path, and only rewrites `autoMemoryDirectory` (via a
`jq` merge that touches nothing else in the file) when the stored value no
longer matches. Verified, on a scratch copy, to be a no-op when already
correct and to correctly rewrite a deliberately stale path back to the
current repository root, both as the original inline command and again
after extraction to the script file.

## Caveats worth remembering

- `autoMemoryDirectory` genuinely cannot be a relative path. The
  self-healing hook is the mitigation for that, not a workaround that
  removes the limitation.
- This whole mechanism is unrelated to `check-jsonschema` validating against
  `schemastore.org/claude-code-settings.json`, that schema was separately
  found to lag behind the live Claude Code schema for `sandbox.credentials`
  mode values (see the `reference/claude-settings.security-example.jsonc`
  comments for that finding). `autoMemoryDirectory` and `hooks.SessionStart`
  are both long-established schema fields and were not affected by that
  particular staleness.
