---
ctime: 2026-10-15
mtime: 2026-10-16
spdx: GPL-3.0-only
title: "Line Width: implementation plan"
description: >-
  Task-by-task plan for the line-width mod, which wraps the assistant's
  replies in the terminal at whitespace to 80 columns.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - plan
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/docs/plans/2026-10-15_line-width.md
   -
   -->

# Line Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Claude Code mod, `plugins/line-width`, that draws the
assistant's replies in the terminal wrapped at whitespace to 80 columns,
leaving tables, code fences and over-long words at the terminal's width.

**Architecture:** One `ui.render` hook on `AssistantMessage`. A pure
`segment()` cuts the reply's markdown into `prose` and `wide` pieces; the
hook draws each as its own `Markdown` inside a `Box` of the measure
(prose) or of no width (wide), beside a bullet of its own.

**Tech Stack:** Claude Code 2.1.300 function hooks (TSX, `claude-code`
types, `claude-code/testing`), Bun 1.4 (`bun test`), TypeScript, Biome,
mise.

**Spec:** `docs/specs/2026-10-15_line-width-design.md`. Read it first; this
plan argues from it.

## Global Constraints

- Every file that can hold comments opens with the house header (vim
  modeline, SPDX `GPL-3.0-only`, `~chewygumxx/claude-library.git`,
  `::: :/<path>`); copy it from a sibling. JSON holds none
- Prose is British English; em dashes are prohibited, in code and comments
  too
- JSON is indented with 4 spaces and formatted by Biome
- Commits: `type(scope): Sentence-case subject`, header at most 50
  characters, body lines at most 72; scope `line-width` for the plugin,
  none for changes beyond it; commit after each task at the least
- `bun run check` runs every check CI runs; tools come from `mise.toml`
  and `package.json`
- The measure: `columns`, a `userConfig` number, default 80, min 40, max
  200; prose boxes are `columns` wide, the 2-column bullet gutter drawn
  beside them, and the hook passes through in a viewport of at most
  `columns + 2`
- The hook acts on the `terminal` surface only, never changes stored
  messages, and passes through whenever it is unsure
- The engine's API is in
  `/tmp/claude-1000/bundled-skills/2.1.300/dcd649d235baed17461358b4e60043be/plugin-authoring/types/claude-code.d.ts`
  until the plugin is first loaded, then in
  `plugins/line-width/.claude-plugin/types/`; grep it, do not guess

## Review Focus

1. A reply still streaming: its text grows while drawn, so a fence is
   unclosed and a table has its header but no delimiter row yet; each
   redraw must segment without throwing (pinned in Task 3)
2. Windows line endings in a reply: a CRLF table is still a table, and no
   `\r` leaks into a piece (pinned in Task 3)
3. An empty or whitespace-only block: no pieces, and the hook passes it
   through (pinned in Tasks 3 and 6)
4. A reply that is nothing but one long URL: one `wide` piece, passed
   through untouched rather than boxed (pinned in Tasks 4 and 6)
5. An unclosed backtick before a long path: read as a literal character,
   never thrown on (pinned in Task 4)

---

## File Structure

| Path                                        | Responsibility                                     |
| ------------------------------------------- | -------------------------------------------------- |
| `plugins/line-width/.claude-plugin/plugin.json` | Manifest and the `columns` option              |
| `plugins/line-width/hooks/hooks.json`       | Names the hooks module                             |
| `plugins/line-width/hooks/segment.ts`       | Pure: markdown to pieces                           |
| `plugins/line-width/hooks/register.tsx`     | The `ui.render` hook: pieces to a tree             |
| `plugins/line-width/hooks/register.test.ts` | The hook's cases under `claude plugin test`        |
| `plugins/line-width/tsconfig.json`          | Extends the engine-written types for `tsc -p`      |
| `plugins/line-width/README.md`              | What it does, when it does nothing, the option     |
| `test/line-width.test.mts`                  | `segment` cases under `bun test`                   |
| `mise.toml`, `package.json`                 | `test:plugins` and `typecheck:plugins` in `check`  |

Also touched by the scaffolder: `.claude-plugin/marketplace.json`,
`.claude/settings.json`, `.commitlintrc.mts`.

---

### Task 1: Settle the engine's behaviour with a live probe

The spec's five open questions decide whether the design stands. Nothing
here is kept.

**Files:**

- Create (throwaway): `/tmp/line-width-probe/.claude-plugin/plugin.json`,
  `/tmp/line-width-probe/hooks/hooks.json`,
  `/tmp/line-width-probe/hooks/register.tsx`,
  `/tmp/line-width-probe/prompt.md`, `/tmp/line-width-probe/run.sh`
- Modify: `docs/specs/2026-10-15_line-width-design.md` (findings)

**Interfaces:** none; consumes nothing, produces findings only.

- [ ] **Step 1: Write the probe mod**

`/tmp/line-width-probe/.claude-plugin/plugin.json`:

```json
{
    "name": "line-width-probe",
    "version": "0.0.1",
    "description": "Throwaway probe of the engine's drawing for line-width."
}
```

`/tmp/line-width-probe/hooks/hooks.json`:

```json
{ "modules": ["./register.tsx"] }
```

`/tmp/line-width-probe/hooks/register.tsx`: draws each blank-line-separated
paragraph through its own `next` call in an 82-column `Box`, so one reply
answers every question:

```tsx
import type { Register, RenderElement } from "claude-code";

export const register: Register = (on) => {
    on("ui.render", { component: "AssistantMessage" }, async ($, e, next) => {
        if (e.surface !== "terminal") {
            return next(e);
        }
        const { Box } = $.ui.resolve(e);
        const drawn: RenderElement[] = [];
        for (const [i, text] of e.props.text.split(/\n{2,}/).entries()) {
            const isFirstOfReply = i === 0 && e.props.isFirstOfReply;
            const tree = await next({
                ...e,
                props: { ...e.props, text, isFirstOfReply },
            });
            drawn.push(
                <Box width={82} marginTop={i === 0 ? 0 : 1}>
                    {tree}
                </Box>,
            );
        }
        return <Box flexDirection="column">{drawn}</Box>;
    });
};
```

- [ ] **Step 2: Validate it**

Run: `claude plugin validate /tmp/line-width-probe`
Expected: no errors. Fix and rerun on any.

- [ ] **Step 3: Write the prompt and the launcher**

`/tmp/line-width-probe/prompt.md`:

```markdown
Reply with exactly the markdown between the two lines of equals signs,
verbatim, with nothing before or after it and without the equals signs.

==========
This first paragraph is long enough to need wrapping several times over at eighty columns, so the probe can see where each of its lines breaks, whether every break falls at a space between two words, and how many columns the bullet and the gutter take before the first word on each of its lines.

This second paragraph is drawn by a second call to next, so whether it appears at all, whether it lines up with the first, and how many blank rows sit between the two of them are all answered here at once.

1. one
2. two

3. three
4. four
==========
```

`/tmp/line-width-probe/run.sh`:

```sh
#!/bin/sh
# $1: the plugin folder; $2: the prompt file.
exec claude --plugin-dir "$1" --model haiku "$(cat "$2")"
```

- [ ] **Step 4: Run it in a 160-column terminal and capture the screen**

```sh
cd /home/chewygumxx/.herdr/worktrees/claude-library/feat-mod-line-width
tmux new-session -d -s line-width-probe -x 160 -y 80 \
    sh /tmp/line-width-probe/run.sh /tmp/line-width-probe /tmp/line-width-probe/prompt.md
sleep 60
tmux capture-pane -p -t line-width-probe -S -300 > /tmp/line-width-probe/screen.txt
tmux kill-session -t line-width-probe
cat /tmp/line-width-probe/screen.txt
```

If the capture shows a folder-trust or other dialog instead of the reply,
start again, `tmux send-keys -t line-width-probe Enter` once the dialog
shows, and capture after the reply. If the reply is not verbatim, rerun.

- [ ] **Step 5: Read the answers off the capture**

Measure the paragraph lines: `awk '{ print length ": " $0 }'
/tmp/line-width-probe/screen.txt`. Record, for each question:

1. Several `next` calls: both paragraphs and the list pieces drawn?
2. Width: paragraph lines at most 82 columns, gutter included, every break
   at a space, none inside a word?
3. Gutter: the second paragraph's first word in the same column as the
   first's?
4. Blank rows: exactly one between the paragraphs (the `marginTop`), or
   two (the engine adds its own), or none?
5. Numbering: the third piece reads `3.` and `4.`, or restarts at `1.`?

- [ ] **Step 6: Decide**

- All as hoped (1 to 3 yes, 4 exactly one row, 5 reads 3): continue
- 4 shows two rows: the engine keeps its own paragraph spacing; Task 6
  draws `marginTop` 0 always and the `gapBefore` field stays for tests.
  Note it in the spec
- 4 shows none and 5 restarts, or 1, 2 or 3 fails: STOP. Report the
  capture to the person; the spec's fallbacks change the design, so the
  plan is revised before going on

- [ ] **Step 7: Record the findings in the spec and commit**

Append to the spec's "Risks, settled first" section a `### Findings`
subsection: one line per question with the answer and the date. Then:

```sh
rm -rf /tmp/line-width-probe
bunx remark --frail --quiet --no-stdout docs/specs/2026-10-15_line-width-design.md
git add docs/specs/2026-10-15_line-width-design.md
git commit -m "docs: Record the line-width probe's findings"
```

---

### Task 2: Scaffold the plugin with a pass-through module

**Files:**

- Create (by script): `plugins/line-width/` with `.claude-plugin/plugin.json`,
  `hooks/hooks.json`, `hooks/line-width.sh`, `README.md`
- Delete: `plugins/line-width/hooks/line-width.sh`
- Modify: `plugins/line-width/.claude-plugin/plugin.json`,
  `plugins/line-width/hooks/hooks.json`
- Create: `plugins/line-width/hooks/register.tsx`,
  `plugins/line-width/tsconfig.json`
- Modified by script: `.claude-plugin/marketplace.json`,
  `.claude/settings.json`, `.commitlintrc.mts`

**Interfaces:**

- Produces: plugin name `line-width`; `register: Register` exported from
  `hooks/register.tsx`; `options.columns` (number, default 80)

- [ ] **Step 1: Run the scaffolder**

```sh
bun .claude/skills/new-plugin/scripts/new-plugin.mts \
    --name line-width \
    --description "Wraps Claude's replies in the terminal at whitespace to 80 columns, leaving tables, code blocks and long paths and URLs at full width." \
    --scope "Plugin: ui.render hook wrapping replies to 80 columns" \
    --event SessionStart \
    --keyword ui --keyword markdown
```

Expected: `plugins/line-width/` created; marketplace, settings and
commitlint scopes updated.

- [ ] **Step 2: Swap the shell hook for a module**

```sh
rm plugins/line-width/hooks/line-width.sh
```

`plugins/line-width/hooks/hooks.json`, replacing the generated content:

```json
{
    "modules": ["./register.tsx"]
}
```

In `plugins/line-width/.claude-plugin/plugin.json`, keep every generated
key and add `userConfig`:

```json
"userConfig": {
    "columns": {
        "type": "number",
        "title": "Columns",
        "description": "Columns of reply text, after the bullet gutter.",
        "default": 80,
        "min": 40,
        "max": 200
    }
}
```

`plugins/line-width/hooks/register.tsx`, a pass-through for now:

```tsx
// vim:set expandtab shiftwidth=4 filetype=typescriptreact:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/plugins/line-width/hooks/register.tsx
//
//

// Wraps the assistant's replies in the terminal at whitespace to the
// measure, leaving tables, code fences and words too long for it at the
// terminal's width.

import type { Register } from "claude-code";

export const register: Register = (on) => {
    on("ui.render", { component: "AssistantMessage" }, ($, e, next) =>
        next(e),
    );
};
```

`plugins/line-width/tsconfig.json`:

```json
{
    "extends": "./.claude-plugin/types/tsconfig.json",
    "compilerOptions": {
        "allowImportingTsExtensions": true
    },
    "include": [".claude-plugin/types", "hooks"]
}
```

- [ ] **Step 3: Validate**

Run: `claude plugin validate --strict plugins/line-width`
Expected: passes, reporting one `ui.render` hook. A refusal names the key;
fix it and rerun.

- [ ] **Step 4: Have the engine lay the types**

Run: `claude -p --plugin-dir "$PWD/plugins/line-width" --model haiku "Say ok"`
Then: `ls plugins/line-width/.claude-plugin/types/`
Expected: `claude-code/`, `claude-code-tools/`, `tsconfig.json` and a
`.gitignore`. If absent, load it interactively once instead, as Task 1
Step 4 does with this folder, and look again.

- [ ] **Step 5: Type-check and confirm git ignores the types**

Run: `bunx tsc -p plugins/line-width`
Expected: no errors.
Run: `git status --short plugins/line-width`
Expected: no path under `.claude-plugin/types/`.

- [ ] **Step 6: Format and commit**

```sh
bunx biome check --write plugins/line-width .claude-plugin .claude/settings.json
git add -A plugins/line-width .claude-plugin/marketplace.json .claude/settings.json .commitlintrc.mts
git commit -m "feat(line-width): Scaffold the line-width plugin"
```

---

### Task 3: Segment blocks: fences, tables, prose and gaps

**Files:**

- Create: `plugins/line-width/hooks/segment.ts`
- Test: `test/line-width.test.mts`

**Interfaces:**

- Produces: `export type Piece = { kind: "prose" | "wide"; text: string;
  indent: number; gapBefore: boolean }` and `export function
  segment(text: string, columns: number): Piece[]`, both from
  `plugins/line-width/hooks/segment.ts`

- [ ] **Step 1: Write the failing tests**

`test/line-width.test.mts`:

```ts
// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/line-width.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { segment } from "../plugins/line-width/hooks/segment.ts";

// A narrow measure keeps the cases short.
const COLUMNS = 20;

const prose = (text: string, indent = 0, gapBefore = false) => ({
    kind: "prose",
    text,
    indent,
    gapBefore,
});
const wide = (text: string, indent = 0, gapBefore = false) => ({
    kind: "wide",
    text,
    indent,
    gapBefore,
});

describe("line-width segment: blocks", () => {
    test("an empty or blank block has no pieces", () => {
        expect(segment("", COLUMNS)).toEqual([]);
        expect(segment("  \n\n", COLUMNS)).toEqual([]);
    });

    test("paragraphs are one prose piece, blank line kept", () => {
        expect(segment("One two.\n\nThree four.", COLUMNS)).toEqual([
            prose("One two.\n\nThree four."),
        ]);
    });

    test("a closed fence is wide, gaps marked either side", () => {
        expect(segment("Before\n\n```sh\nls\n```\n\nAfter", COLUMNS)).toEqual([
            prose("Before"),
            wide("```sh\nls\n```", 0, true),
            prose("After", 0, true),
        ]);
    });

    test("an unclosed fence runs to the end", () => {
        expect(segment("Text\n```\nopen", COLUMNS)).toEqual([
            prose("Text"),
            wide("```\nopen"),
        ]);
    });

    test("a fence in a numbered step keeps its indent", () => {
        expect(
            segment("1. Run it:\n\n   ```sh\n   ls\n   ```", COLUMNS),
        ).toEqual([prose("1. Run it:"), wide("```sh\nls\n```", 3, true)]);
    });

    test("a table is wide", () => {
        const table = "| a | b |\n| --- | :-: |\n| 1 | 2 |";
        expect(segment(`Intro\n\n${table}`, COLUMNS)).toEqual([
            prose("Intro"),
            wide(table, 0, true),
        ]);
    });

    test("a table after a line break has no gap", () => {
        expect(segment("Line one\n| a |\n| - |", COLUMNS)).toEqual([
            prose("Line one"),
            wide("| a |\n| - |"),
        ]);
    });

    test("pipe lines without a delimiter row are prose", () => {
        expect(segment("| not a table |", COLUMNS)).toEqual([
            prose("| not a table |"),
        ]);
        expect(segment("Text\n\n| a | b |", COLUMNS)).toEqual([
            prose("Text\n\n| a | b |"),
        ]);
    });

    test("a CRLF table is a table, no carriage return kept", () => {
        expect(segment("| a |\r\n| - |", COLUMNS)).toEqual([
            wide("| a |\n| - |"),
        ]);
    });

    test("two wide pieces are never merged", () => {
        expect(segment("```\na\n```\n```\nb\n```", COLUMNS)).toEqual([
            wide("```\na\n```"),
            wide("```\nb\n```"),
        ]);
    });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test ./test/line-width.test.mts`
Expected: FAIL, cannot resolve `../plugins/line-width/hooks/segment.ts`.

- [ ] **Step 3: Write the block segmenter**

`plugins/line-width/hooks/segment.ts`:

```ts
// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/plugins/line-width/hooks/segment.ts
//
//

// Cuts a reply's markdown into the pieces the line-width hook draws: prose,
// wrapped to the measure, and wide pieces (tables, code fences and words
// too long for the measure) left to the terminal's width. Pure, so the
// repository's own tests reach it without the engine.

export type Piece = {
    kind: "prose" | "wide";
    text: string;
    indent: number;
    gapBefore: boolean;
};

type Unit = Omit<Piece, "gapBefore">;

const FENCE = /^[ \t]*(`{3,}|~{3,})/;
const FENCE_CLOSE = /^[ \t]*(`{3,}|~{3,})[ \t]*$/;
const DELIMITER_ROW = /^\|?(?:\s*:?-+:?\s*\|)*\s*:?-+:?\s*\|?$/;
const LIST_ITEM = /^[ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+/;

export function segment(text: string, columns: number): Piece[] {
    const lines = text.split(/\r?\n/);
    const pieces: Piece[] = [];
    let gap = false;
    let inList = false;

    const add = (unit: Unit) => {
        const last = pieces.at(-1);
        if (
            last?.kind === "prose" &&
            unit.kind === "prose" &&
            last.indent === unit.indent
        ) {
            last.text += `${gap ? "\n\n" : "\n"}${unit.text}`;
        } else {
            pieces.push({ ...unit, gapBefore: gap && pieces.length > 0 });
        }
        gap = false;
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i] ?? "";
        if (line.trim() === "") {
            gap = true;
            i += 1;
            continue;
        }
        const fence = FENCE.exec(line);
        if (fence && (leading(line) <= 3 || inList)) {
            const end = fenceEnd(lines, i, fence[1] ?? "```");
            add(block(lines.slice(i, end), "wide"));
            i = end;
            continue;
        }
        const table = tableEnd(lines, i);
        if (table > i) {
            add(block(lines.slice(i, table), "wide"));
            i = table;
            continue;
        }
        if (LIST_ITEM.test(line)) {
            inList = true;
        } else if (leading(line) === 0) {
            inList = false;
        }
        add({ kind: "prose", text: line, indent: 0 });
        i += 1;
    }
    return pieces;
}

// The line after the fence opened at `start` closes, or the block's end.
function fenceEnd(lines: string[], start: number, open: string): number {
    for (let i = start + 1; i < lines.length; i += 1) {
        const close = FENCE_CLOSE.exec(lines[i] ?? "")?.[1] ?? "";
        if (close[0] === open[0] && close.length >= open.length) {
            return i + 1;
        }
    }
    return lines.length;
}

// The line after a table opening at `start`, or `start` when none does: a
// run of lines opening with a pipe that holds a delimiter row.
function tableEnd(lines: string[], start: number): number {
    let end = start;
    while ((lines[end] ?? "").trimStart().startsWith("|")) {
        end += 1;
    }
    const run = lines.slice(start, end);
    return run.some((row) => DELIMITER_ROW.test(row.trim())) ? end : start;
}

// Lines drawn whole, their common indentation taken as padding.
function block(lines: string[], kind: Piece["kind"]): Unit {
    const indent = Math.min(
        ...lines.filter((line) => line.trim() !== "").map(leading),
    );
    const text = lines
        .map((line) => line.slice(Math.min(indent, leading(line))))
        .join("\n");
    return { kind, text, indent };
}

function leading(line: string): number {
    return line.length - line.trimStart().length;
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `bun test ./test/line-width.test.mts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Type-check, lint and commit**

```sh
bun run typecheck && bunx biome check --write plugins/line-width test/line-width.test.mts
git add plugins/line-width/hooks/segment.ts test/line-width.test.mts
git commit -m "feat(line-width): Segment fences, tables and prose"
```

---

### Task 4: Segment long tokens out of prose lines

**Files:**

- Modify: `plugins/line-width/hooks/segment.ts`
- Test: `test/line-width.test.mts`

**Interfaces:**

- Consumes: `segment`, `Piece`, `Unit`, `leading` from Task 3
- Produces: internal `lineUnits(line: string, columns: number, inList:
  boolean): Unit[]`, which Task 5 replaces whole

- [ ] **Step 1: Write the failing tests**

Append to `test/line-width.test.mts`:

```ts
// 25 cells, over the measure of 20.
const LONG = "/home/user/a/long/path.ts";
// 31 cells.
const URL = "https://example.com/a/long/path";

describe("line-width segment: long tokens", () => {
    test("a long URL mid-sentence takes a line of its own", () => {
        expect(segment(`See ${URL} for more.`, COLUMNS)).toEqual([
            prose("See"),
            wide(URL),
            prose("for more."),
        ]);
    });

    test("a reply of one long URL is one wide piece", () => {
        expect(segment(URL, COLUMNS)).toEqual([wide(URL)]);
    });

    test("an autolink is cut whole", () => {
        expect(segment(`See <${URL}> now`, COLUMNS)).toEqual([
            prose("See"),
            wide(`<${URL}>`),
            prose("now"),
        ]);
    });

    test("a link is measured by its label, never its target", () => {
        const line = `See [the docs](${URL}) now`;
        expect(segment(line, COLUMNS)).toEqual([prose(line)]);
    });

    test("a code span holding spaces is cut whole", () => {
        expect(segment(`Run \`cat ${LONG}\` first`, COLUMNS)).toEqual([
            prose("Run"),
            wide(`\`cat ${LONG}\``),
            prose("first"),
        ]);
    });

    test("an unclosed backtick is a literal character", () => {
        expect(segment(`Run \`${LONG} now`, COLUMNS)).toEqual([
            prose("Run"),
            wide(`\`${LONG}`),
            prose("now"),
        ]);
    });

    test("a long word inside open emphasis is not cut", () => {
        const line = `**Note ${LONG} here**`;
        expect(segment(line, COLUMNS)).toEqual([prose(line)]);
    });

    test("a rest that would open a list is escaped", () => {
        expect(segment(`${LONG} - then`, COLUMNS)).toEqual([
            wide(LONG),
            prose("\\- then"),
        ]);
        expect(segment(`${LONG} 1. then`, COLUMNS)).toEqual([
            wide(LONG),
            prose("1\\. then"),
        ]);
    });

    test("a rest of emphasis is not escaped", () => {
        expect(segment(`${LONG} **bold** end`, COLUMNS)).toEqual([
            wide(LONG),
            prose("**bold** end"),
        ]);
    });

    test("a word exactly the measure stays in its prose", () => {
        const line = "See abcdefghijabcdefghij now";
        expect(segment(line, COLUMNS)).toEqual([prose(line)]);
    });

    test("CJK text is never cut", () => {
        const line = "これは長い日本語の文章でスペースがありません";
        expect(segment(line, COLUMNS)).toEqual([prose(line)]);
    });

    test("an indented code line outside a list is left whole", () => {
        const line = `    ${LONG}`;
        expect(segment(line, COLUMNS)).toEqual([prose(line)]);
    });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test ./test/line-width.test.mts`
Expected: the 10 block tests PASS. Of the long-token tests, those that
expect a cut FAIL, each long token still inside one prose piece; those
that expect the line whole (the link, emphasis, the exact measure, CJK,
indented code) already pass.

- [ ] **Step 3: Add the tokeniser, the cut and the escape**

In `segment.ts`, add after `const LIST_ITEM`:

```ts
const LINK = /^!?\[([^\]\n]*)\]\([^()\s]*\)/;
const AUTOLINK = /^<([a-z][a-z0-9+.-]*:[^<>\s]*)>/i;
// East Asian Wide and Fullwidth ranges, and emoji: two cells each.
const WIDE_CHARACTER =
    /[\u{1100}-\u{115f}\u{2e80}-\u{a4cf}\u{ac00}-\u{d7a3}\u{f900}-\u{faff}\u{fe30}-\u{fe4f}\u{ff00}-\u{ff60}\u{ffe0}-\u{ffe6}\u{1f300}-\u{1faff}\u{20000}-\u{3fffd}]/u;

type Part = { kind: Piece["kind"]; text: string };
type Token = { start: number; end: number; drawn: string };
```

In `segment`, replace the line
`add({ kind: "prose", text: line, indent: 0 });` with:

```ts
        for (const unit of lineUnits(line, columns, inList)) {
            add(unit);
        }
```

Append to `segment.ts`:

```ts
// A prose line as units: itself, or the parts a long token cuts it into.
function lineUnits(line: string, columns: number, inList: boolean): Unit[] {
    if (!inList && leading(line) >= 4) {
        return [{ kind: "prose", text: line, indent: 0 }];
    }
    const parts = cut(line, columns);
    if (parts.length === 1 && parts[0]?.kind === "prose") {
        return [{ kind: "prose", text: line, indent: 0 }];
    }
    return parts.map((part, index) => ({
        kind: part.kind,
        text: index === 0 ? part.text : escapeLead(part.text),
        indent: 0,
    }));
}

// Cuts content around its first long token outside emphasis, then the rest
// likewise; `room` is the cells its line has.
function cut(content: string, room: number): Part[] {
    let depth = 0;
    for (const token of tokens(content)) {
        const raw = content.slice(token.start, token.end);
        const before = depth;
        const opens = /^[*_~]/.test(raw) ? 1 : 0;
        const closes = /[*_~][.,;:!?)]*$/.test(raw) ? 1 : 0;
        depth = Math.max(0, depth + opens - closes);
        if (before === 0 && depth === 0 && isLong(token.drawn, room)) {
            const head = content.slice(0, token.start).trimEnd();
            const tail = content.slice(token.end).trimStart();
            return [
                ...(head === "" ? [] : [{ kind: "prose" as const, text: head }]),
                { kind: "wide", text: raw },
                ...(tail === "" ? [] : cut(tail, room)),
            ];
        }
    }
    return [{ kind: "prose", text: content }];
}

// The line's whitespace-separated tokens, each with the text it draws; a
// code span, link or autolink is read whole, spaces and all.
function tokens(line: string): Token[] {
    const found: Token[] = [];
    let i = 0;
    while (i < line.length) {
        if (/\s/.test(line[i] ?? "")) {
            i += 1;
            continue;
        }
        const start = i;
        let drawn = "";
        while (i < line.length && !/\s/.test(line[i] ?? "")) {
            const char = line[i] ?? "";
            const span = char === "`" ? codeSpan(line.slice(i)) : undefined;
            const link =
                char === "[" || char === "!" ? LINK.exec(line.slice(i)) : null;
            const autolink = char === "<" ? AUTOLINK.exec(line.slice(i)) : null;
            if (span) {
                drawn += span.drawn;
                i += span.length;
            } else if (link) {
                drawn += link[1] ?? "";
                i += link[0].length;
            } else if (autolink) {
                drawn += autolink[1] ?? "";
                i += autolink[0].length;
            } else {
                drawn += char;
                i += 1;
            }
        }
        drawn = drawn.replace(/^[*_~(]+/, "").replace(/[*_~.,;:!?)]+$/, "");
        found.push({ start, end: i, drawn });
    }
    return found;
}

// A code span opening `rest`: its length and the text it draws, or
// undefined when no run of backticks as long closes it.
function codeSpan(rest: string): { length: number; drawn: string } | undefined {
    const open = /^`+/.exec(rest)?.[0] ?? "`";
    let from = open.length;
    for (;;) {
        const close = rest.indexOf(open, from);
        if (close === -1) {
            return undefined;
        }
        const isExact =
            rest[close - 1] !== "`" && rest[close + open.length] !== "`";
        if (isExact) {
            return {
                length: close + open.length,
                drawn: rest.slice(open.length, close).trim(),
            };
        }
        from = close + 1;
    }
}

// Whether a token's drawn text holds a run too wide for the room; one with
// a wide character is never long, its script wrapping without spaces.
function isLong(drawn: string, room: number): boolean {
    return (
        !WIDE_CHARACTER.test(drawn) &&
        drawn.split(/\s+/).some((run) => [...run].length > room)
    );
}

// Keeps a part after a cut from opening a list, heading or quote.
function escapeLead(text: string): string {
    const ordered = /^\d{1,9}(?=[.)](?:\s|$))/.exec(text)?.[0];
    if (ordered !== undefined) {
        return `${ordered}\\${text.slice(ordered.length)}`;
    }
    return /^(?:[-+*](?:\s|$)|#{1,6}(?:\s|$)|>)/.test(text)
        ? `\\${text}`
        : text;
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `bun test ./test/line-width.test.mts`
Expected: PASS, 22 tests.

- [ ] **Step 5: Type-check, lint and commit**

```sh
bun run typecheck && bunx tsc -p plugins/line-width && bunx biome check --write plugins/line-width test/line-width.test.mts
git add plugins/line-width/hooks/segment.ts test/line-width.test.mts
git commit -m "feat(line-width): Cut long words out of prose"
```

---

### Task 5: Carry a line's context across a cut

**Files:**

- Modify: `plugins/line-width/hooks/segment.ts` (`lineUnits`, new
  `QUOTE`)
- Test: `test/line-width.test.mts`

**Interfaces:**

- Consumes: `cut`, `escapeLead`, `leading`, `LIST_ITEM`, `Unit` from Tasks 3
  and 4
- Produces: `lineUnits` with the same signature, now context-aware

- [ ] **Step 1: Write the failing tests**

Append to `test/line-width.test.mts`:

```ts
describe("line-width segment: context across a cut", () => {
    test("a list item keeps its marker; later parts sit under it", () => {
        expect(segment(`- See ${LONG} now`, COLUMNS)).toEqual([
            prose("- See"),
            wide(LONG, 2),
            prose("now", 2),
        ]);
    });

    test("a continuation line's indent becomes padding", () => {
        expect(segment(`- Item\n  more ${LONG} end`, COLUMNS)).toEqual([
            prose("- Item"),
            prose("more", 2),
            wide(LONG, 2),
            prose("end", 2),
        ]);
    });

    test("a nested item stays in its list", () => {
        expect(segment(`- Top\n  - See ${LONG}`, COLUMNS)).toEqual([
            prose("- Top\n  - See"),
            wide(LONG, 4),
        ]);
    });

    test("a blockquote's parts each keep the bar", () => {
        expect(segment(`> See ${LONG} now`, COLUMNS)).toEqual([
            prose("> See"),
            wide(`> ${LONG}`),
            prose("> now"),
        ]);
    });

    test("a nested quote keeps its depth", () => {
        expect(segment(`> > See ${LONG}`, COLUMNS)).toEqual([
            prose("> > See"),
            wide(`> > ${LONG}`),
        ]);
    });

    test("an item's room is the measure less its marker", () => {
        // 19 cells: within 20, over the 18 a "- " item leaves.
        const word = "abcdefghijabcdefghi";
        expect(segment(`- ${word}`, COLUMNS)).toEqual([wide(`- ${word}`)]);
    });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test ./test/line-width.test.mts`
Expected: the earlier 22 PASS; the six context tests FAIL.

- [ ] **Step 3: Make `lineUnits` carry the context**

In `segment.ts`, add after `const LIST_ITEM`:

```ts
const QUOTE = /^[ \t]*(?:>[ \t]?)+/;
```

Replace the whole `lineUnits` function with:

```ts
// A prose line as units: itself, or the parts a long token cuts it into,
// each carrying the line's context: a list item's marker stays with the
// first part and later parts sit under its text, a continuation line's
// indent becomes padding, and every part of a quote keeps the bar.
function lineUnits(line: string, columns: number, inList: boolean): Unit[] {
    const quote = QUOTE.exec(line)?.[0];
    const item = quote === undefined ? LIST_ITEM.exec(line)?.[0] : undefined;
    const lead = leading(line);
    const isPlain = quote === undefined && item === undefined;
    if (isPlain && !inList && lead >= 4) {
        return [{ kind: "prose", text: line, indent: 0 }];
    }
    const isContinuation = isPlain && inList && lead > 0;
    const marker = quote ?? item ?? (isContinuation ? line.slice(0, lead) : "");
    const parts = cut(line.slice(marker.length), columns - marker.length);
    if (parts.length === 1 && parts[0]?.kind === "prose") {
        return [{ kind: "prose", text: line, indent: 0 }];
    }
    const bar = quote === undefined ? "" : "> ".repeat(quote.split(">").length - 1);
    return parts.map((part, index) => {
        const text = index === 0 ? part.text : escapeLead(part.text);
        if (quote !== undefined) {
            return { kind: part.kind, text: `${bar}${text}`, indent: 0 };
        }
        if (item !== undefined) {
            return index === 0
                ? { kind: part.kind, text: `${item}${text}`, indent: 0 }
                : { kind: part.kind, text, indent: item.length };
        }
        return { kind: part.kind, text, indent: isContinuation ? lead : 0 };
    });
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `bun test ./test/line-width.test.mts`
Expected: PASS, 28 tests.

- [ ] **Step 5: Type-check, lint and commit**

```sh
bun run typecheck && bunx tsc -p plugins/line-width && bunx biome check --write plugins/line-width test/line-width.test.mts
git add plugins/line-width/hooks/segment.ts test/line-width.test.mts
git commit -m "feat(line-width): Keep list and quote context in cuts"
```

---

### Task 6: Draw the pieces in the hook

Revised after Task 1's probe: the engine refuses its own drawing under a
`Box` with a width, so each piece is the mod's own `Markdown` and the
hook draws the bullet itself.

**Files:**

- Modify: `plugins/line-width/hooks/register.tsx`
- Create: `plugins/line-width/hooks/register.test.ts`

**Interfaces:**

- Consumes: `segment(text, columns): Piece[]` from
  `./segment.ts`; `options.columns` from Task 2
- Produces: the finished hook

- [ ] **Step 1: Write the failing tests**

`plugins/line-width/hooks/register.test.ts`:

```ts
// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/plugins/line-width/hooks/register.test.ts
//
//

import type {
    On,
    RenderPropsOf,
    RenderSurface,
    RenderViewport,
} from "claude-code";
import type { TestBody } from "claude-code/testing";
import { describe, expect, test } from "claude-code/testing";

type Engine = Parameters<TestBody>[0];
type Props = RenderPropsOf["AssistantMessage"];

const WIDE: RenderViewport = { columns: 200, rows: 50 };
const TABLE = "| a | b |\n| --- | --- |\n| 1 | 2 |";
const BULLET = {
    type: "Box",
    props: { width: 2 },
    children: [{ type: "Text", props: { color: "text" } }],
};

// Stands beneath the plugin for the engine: records the props of each
// drawing asked of it and answers a marker.
function engine(on: On): Props[] {
    const calls: Props[] = [];
    on("ui.render", { component: "AssistantMessage" }, ($, e) => {
        calls.push(e.props);
        const { Text } = $.ui.resolve(e);
        return Text({ children: "engine" });
    });
    return calls;
}

// Mounts a reply block through the plugin and reads the tree it drew;
// a `viewport` of null leaves the surface unmeasured.
async function draw(
    $: Engine,
    text: string,
    {
        surface = "terminal",
        viewport = WIDE,
        props = {},
    }: {
        surface?: RenderSurface;
        viewport?: RenderViewport | null;
        props?: Partial<Props>;
    } = {},
) {
    const ui = await $.ui.mount({
        plugin: "line-width",
        surface,
        component: "AssistantMessage",
        props: { text, isFirstOfReply: true, ...props },
        ...(viewport === null ? {} : { viewport }),
    });
    return ui.drawn();
}

// A piece as drawn: its Box and the one Markdown in it.
function piece(text: string, props: Record<string, unknown>) {
    return {
        type: "Box",
        props,
        children: [{ type: "Markdown", props: { text } }],
    };
}

describe("line-width hook", () => {
    test("leaves another surface to the engine", async ($, on) => {
        const calls = engine(on);
        expect(await draw($, `Text\n\n${TABLE}`, { surface: "desktop" }))
            .toMatchObject({ type: "Text" });
        expect(calls.length).toBe(1);
    });

    test("leaves a summary to the engine", async ($, on) => {
        const calls = engine(on);
        const tree = await draw($, "Plain.", { props: { isSummary: true } });
        expect(tree).toMatchObject({ type: "Text" });
        expect(calls.length).toBe(1);
    });

    test("leaves a terminal no wider than the measure", async ($, on) => {
        engine(on);
        const viewport = { columns: 82, rows: 24 };
        expect(await draw($, "Plain.", { viewport })).toMatchObject({
            type: "Text",
        });
    });

    test("leaves an unmeasured terminal to the engine", async ($, on) => {
        engine(on);
        expect(await draw($, "Plain.", { viewport: null })).toMatchObject({
            type: "Text",
        });
    });

    test("leaves an empty block to the engine", async ($, on) => {
        engine(on);
        expect(await draw($, "")).toMatchObject({ type: "Text" });
    });

    test("leaves a block of one table or one URL", async ($, on) => {
        const calls = engine(on);
        expect(await draw($, TABLE)).toMatchObject({ type: "Text" });
        const url = `https://example.com/${"a".repeat(100)}`;
        expect(await draw($, url)).toMatchObject({ type: "Text" });
        expect(calls.map((call) => call.text)).toEqual([TABLE, url]);
    });

    test("draws plain prose at the measure beside the bullet", async ($, on) => {
        const calls = engine(on);
        expect(await draw($, "Plain prose.")).toMatchObject({
            type: "Box",
            props: { flexDirection: "row", marginTop: 1 },
            children: [
                BULLET,
                {
                    type: "Box",
                    props: { flexDirection: "column" },
                    children: [piece("Plain prose.", { width: 80 })],
                },
            ],
        });
        expect(calls.length).toBe(0);
    });

    test("draws each piece in order", async ($, on) => {
        engine(on);
        const tree = await draw($, `Before\n\n${TABLE}\n\nAfter`);
        expect(tree).toMatchObject({
            children: [
                BULLET,
                {
                    children: [
                        piece("Before", { width: 80, marginTop: 0 }),
                        piece(TABLE, { marginTop: 1 }),
                        piece("After", { width: 80, marginTop: 1 }),
                    ],
                },
            ],
        });
        const [, column] = (tree as { children: { children: unknown[] }[] })
            .children;
        const [, table] = column?.children as { props: { width?: number } }[];
        expect(table?.props.width).toBe(undefined);
    });

    test("pads a piece by its indent", async ($, on) => {
        engine(on);
        const path = "/a".repeat(50);
        const tree = await draw($, `- See ${path} now`);
        expect(tree).toMatchObject({
            children: [
                BULLET,
                {
                    children: [
                        piece("- See", { paddingLeft: 0 }),
                        piece(path, { paddingLeft: 2 }),
                        piece("now", { paddingLeft: 2, width: 80 }),
                    ],
                },
            ],
        });
    });

    test("leaves the bullet off a later block of a reply", async ($, on) => {
        engine(on);
        const tree = await draw($, "Plain prose.", {
            props: { isFirstOfReply: false },
        });
        expect(tree).toMatchObject({
            type: "Box",
            children: [{ props: { flexDirection: "column" } }],
        });
    });

    test(
        "honours the columns option",
        { options: { columns: 60 } },
        async ($, on) => {
            engine(on);
            expect(await draw($, "Plain prose.")).toMatchObject({
                children: [
                    BULLET,
                    { children: [piece("Plain prose.", { width: 60 })] },
                ],
            });
        },
    );
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `claude plugin test plugins/line-width`
Expected: the six pass-through cases PASS; "draws plain prose", "draws
each piece", "pads a piece", "leaves the bullet off" and "honours the
columns option" FAIL, the tree being the engine's `Text`.

- [ ] **Step 3: Write the hook**

Replace the body of `plugins/line-width/hooks/register.tsx` below its
header with:

```tsx
// Wraps the assistant's replies in the terminal at whitespace to the
// measure, leaving tables, code fences and words too long for it at the
// terminal's width. The engine refuses its own drawing under a Box with a
// width, so each piece is drawn as the mod's own Markdown, as a reply is,
// beside a bullet drawn as the engine draws its own.

import type { Register, RenderElement } from "claude-code";
import { segment } from "./segment.ts";

// The columns the engine's bullet and the space after it take.
const GUTTER = 2;

export const register: Register = (on, options) => {
    const columns =
        typeof options.columns === "number" ? options.columns : 80;

    on("ui.render", { component: "AssistantMessage" }, ($, e, next) => {
        const isRoomy = (e.viewport?.columns ?? 0) > columns + GUTTER;
        if (e.surface !== "terminal" || e.props.isSummary || !isRoomy) {
            return next(e);
        }
        const pieces = segment(e.props.text, columns);
        const [first] = pieces;
        if (
            first === undefined ||
            (pieces.length === 1 && first.kind === "wide")
        ) {
            return next(e);
        }
        const { Box, Text, Markdown } = $.ui.resolve(e);
        const drawn = pieces.map((piece) => {
            const width = piece.kind === "prose" ? { width: columns } : {};
            return (
                <Box
                    {...width}
                    paddingLeft={piece.indent}
                    marginTop={piece.gapBefore ? 1 : 0}
                >
                    <Markdown text={piece.text} />
                </Box>
            );
        });
        const column = <Box flexDirection="column">{drawn}</Box>;
        // The engine draws no bullet and no gutter on a later block.
        const row: RenderElement[] = e.props.isFirstOfReply
            ? [
                  <Box width={GUTTER}>
                      <Text color="text">●</Text>
                  </Box>,
                  column,
              ]
            : [column];
        return (
            <Box flexDirection="row" marginTop={1}>
                {row}
            </Box>
        );
    });
};
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `claude plugin test plugins/line-width`
Expected: PASS, 11 tests.

- [ ] **Step 5: Validate, type-check, lint and commit**

```sh
claude plugin validate --strict plugins/line-width
bunx tsc -p plugins/line-width
bunx biome check --write plugins/line-width
git add plugins/line-width/hooks/register.tsx plugins/line-width/hooks/register.test.ts
git commit -m "feat(line-width): Draw replies in measured pieces"
```

If `validate` refuses the `./segment.ts` import, import `./segment`
instead, drop `allowImportingTsExtensions` from the plugin's
`tsconfig.json`, and rerun.

---

### Task 7: Run plugin tests and type-checks in `check`

**Files:**

- Modify: `mise.toml` (after `[tasks."lint:plugins"]`), `package.json`
  (`scripts`)

**Interfaces:**

- Produces: `bun run test:plugins`, `bun run typecheck:plugins`, both run
  by `bun run check`

- [ ] **Step 1: Add the mise tasks**

In `mise.toml`, after the `[tasks."lint:plugins"]` table:

```toml
[tasks."test:plugins"]
#
# Runs `claude plugin test` on each plugin of function hooks that holds
# tests, against the engine itself. The CLI is this task's own, as for
# `lint:plugins`.
#
description = "Test the plugins' function hooks"
tools       = { "aqua:anthropics/claude-code" = "2" }
run         = """
for target in plugins/*/; do
    [ -n "$(find "$target" -name '*.test.ts' -o -name '*.test.tsx' | head -n 1)" ] || continue
    claude plugin test "$target"
done
"""

[tasks."typecheck:plugins"]
#
# Type-checks each plugin holding a `tsconfig.json`, which extends the
# types the engine writes into `.claude-plugin/types/` when it loads the
# plugin. Git ignores those, so a checkout that never loaded the plugin,
# CI among them, skips it with a note.
#
description = "Type-check the plugins' function hooks"
run         = """
for config in plugins/*/tsconfig.json; do
    [ -e "$config" ] || continue
    target=${config%/tsconfig.json}
    if [ ! -e "$target/.claude-plugin/types/tsconfig.json" ]; then
        printf 'typecheck:plugins: skipped %s, its engine-written types absent\\n' "$target" >&2
        continue
    fi
    tsc -p "$config"
done
"""
```

- [ ] **Step 2: Wire them into `package.json`**

Add to `scripts`:

```json
"test:plugins": "mise run --quiet test:plugins",
"typecheck:plugins": "mise run --quiet typecheck:plugins",
```

and make `check` begin:

```text
bun run typecheck && bun run typecheck:plugins && bun run test && bun run test:plugins && ...
```

keeping the rest of `check` as it is.

- [ ] **Step 3: Run them, then as CI would**

Run: `bun run typecheck:plugins && bun run test:plugins`
Expected: line-width type-checks and its 10 tests pass.

Run, with no credentials, as CI has:
`env -u ANTHROPIC_API_KEY CLAUDE_CONFIG_DIR="$(mktemp -d)" claude plugin test plugins/line-width`
Expected: the tests still pass. If the CLI demands a login, STOP and tell
the person: CI cannot run them, and `test:plugins` leaves `check`.

Run: `mv plugins/line-width/.claude-plugin/types /tmp/line-width-types && bun run typecheck:plugins; mv /tmp/line-width-types plugins/line-width/.claude-plugin/types`
Expected: the skip note, exit 0.

- [ ] **Step 4: Format and commit**

```sh
bun run format:toml && bunx biome check --write package.json
bun run check
git add mise.toml package.json
git commit -m "build: Test and type-check plugins' function hooks"
```

---

### Task 8: Check it live and write the README

**Files:**

- Modify: `plugins/line-width/README.md`
- Create (throwaway): `/tmp/line-width-live/prompt.md`,
  `/tmp/line-width-live/run.sh`

**Interfaces:** consumes the finished plugin.

- [ ] **Step 1: Write a prompt covering every rule**

`/tmp/line-width-live/prompt.md`:

````markdown
Reply with exactly the markdown between the two lines of equals signs,
verbatim, with nothing before or after it and without the equals signs.

==========
This paragraph is long enough to wrap several times at eighty columns, and the file it names is /home/chewygumxx/.herdr/worktrees/claude-library/feat-mod-line-width/plugins/line-width/hooks/register.tsx which holds the hook that draws it.

| Column | Meaning of the column, written long enough to pass eighty columns |
| ------ | ------------------------------------------------------------------ |
| one    | the first row of the table, which must not be wrapped at all here  |

1. Run the check:

   ```sh
   bun run check && claude plugin validate --strict plugins/line-width && echo all done
   ```

2. See https://example.com/a/very/long/path/that/runs/past/eighty/columns/on/its/own/line for more.

> A quoted line naming https://example.com/another/very/long/path/that/runs/past/eighty/columns here.
==========
````

`/tmp/line-width-live/run.sh`:

```sh
#!/bin/sh
# $1: the plugin folder; $2: the prompt file.
exec claude --plugin-dir "$1" --model haiku "$(cat "$2")"
```

- [ ] **Step 2: Run it and capture**

```sh
tmux new-session -d -s line-width-live -x 160 -y 80 \
    sh /tmp/line-width-live/run.sh "$PWD/plugins/line-width" /tmp/line-width-live/prompt.md
sleep 60
tmux capture-pane -p -t line-width-live -S -300 > /tmp/line-width-live/screen.txt
tmux kill-session -t line-width-live
awk '{ print length ": " $0 }' /tmp/line-width-live/screen.txt
```

Expected:

- the paragraph's prose lines at most 82 columns, broken at spaces; the
  path on a line of its own, whole
- the table and the fence unwrapped, past 82 columns
- the fence under step 1's text, not at the margin
- step 2's URL on its own line, indented under the step, `for more.`
  after it, the list numbered 1 and 2
- the quote's bar on every row, the URL whole

Anything else: STOP and show the person the capture.

- [ ] **Step 3: Write the README**

Below the generated first paragraph of `plugins/line-width/README.md`,
add:

```markdown
## Why

Replies drawn the full width of a wide terminal are hard to read. This
draws each reply's prose at a measure of 80 columns, wrapped at
whitespace, while tables, code blocks and any word too long for the
measure (a file path, a URL) keep the terminal's width, so none is broken
or squeezed.

Only the drawing changes: the stored reply, what Claude reads and the
ctrl+o transcript are left as they were.

## When it does nothing

- Off the terminal: the desktop app, VS Code and mobile draw as before
- In a terminal no wider than the measure and its two-column gutter
- On a summary of a reply, and on a reply that is one table, one code
  block or one long word

## Options

`columns`, the measure of reply text after the gutter: 80 by default,
from 40 to 200. Set it in `/config`.

## Requires

Claude Code 2.1.300 or later, for function hooks.
```

- [ ] **Step 4: Check everything and commit**

```sh
rm -rf /tmp/line-width-live
bun run check
git add plugins/line-width/README.md
git commit -m "docs(line-width): Describe the plugin"
```

Then ask the person to run `/reload-plugins` once the branch is merged
and the marketplace updated.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
