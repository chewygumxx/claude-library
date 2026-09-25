<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/notes/2026-09-26-global-gitignore-hid-claude-dir.md
   -
   -->

# The global gitignore was hiding everything new under `.claude/`

Found 2026-09-26 while adding skills to this repository.

## Symptom

New files written to `.claude/skills/` and `.claude/scripts/` did not appear in
`git status` at all. Not as modified, not as untracked, not as ignored. They
were simply absent, which is the easiest kind of loss to miss, because the usual
signal that a file needs committing never fires.

## Cause

```
$ git check-ignore -v .claude/skills/review-to-tasks/SKILL.md
/home/chewygum/.config/git/ignore:23:.claude/   .claude/skills/review-to-tasks/SKILL.md
```

The global ignore file has `.claude/` on line 23. That is a reasonable default
for ordinary projects, where `.claude/` is local scratch, but it is exactly
wrong for this repository, whose purpose is to keep Claude Code configuration
under version control. CLAUDE.md states the requirement directly: none of this
documentation is to be ignored per git configuration.

Already-tracked files were unaffected, which is what made the problem invisible
for so long. `.claude/settings.json`, `.claude/hooks/sync-auto-memory-dir.sh`
and `.claude/memory/README.md` were added before the global pattern mattered,
and git does not re-evaluate ignore rules for paths it already tracks. Only new
additions fell through.

Collateral discovery: `.claude/output-styles/line-wrap-100.md` had been sitting
untracked and invisible since 15 September for the same reason.

## Fix

A repository `.gitignore`, which takes precedence over `core.excludesFile`:

```gitignore
!.claude/

.claude/worktrees/
```

Two things make this work. A repository-level `.gitignore` outranks the global
ignore file, so the negation re-includes the directory. And ordering matters,
because git applies the last matching pattern, so the `worktrees` exclusion has
to come after the negation to survive it.

`.claude/worktrees/` must stay ignored: each entry there is a full checkout of
this repository, so committing one would nest the repo inside itself.

## Worth remembering

`git status` staying silent is not evidence that nothing needs committing. When
work lands in a dotted directory, `git check-ignore -v <path>` is the check, and
it names the offending file and line number rather than leaving you to guess
which of the four ignore layers is responsible.
