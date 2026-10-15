---
ctime: 2026-10-15
mtime: 2026-10-16
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
| How the pieces are drawn        | The mod's own `Markdown` elements beside a bullet of its own (the probe's finding)           |
| What 80 measures                | The text alone, after the two-column bullet gutter                                           |
| What counts as long             | A word whose drawn width in terminal cells exceeds the room its line has                     |
| Wide (CJK) characters           | A word holding any is never long, so it wraps within the measure                             |

## Layout

`plugins/line-width/`, scaffolded by `/new-plugin`'s script so it is
registered in the marketplace, `.claude/settings.json` and the commitlint
scopes. The script writes a shell hook, so it is run with these options,
then the generated `hooks/line-width.sh` is deleted and `hooks/hooks.json`
rewritten:

```sh
--event SessionStart  # a placeholder; the module replaces it
--scope "Plugin: ui.render hook wrapping replies to 80 columns"
--keyword ui --keyword markdown
```

The plugin's files:

- `.claude-plugin/plugin.json`: the house metadata, its `hooks` key naming
  the hooks file, and one `userConfig` field, `columns`, as below
- `hooks/hooks.json`: `{ "modules": ["./register.tsx"] }`
- `hooks/segment.ts`: a pure function cutting markdown into pieces; no
  engine imports
- `hooks/register.tsx`: the one `ui.render` hook
- `hooks/register.test.ts`: the hook's cases, run by `claude plugin test`
- `tsconfig.json`: extends the engine-written
  `.claude-plugin/types/tsconfig.json`, so `tsc -p` checks the module
- `README.md`: its front matter `description` and first paragraph match
  `plugin.json`'s

The `columns` field:

```json
{
    "type": "number",
    "title": "Columns",
    "description": "Columns of reply text, after the bullet gutter.",
    "default": 80,
    "min": 40,
    "max": 200
}
```

`register(on, options)` types `options.columns` as any option's value, so
the module narrows it: a number is used, anything else falls back to 80.

No `$.state`: the hook draws from its input alone.

## Cutting a block into pieces

`segment(text, columns)` returns, in the order the source is written:

```ts
type Piece = {
    kind: "prose" | "wide";
    text: string;
    indent: number;
    gapBefore: boolean;
};
```

`indent` is drawn as padding and `gapBefore` as one blank row; neither is
written into `text`. Adjacent `prose` pieces of one indent are merged,
keeping any blank line between them in `text`, so a reply of several
paragraphs is one piece. `wide` pieces are never merged: two of them
written together could read as other markdown.

### Blocks

- Code fence: a line of up to three spaces' indent, or any indent within a
  list item, opening with three or more backticks or tildes, to the
  matching close, or to the end of the block when unclosed, is `wide`. Its
  lines' common leading whitespace is stripped and becomes its `indent`, so
  a fence inside a numbered step stays under the step's text
- Table: a run of lines whose first non-blank character is `|`, holding a
  delimiter row (`| --- |`, colons allowed), is `wide`, its common leading
  whitespace taken as its `indent` the same way. A run without a delimiter
  row is `prose`
- Every other line is `prose`, `indent` 0, read for long words as below

`gapBefore` is set on a piece whose first source line follows a blank
line.

### Long words

A line is read as a run of tokens, each one of:

- a code span: a run of backticks to the next run of the same length,
  spaces inside included; drawn width, its content's
- a link or image, `[label](target)` or `![alt](target)`: drawn width, the
  label's or the alt's; the target is never drawn and never counted
- an autolink, `<scheme:...>`: drawn width, what lies between the angle
  brackets
- a word: a run of other non-whitespace; drawn width, its length less
  emphasis markers (`*`, `_`, `~`) and trailing punctuation (`.,;:!?)`)

Widths are in terminal cells. A token holding a wide character (East Asian
Wide or Fullwidth) is never long. Any other token is long when its drawn
width exceeds the room its line has: `columns` less the line's content
column (below).

A line is cut only at whitespace outside every emphasis opened before it.
Emphasis opens at a token beginning with up to three `*` or `_`, or with
`~~`, followed by neither whitespace nor `/`, and only where a later token
of the line ends with the same run: `~/path`, `__init__.py` and `**/*.ts`
open none.
A long token inside open emphasis stays in its prose and wraps there. A
long token outside cuts the line into three parts:

1. the text before it, trailing whitespace trimmed: `prose`, dropped when
   blank
2. the token alone: `wide`
3. the rest of the line, leading whitespace trimmed: `prose`, dropped when
   blank, and read again for further long tokens

A part after the first that would open block syntax is escaped with a
backslash: a leading `-`, `+` or `*` followed by a space, one to six `#`
followed by a space, a `>`, or digits followed by `.` or `)` and a space,
the backslash going before the `.` or `)`. Emphasis such as `**bold**` is
left alone, and a lone `|` cannot open a table without a delimiter row.

### Context across a cut

A cut part is drawn as markdown of its own, so it carries the context the
line had:

- List item: the line's content column is its leading whitespace, its
  marker (`-`, `*`, `+`, `1.`, `1)`) and the space after it. The marker
  stays with the first part; each later part takes the content column as
  its `indent`
- Continuation line: a line indented under a list item takes its leading
  whitespace as its content column, stripped from its text and carried as
  `indent`, so four or more spaces never read as code
- After a cut: once a line of a list has been cut, each later indented
  line of that list, item or continuation, is stripped of its leading
  whitespace and carried as `indent`, until a line at the margin ends the
  list, so the item's text and nested items stay under it
- Blockquote: every part is prefixed with the line's own quote markers
  (`>` or `> >`) and a space, `indent` 0, so the bar continues

## Drawing

`on('ui.render', { component: 'AssistantMessage' }, hook)`, its `Box`,
`Text` and `Markdown` taken from `$.ui.resolve(e)`:

1. Pass through, `return next(e)`, when the surface is not `terminal`,
   when `e.props.isSummary` is set, when `e.viewport` is absent or its
   `columns` is at most `columns + 2`, or when the text is over 90,000
   characters: a tree draws only the first 100,000 characters of its texts
2. Segment the text. No piece, or one `wide` piece, the whole block a
   table or a fence, passes through too
3. Otherwise the hook draws the block itself and never calls `next`. Each
   piece is one `Markdown` of its `text`, drawn as an assistant reply is.
   A `prose` piece sits in a `Box` of `width` `columns`, a `wide` piece in
   a `Box` with no width, so it runs to the terminal's edge. Either has
   `paddingLeft` of its `indent` and `marginTop` of 1 when `gapBefore`.
   The pieces sit in one `Box` of `flexDirection` `column`
4. When `e.props.isFirstOfReply` is set, a `Box` of `width` 2 holding a
   `●` in the theme's `text` colour stands to the left of the pieces, as
   the engine's bullet and gutter do; otherwise there is none, as the
   engine draws none. The whole sits in a `Box` of `flexDirection` `row`
   and `marginTop` 1, the blank row the engine draws above each block

The hook guards nothing, so it takes no `.catch`: one that throws is skipped
and the engine draws the reply itself.

## Risks, settled first

The docs leave these open. Before the rest is built, a minimal hook loaded
with `--plugin-dir` settles them in a live session, the test kit not
painting:

1. Whether a hook may call `next` more than once for one `ui.render`; the
   types speak of "the hook's last call", which suggests so
2. Whether a `Box`'s width makes the engine's markdown wrap at whitespace
   within it, and whether the gutter falls inside that width
3. Whether a block drawn with `isFirstOfReply` false keeps the two-column
   gutter, so later pieces align with the first
4. Whether the engine trims blank lines from a block's ends, which decides
   whether `gapBefore` is needed or doubles a gap
5. Whether a block opening `3.` draws as 3 or restarts at 1

Should the first fail, the pieces are drawn as the mod's own `Markdown`
elements beside a bullet of its own instead. Should the fifth, a long token
in an ordered list item is not cut out and wraps in its prose. Should the
second, the design is revisited.

### Findings

Probed on 2026-10-15 with Claude Code 2.1.300 in a 160-column terminal:

1. Several `next` calls: yes, each piece is drawn
2. Width: no. A tree holding an engine node under a `Box` with `width` is
   refused (`engine node under a Box with prop "width"`) and the engine
   draws its own. A `paddingRight` narrowing is accepted and wraps at
   whitespace
3. Gutter: no. A block drawn with `isFirstOfReply` false has neither
   bullet nor gutter
4. Blank rows: the engine draws a blank row above every block it draws,
   so pieces drawn by it are always a row apart, cut parts included
5. Numbering: a block opening `3.` draws as 3

The second and fourth together rule out the engine's drawing, so the
blocks are drawn as the mod's own `Markdown`, which a second probe showed
to wrap at the measure, keep numbering and leave the spacing to the mod.
The engine's bullet is drawn in the theme's `text` colour.

## Testing

- `test/line-width.test.mts`, run by `bun run test` and CI, holds the
  `segment` cases:
  - plain prose
  - a closed fence, an unclosed fence and a fence indented in a numbered
    step
  - a table, and a lone pipe line that is not one
  - a long URL mid-sentence, a long bare URL in an autolink and a long URL
    as a link's target, which is not cut
  - a long path in a code span holding spaces
  - a long word inside open emphasis, which is not cut
  - a rest part opening `- ` or `1.`, escaped
  - a long word in a list item, in its continuation line, in a nested item
    and in a blockquote
  - a word exactly the room long, which stays in its prose, and a list
    item's word one cell over its room, which is cut
  - a run of CJK text, never cut
  - `gapBefore` across a blank line and not across a line break
- `plugins/line-width/hooks/register.test.ts`, run by `claude plugin test`,
  mounts the component with a hook beneath the plugin that records each
  `next` call and answers a marker. Cases:
  - pass-through on `desktop`, on a summary, on a narrow viewport and on a
    block that is one table
  - plain prose drawn as one `Markdown` of width 80 beside the bullet,
    with no `next` call
  - a block holding a table drawn as three `Markdown` pieces, the table's
    `Box` with no width
  - a list item's cut parts padded by its indent
  - a block that is not the first of its reply drawn with no bullet
  - a `columns` option of 60 honoured
- Two mise tasks join `check`, as `lint:plugins` does:
  - `test:plugins` runs `claude plugin test` on each plugin holding a
    `*.test.ts`, so CI runs the hook's cases
  - `typecheck:plugins` runs `tsc -p` on each plugin holding a
    `tsconfig.json`, and skips one whose engine-written types are absent,
    as the hook tests skip a tool that does not run. Those types are
    written only when an engine loads the plugin and are ignored by git,
    so CI skips the module: it is checked locally, and in CI only by
    `claude plugin validate --strict` and its tests
- `bun run check` passes

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
