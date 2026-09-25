<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/.claude/skills/review-to-tasks/references/task-tools.md
   -
   -->

# Task tools reference

Verified against the Claude Code 2.1.278 binary at `/opt/claude-code/bin/claude`
on 2026-09-26. Minified identifiers are quoted as they appear, so they can be
re-grepped, but expect them to churn between releases. The behaviour is what
matters; the symbol names are just the evidence trail.

## Two unrelated things are called "task"

This is the single most confusing part of the feature, and the reason `/tasks`
does not do what its name suggests.

**Background process monitor.** The `/tasks` slash command, defined as
`{name:"tasks", aliases:["bashes"], description:"View and manage everything running in the background"}`.
It is `/bashes` renamed. It shows background shells (`run_in_background`, or
`Ctrl+B`, bound to `task:background`) and background subagents, and lets you
inspect their output or kill them. Its status vocabulary is
`pending, running, completed, failed, killed, paused`. It holds no work items
and cannot be used to track review findings.

**Work item list.** The `TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList` tools.
Status vocabulary `pending, in_progress, completed`, plus `deleted` on update
only. Toggled in the UI by `Ctrl+T` (`app:toggleTodos`), which sets
`expandedView: "tasks"` and mirrors into the `showExpandedTodos` local setting
so the panel survives a restart.

The two share nothing but the word. A pipeline uses both: the list carries the
findings, and `/tasks` watches the background agents that work them.

## The model gate

```js
function dS() {
  return a.CLAUDE_CODE_ENABLE_TASKS !== false;
}
function tN() {
  if (Ml() || syr()) return true;
  let e = b7e(); // current model id
  if (e === undefined || vUo(e) || EUo(e)) return true;
  return a.CLAUDE_CODE_ENABLE_TODO_TOOLS === true;
}
function P4() {
  return dS() && tN();
} // isEnabled for all four tools
```

`EUo` tests membership in a hardcoded set: `claude-3-opus`, `claude-3-sonnet`,
`claude-3-haiku`, `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-7-sonnet`,
`claude-opus-4-0` through `claude-opus-4-7`, `claude-sonnet-4-0` through
`claude-sonnet-4-6`, `claude-haiku-4-5`. `vUo` matches Bedrock inference
profiles. `Ml()` short-circuits the whole check under FleetView or a managed
cloud worker.

Neither `claude-opus-5` nor `claude-sonnet-5` is in that set. The binary's own
changelog states the intent: task tools are "offered only on Claude 3.x, Opus
4.0-4.7, Sonnet 4.0-4.6, Haiku 4.5; set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`
elsewhere". `TodoWrite` is gated by the same predicate, which is why a Claude 5
session has no todo list either.

So the tools silently vanish when you move to a Claude 5 model, and a request to
file findings on the list fails with no error. This repository sets the flag in
`.claude/settings.json`.

Observed on 2026-09-26: adding the flag to project settings made the four tools
appear in a running session, without a restart. Do not depend on that. Verify
`TaskCreate` is present rather than assuming either behaviour.

## Env vars

| Variable                          | Effect                                                            |
| --------------------------------- | ----------------------------------------------------------------- |
| `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` | Force the task and todo tools on for a model not on the allowlist |
| `CLAUDE_CODE_ENABLE_TASKS=false`  | Force them off regardless of model                                |
| `CLAUDE_CODE_TASK_LIST_ID=<id>`   | Pin which list this session reads and writes                      |
| `CLAUDE_CODE_SESSION_ID`          | Readable in Bash; the default list id                             |
| `CLAUDE_CODE_PROJECT_DIR_NAME`    | The transcript directory slug under `projects/`                   |

## List id resolution

`RT()` returns, in order: `CLAUDE_CODE_TASK_LIST_ID`, the current team name, the
leader team name, then the session id. So by default each session gets a private
list named after itself, which is why a naive handoff finds nothing: the second
session looked in its own list.

Forks inherit differently. The carry-to-fork path begins
`if (a.CLAUDE_CODE_TASK_LIST_ID || RT() !== sessionId) return;`, meaning tasks
are copied into a fork's own list only when the parent was using its default
list. Pin the id explicitly and the copy is skipped, because both sessions then
share one list directly.

## On-disk shape

One JSON file per item at `$CLAUDE_CONFIG_DIR/tasks/<listId>/<n>.json`, ids
counting from 1:

```json
{
  "id": "1",
  "subject": "Add tests/async_spec.lua for the coroutine scheduler",
  "description": "Cover lua/lazy/async.lua: sequential yield/resume, ...",
  "status": "completed",
  "blocks": [],
  "blockedBy": []
}
```

A `.lock` appears alongside them as soon as the list is touched, and a
`.highwatermark` recording the id counter shows up once the list has been
written and settled, so a freshly created list may have only the lock. The
running session also holds an in-memory store publishing to a `taskList.updated`
subscription that drives the panel. Reading these files out of band is safe and
useful. Writing them is not: the id counter and the panel will disagree with the
directory. Always go through the tools.

Confirmed by writing a real pair of tasks and reading the directory back: the
tools create `<n>.json` immediately, `metadata` round-trips intact including
nested types, and `activeForm` is persisted next to `subject`.

## Tool notes worth knowing

- `TaskCreate` takes `subject`, `description`, optional `activeForm` and
  `metadata`. One task per call; it has no array parameter and says so in its
  validation steer. Everything is created `pending` with no owner.
- `TaskUpdate` takes `taskId` plus any of `status`, `subject`, `description`,
  `activeForm`, `owner`, `metadata`, `addBlocks`, `addBlockedBy`. Metadata
  merges, and a key set to `null` is deleted. Read with `TaskGet` before
  updating, since another agent may have moved it.
- `TaskList` is read-only and returns summaries. It advises working in ascending
  id order, so create related tasks adjacently.
- A task with a non-empty `blockedBy` cannot be claimed. Spurious edges
  serialise work that could have been parallel.
- Edges are reciprocal and you only write one side. `addBlockedBy: ["1"]` on
  task 2 also writes `blocks: ["2"]` into task 1, verified on disk. Setting both
  directions yourself is redundant.
- `TaskCreated` and `TaskCompleted` are real hook events, so list transitions
  can drive external automation.

## ReportFindings, the pipeline's input

A `/code-review` reports results by calling `ReportFindings`, recorded in the
transcript as an assistant `tool_use` block. Each finding carries `file`,
`line`, `category`, `verdict` (`CONFIRMED` or `PLAUSIBLE`), `short_summary`,
`summary`, `failure_scenario`, and `outcome` only when re-reporting after fixes.

`short_summary` is capped at 60 characters, which is why it maps onto a task
subject without truncation.

Two traps, both found in real history rather than in the schema:

1. The string `ReportFindings` appears in every transcript because the schema is
   in the system prompt. Only parsed `tool_use` blocks count. Across this
   machine's history the difference was several hundred phantom hits against 55
   real payloads.
2. Rejected calls are recorded too. Overshooting the 60-character cap produces
   an `InputValidationError` and a retry, leaving the refused call and the
   accepted one side by side, seconds apart, with identical finding counts. Of
   those 55 payloads, 12 were rejected. `extract-review-findings.py` correlates
   each call with its `tool_result` by `tool_use_id` and drops the failures;
   `--keep-rejected` shows them flagged, for diagnosis.
