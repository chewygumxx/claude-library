---
# vim:set expandtab shiftwidth=2 filetype=markdown:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/.claude/skills/work-task-list/SKILL.md
#
#

name: work-task-list
description:
  Work through an existing task list to completion, respecting dependency edges.
  Use in a fix session started with CLAUDE_CODE_TASK_LIST_ID set, typically to
  apply code-review findings that review-to-tasks filed earlier.
allowed-tools:
  TaskGet, TaskList, TaskUpdate, Read, Edit, Write, Bash, Grep, Glob
---

# work-task-list

The consumer half of the review-to-tasks pipeline. Assumes a list already exists
and this session can see it.

## Preflight

Run `TaskList`. If it comes back empty, stop: this session is almost certainly
reading its own fresh list rather than the intended one. The list id defaults to
the session id, so a handoff only works when the session was started as:

```
CLAUDE_CODE_TASK_LIST_ID=<id> claude
```

Say that plainly rather than starting work on nothing. See
[the task tools reference](../review-to-tasks/references/task-tools.md) for the
full resolution order.

## The loop

1. `TaskList`, and pick the lowest-id task that is `pending` with an empty
   `blockedBy`. Earlier tasks tend to set up context for later ones.
2. `TaskGet` it for the full description and to confirm nothing has moved
   underneath you.
3. `TaskUpdate` to `in_progress` before touching any code. If the task has
   `metadata`, its `file`, `line` and `verdict` tell you where to look and how
   much to trust the finding.
4. Apply the fix.
5. `TaskUpdate` to `completed` only when it is genuinely done. Not when tests
   fail, not when the implementation is partial, not when you could not find the
   file. In those cases leave it `in_progress` and create a task describing the
   blocker.
6. Repeat. Completing a task may unblock others.

A `verdict` of `PLAUSIBLE` rather than `CONFIRMED` means the reviewing session
was not certain. Verify before changing code, and if the finding turns out to be
wrong, `TaskUpdate` to `deleted` and say why, rather than leaving it pending
forever or inventing a fix for a non-bug.

## Background work

Where a fix is slow and independent of the others, dispatch it as a background
agent and carry on with the next unblocked task. This is the one point in the
pipeline where `/tasks` in its literal sense earns its name: it is where those
background runs are watched, inspected and killed. It still shows nothing about
the task list itself, which lives behind `Ctrl+T`.

## Finishing

When nothing is left `pending` or `in_progress`, summarise what changed and what
was deleted as a false positive. The repository's CLAUDE.md asks that
uncommitted writes at a natural stopping point prompt a question about
committing, so ask.
