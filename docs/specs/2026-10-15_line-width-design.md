---
ctime: 2026-10-15
mtime: 2026-10-15
spdx: GPL-3.0-only
title: "Line Width: design"
description: >-
  Design for a mod that wraps the assistant's replies in the terminal at
  whitespace to 80 columns, sparing long words, tables and code blocks.
tags:
  - llm
  - claude
  - claude-code
  - claude-plugin
  - claude-library
  - spec
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/docs/specs/2026-10-15_line-width-design.md
   -
   -->

# Line Width: design

## Intent

The assistant's replies in the Claude Code TUI run the full width of the
terminal. The mod wraps each reply's text at whitespace to 80 columns, so
prose reads at a comfortable measure, while sparing what wrapping would
damage:

- a word too long for the measure, typically a file path or URL, keeps a
  line of its own and runs past 80 columns unbroken
- tables and fenced code blocks are drawn at the terminal's full width, as
  they are today

Only the drawing changes: the stored message, what the model reads and the
ctrl+o transcript stay as they are. Other surfaces (desktop, VS Code,
mobile) are left alone.

## Decisions

| Question                        | Decision                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| A paragraph holding a long word | The text before it wraps at 80, the word takes a line of its own, the rest wraps at 80 again |
| Code fences                     | Exempt, as tables are                                                                        |
| How the pieces are drawn        | The engine's own drawing, one `next` call per piece                                          |
| What 80 measures                | The text alone, after the two-column bullet gutter                                           |
| What counts as long             | Any word whose visible length exceeds the measure                                            |

## Layout

`plugins/line-width/`, scaffolded by `/new-plugin`'s script so it is
registered in the marketplace, `.claude/settings.json` and the commitlint
scopes, then switched from a shell hook to a hooks module:

- `.claude-plugin/plugin.json`: the house metadata, `"hooks":
"./hooks/hooks.json"`, and a `userConfig` number field `columns`,
  default 80
- `hooks/hooks.json`: `{ "modules": ["./register.tsx"] }`
- `hooks/segment.ts`: a pure function cutting markdown into pieces; no
  engine imports
- `hooks/register.tsx`: the one `ui.render` hook
- `hooks/register.test.ts`: the hook's cases, run by `claude plugin test`
- `README.md`

No `$.state`: the hook draws from its input alone.

## Cutting a block into pieces

`segment(text, columns)` returns
`{ kind: 'prose' | 'wide'; text: string; indent: number }[]`, in the order
the lines are written, adjacent pieces of one kind and indent merged.

- Code fence: from an opening fence of three or more backticks or tildes to
  the matching close, or to the end of the block when unclosed, is `wide`
- Table: a run of lines starting with `|` that holds a delimiter row
  (`| --- |`, colons allowed) is `wide`; a run without one is `prose`
- Long word: every other line is read word by word, a word being a run of
  non-whitespace. Its visible length is its length less surrounding
  backticks, emphasis markers (`*`, `_`, `~`) and trailing punctuation
  (`.,;:!?)`). A word whose visible length exceeds `columns` splits the line
  into the text before it (`prose`, dropped when blank), the word alone
  (`wide`) and the rest of the line (`prose`, read again for further long
  words)
- List items and blockquotes: on a line opening with a list marker (`-`,
  `*`, `+`, `1.`, `1)`) or `>`, the marker stays with the first part alone.
  Each later part has the marker's width, leading whitespace and the space
  after it included, as its `indent`, so it sits under the item's text. The
  indent is drawn as padding, never written as spaces, since markdown reads
  four or more leading spaces as code
- Everything else is `prose`, with an `indent` of 0

A block that comes to one `prose` piece, the common case, takes the fast
path below.

## Drawing

`on('ui.render', { component: 'AssistantMessage' }, hook)`:

1. Pass through, `return next(e)`, when the surface is not `terminal`,
   when `e.props.isSummary` is set, or when `e.viewport` is absent or its
   `columns` is at most `columns + 2`
2. Fast path: `<Box width={columns + 2}>{await next(e)}</Box>`, the `+ 2`
   being the bullet gutter
3. Pieces: each drawn by `next({ ...e, props: { ...e.props, text, isFirstOfReply } })`,
   `isFirstOfReply` carried on the first piece alone. A `prose` piece sits
   in a `Box` of `columns + 2`, a `wide` piece in a `Box` with no width, so
   it wraps only at the terminal's edge, either with `paddingLeft` of its
   `indent`; all of them in one `Box` of `flexDirection: 'column'`

The hook guards nothing, so it takes no `.catch`: one that throws is skipped
and the engine draws the reply itself.

## Risks, settled first

The docs do not say:

1. whether a hook may call `next` more than once for one `ui.render`
2. whether a `Box`'s width makes the engine's markdown wrap at whitespace
   within it, and whether the gutter falls inside that width

Before the rest is built, a minimal hook loaded with `--plugin-dir` answers
both in a live session, the test kit not painting. Should the first fail,
the pieces are drawn as the mod's own `Markdown` elements beside a bullet of
its own instead; should the second fail, the design is revisited.

## Testing

- `test/line-width.test.mts`, run by `bun run test` and CI, holds the
  `segment` cases: plain prose; a closed and an unclosed fence; a table and a
  lone pipe line that is not one; a long URL mid-sentence; a long path in
  backticks; a long word in a list item and in a blockquote; a word exactly
  `columns` long, which stays in its prose
- `plugins/line-width/hooks/register.test.ts`, run by `claude plugin test`,
  hooks beneath the plugin to record each `next` call and answer a marker.
  Cases: pass-through on `desktop`, on a summary and on a narrow viewport;
  the fast path's one `Box` of width 82; a block holding a table drawn by
  three `next` calls, the first alone carrying `isFirstOfReply`; a
  `columns` option of 60 honoured
- `bun run check` passes, `claude plugin validate --strict` included

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
