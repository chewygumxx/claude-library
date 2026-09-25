<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/notes/2026-09-26-tasks-command-and-task-list.md
   -
   -->

# `/tasks` is not the task list

Written 2026-09-26, against Claude Code 2.1.278.

## The question

Given a finished `/code-review` with several advised objectives, how do you use
`/tasks` to track them? The answer is that you do not, because `/tasks` is
unrelated to work items, and the subsystem that does track them was switched off
underneath this machine by a model upgrade.

## Two subsystems, one word

`/tasks` is defined in the binary as
`{name:"tasks", aliases:["bashes"], description:"View and manage everything running in the background"}`.
It is `/bashes` renamed: a monitor for background shells and background
subagents, with the status vocabulary
`pending, running, completed, failed, killed, paused`. It holds no work items at
all.

The work-item tracker is a separate thing: the `TaskCreate`, `TaskGet`,
`TaskUpdate`, `TaskList` tools, with the status vocabulary
`pending, in_progress, completed` plus `deleted`, persisting one JSON file per
item under `$CLAUDE_CONFIG_DIR/tasks/<listId>/`, and surfaced by `Ctrl+T` rather
than by any slash command. It supports `blocks` and `blockedBy` dependency
edges, which is what makes it a better fit for review findings than a flat todo
list.

Nothing in the UI connects the two names. The command you would reach for is the
one that cannot help.

## The gate, which is the actual finding

All four tools share one `isEnabled`:

```js
function dS() {
  return a.CLAUDE_CODE_ENABLE_TASKS !== false;
}
function tN() {
  if (Ml() || syr()) return true;
  let e = b7e();
  if (e === undefined || vUo(e) || EUo(e)) return true;
  return a.CLAUDE_CODE_ENABLE_TODO_TOOLS === true;
}
function P4() {
  return dS() && tN();
}
```

`EUo` tests a hardcoded model set covering Claude 3.x, Opus 4.0 through 4.7,
Sonnet 4.0 through 4.6, and Haiku 4.5. `claude-opus-5` and `claude-sonnet-5` are
absent. The binary's own changelog confirms this is deliberate: task tools are
"offered only on Claude 3.x, Opus 4.0-4.7, Sonnet 4.0-4.6, Haiku 4.5; set
`CLAUDE_CODE_ENABLE_TODO_TOOLS=1` elsewhere". `TodoWrite` is gated identically,
which is why a Claude 5 session has no todo list either.

The failure mode is silence. On Opus 5 the tools are simply not in the surface,
so asking for findings to be filed produces nothing and no error.

The evidence that this changed underneath the machine rather than never having
worked: `$CLAUDE_CONFIG_DIR/tasks/8825acbd-5030-4930-a28c-dc13a8039e28/` holds
an 11-item list written on 23 September, with populated `subject`, `description`
and `status` fields, from a session on a pre-Opus-5 model.

Fixed by adding `"env": {"CLAUDE_CODE_ENABLE_TODO_TOOLS": "1"}` to the
repository's tracked `.claude/settings.json`, which keeps it portable rather
than burying it in user settings.

Worth recording: the four tools appeared in the already-running session
immediately after that edit, with no restart. Settings appear to be watched and
the tool surface re-evaluated. Reproduce before relying on it; the skills verify
`TaskCreate` is present instead of assuming.

## Two transcript traps found while building the extractor

A `/code-review` reports via `ReportFindings`, which lands in the transcript as
an assistant `tool_use` block, so findings stay recoverable after the session
ends. Scraping them has two non-obvious hazards, both of which only showed up
against real history.

First, the string `ReportFindings` appears in essentially every transcript,
because the tool schema is part of the system prompt. `grep -l` across
`projects/*/*.jsonl` implicates sessions that merely had the tool available.
Counting only parsed `tool_use` blocks cut several hundred phantom hits down to
55 real payloads.

Second, and more dangerous: rejected calls are recorded too. `ReportFindings`
caps `short_summary` at 60 characters, and a review that overshoots gets an
`InputValidationError` and retries. Both calls sit in the transcript seconds
apart with identical finding counts and distinct `tool_use` ids, so the refused
one looks exactly as legitimate as the accepted one. Taking the newest naively
hands over a payload the harness threw away. Of the 55 payloads on this machine,
12 were rejected, all for the same reason. The extractor now correlates each
call with its `tool_result` by `tool_use_id` and drops the failures.

That cap is also a small gift: every accepted `short_summary` is under 60
characters, so it maps onto a task `subject` verbatim.

## What was built

- `.claude/settings.json`, `env` block enabling the tools project-locally
- `.claude/scripts/extract-review-findings.py`, recovers findings from
  transcripts
- `.claude/skills/review-to-tasks/`, files findings as tasks with conservative
  dependency edges, plus `references/task-tools.md` holding the verified
  mechanics
- `.claude/skills/work-task-list/`, works an inherited list to completion

The handoff between the two skills is `CLAUDE_CODE_TASK_LIST_ID=<id> claude`.
Without it the fix session mints an empty list named after itself and the
findings are orphaned on disk, since `RT()` resolves the list id as that
variable, then team name, then leader team name, then session id.

## When not to bother

`/code-review --fix` applies findings straight to the working tree. That is the
right tool for a handful of obvious fixes in one sitting. The pipeline earns its
cost only when the findings should be resumable, ordered, parallelised across
agents, or survive a restart.
