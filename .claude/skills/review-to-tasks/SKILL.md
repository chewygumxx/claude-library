---
# vim:set expandtab shiftwidth=2 filetype=markdown:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/.claude/skills/review-to-tasks/SKILL.md
#
#

name: review-to-tasks
description:
  Convert a finished /code-review into task-list entries with dependency edges,
  then hand the list to a separate fix session. Use when a code review has
  produced several findings and you want them tracked durably rather than fixed
  immediately, or when the review happened in an earlier session whose findings
  need recovering.
allowed-tools:
  TaskCreate, TaskGet, TaskList, TaskUpdate, Bash(python3
  ${CLAUDE_PROJECT_DIR}/.claude/scripts/extract-review-findings.py:*), Read
---

# review-to-tasks

Turns code-review findings into durable, dependency-ordered work items. Use this
instead of `/code-review --fix` when the fixes should survive the session, be
worked in a deliberate order, or be split across sessions or agents.

See [references/task-tools.md](references/task-tools.md) for the verified
mechanics of the task list, including the model gate and the two unrelated
things Claude Code calls a "task".

## 1. Preflight

Confirm `TaskCreate` is in your tool surface. It is gated on the model: Opus 5
and Sonnet 5 are not on the harness allowlist, so the tools are absent unless
`CLAUDE_CODE_ENABLE_TODO_TOOLS=1` is set. This repository sets it in
`.claude/settings.json`.

If `TaskCreate` is missing, stop and say so. Do not fall back to writing
`$CLAUDE_CONFIG_DIR/tasks/<listId>/*.json` by hand: the directory carries a
`.lock` and a `.highwatermark`, and a live subscription drives the panel, so
out-of-band writes desync the view rather than populating it. Losing findings
loudly beats filing them somewhere nothing reads.

Then run `TaskList` first. If entries already exist, you may be looking at a
list from earlier work, and duplicating findings onto it is worse than nothing.

## 2. Obtain the findings

In order of preference:

1. Findings already reported in this conversation. Use them directly.
2. Findings from an earlier session. Recover them with the extractor:

```
python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/extract-review-findings.py --list
python3 ${CLAUDE_PROJECT_DIR}/.claude/scripts/extract-review-findings.py
```

`--list` summarises every recoverable payload so the user can pick; bare
invocation emits the newest accepted one as JSON. Add `--session ID` to pin one,
`--any-project` to look outside the current working directory, `--all` for every
payload as an array.

The extractor already discards calls the harness rejected. A review whose
`short_summary` exceeded the 60-character cap gets an `InputValidationError` and
retries, leaving both the refused call and the accepted retry in the transcript
looking nearly identical. Never hand-roll this correlation; use the script.

If the newest payload has `outcome` set on its findings, it is a post-fix
re-report. Those findings are already addressed, so confirm with the user before
filing them.

## 3. File one task per finding

One `TaskCreate` call per finding. The tool rejects batching outright: it
"creates ONE task per call and has no `tasks` or `todos` parameter."

Mapping, which is exact rather than approximate because `ReportFindings` caps
`short_summary` at the same 60 characters a task subject wants:

- `subject`: the finding's `short_summary`, verbatim
- `activeForm`: present continuous for the spinner, for example "Fixing the
  keywordprg bypass"
- `description`: `summary` then `failure_scenario`, prefixed with `file:line`,
  so the fix session needs nothing from the reviewing session
- `metadata`:
  `{"file": ..., "line": ..., "category": ..., "verdict": ..., "source_session": ...}`

Put the structured fields in `metadata`, not prose. It keeps `description`
readable and leaves the provenance machine-checkable.

Order the calls so related findings get adjacent ids. `TaskList` advises working
in id order, so grouping by file pays off later.

## 4. Add dependency edges, conservatively

Use `TaskUpdate` with `addBlockedBy`. Propose the edge set to the user before
writing it.

Add an edge only when fixing one finding would conflict with or invalidate
another: two findings in the same function, or one whose fix subsumes the other.
Order same-file findings by line. Leave everything else unblocked, because a
blocked task cannot be claimed, and a spurious edge serialises work that could
have run in parallel.

Resist inferring edges from mere file co-location. Two unrelated bugs in a long
file are independent.

## 5. Hand off

Report the list id, which is `CLAUDE_CODE_TASK_LIST_ID` if set and otherwise
this session's `CLAUDE_CODE_SESSION_ID`, and give the user the exact command:

```
CLAUDE_CODE_TASK_LIST_ID=<id> claude
```

That is the whole reason a handoff works. Without it the fix session mints an
empty list keyed to its own session id and this list is orphaned on disk. In the
fix session, invoke `work-task-list`.
