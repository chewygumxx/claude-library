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
const QUOTE = /^[ \t]*(?:>[ \t]?)+/;
// A delimiter run that may open emphasis: up to three `*` or `_`, or `~~`.
const EMPHASIS_OPEN = /^(\*{1,3}|_{1,3}|~~)(?=[^\s/])/;
const EMPHASIS_RUNS = ["*", "**", "***", "_", "__", "___", "~~"];
const LINK = /!?\[([^\]\n]*)\]\([^()\s]*\)/y;
const BACKTICKS = /`+/y;
const AUTOLINK = /<([a-z][a-z0-9+.-]*:[^<>\s]*)>/iy;
// East Asian Wide and Fullwidth ranges, and emoji: two cells each.
const WIDE_CHARACTER =
    /[\u{1100}-\u{115f}\u{2e80}-\u{a4cf}\u{ac00}-\u{d7a3}\u{f900}-\u{faff}\u{fe30}-\u{fe4f}\u{ff00}-\u{ff60}\u{ffe0}-\u{ffe6}\u{1f300}-\u{1faff}\u{20000}-\u{3fffd}]/u;

type Part = { kind: Piece["kind"]; text: string };
type Token = { start: number; end: number; drawn: string };

export function segment(text: string, columns: number): Piece[] {
    const lines = text.split(/\r?\n/);
    const pieces: Piece[] = [];
    let gap = false;
    let inList = false;
    let isCut = false;
    let plainUntil = 0;

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
        if (i >= plainUntil) {
            const [end, isTable] = tableEnd(lines, i);
            if (isTable) {
                add(block(lines.slice(i, end), "wide"));
                i = end;
                continue;
            }
            // A pipe run with no delimiter row is prose to its end.
            plainUntil = end;
        }
        if (LIST_ITEM.test(line)) {
            inList = true;
        } else if (leading(line) === 0) {
            inList = false;
        }
        isCut &&= inList;
        // Once a cut has left a list's text in padded pieces, its indented
        // lines are padded too, or they would fall to the margin.
        const shift = isCut ? leading(line) : 0;
        const units = lineUnits(line.slice(shift), columns - shift, inList);
        for (const unit of units) {
            add({ ...unit, indent: unit.indent + shift });
        }
        isCut ||= inList && (units.length > 1 || units[0]?.kind === "wide");
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

// The end of the run of lines opening with a pipe from `start`, and
// whether the run is a table: whether it holds a delimiter row.
function tableEnd(lines: string[], start: number): [number, boolean] {
    let end = start;
    let isTable = false;
    while ((lines[end] ?? "").trimStart().startsWith("|")) {
        isTable ||= DELIMITER_ROW.test((lines[end] ?? "").trim());
        end += 1;
    }
    return [end, isTable];
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
    const bar =
        quote === undefined ? "" : "> ".repeat(quote.split(">").length - 1);
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

// Cuts content around each long token outside emphasis, in one pass;
// `room` is the cells its line has. Emphasis opens only where a token
// later in the line closes it, so `~/path`, `__init__.py` and `**/*.ts`
// open none.
function cut(content: string, room: number): Part[] {
    const found = tokens(content);
    const raws = found.map((token) => content.slice(token.start, token.end));
    // Each delimiter run's last closing token, so an opener is checked once.
    const lastClose = new Map<string, number>();
    for (const [index, raw] of raws.entries()) {
        for (const run of EMPHASIS_RUNS) {
            if (closes(raw, run)) {
                lastClose.set(run, index);
            }
        }
    }
    const parts: Part[] = [];
    let from = 0;
    let open: string | undefined;
    for (const [index, token] of found.entries()) {
        const raw = raws[index] ?? "";
        const before = open;
        const run = EMPHASIS_OPEN.exec(raw)?.[1];
        if (open === undefined && run !== undefined) {
            if ((lastClose.get(run) ?? -1) >= index) {
                open = run;
            }
        }
        if (open !== undefined && closes(raw, open)) {
            open = undefined;
        }
        if (
            before === undefined &&
            open === undefined &&
            isLong(token.drawn, room)
        ) {
            const head = content.slice(from, token.start).trim();
            if (head !== "") {
                parts.push({ kind: "prose", text: head });
            }
            parts.push({ kind: "wide", text: raw });
            from = token.end;
        }
    }
    const rest = content.slice(from);
    const tail = from === 0 ? rest : rest.trim();
    if (tail !== "") {
        parts.push({ kind: "prose", text: tail });
    }
    return parts;
}

// Whether a token ends with the delimiter run, trailing punctuation aside.
function closes(raw: string, run: string): boolean {
    return raw.replace(/[.,;:!?)]+$/, "").endsWith(run);
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
            const span = char === "`" ? codeSpan(line, i) : undefined;
            const link =
                char === "[" || char === "!" ? at(LINK, line, i) : null;
            const autolink = char === "<" ? at(AUTOLINK, line, i) : null;
            if (span) {
                drawn += span.drawn;
                i += span.length;
            } else if (link) {
                drawn += link[1] ?? "";
                i += link[0].length;
            } else if (autolink) {
                drawn += autolink[1] ?? "";
                i += autolink[0].length;
            } else if (char === "`") {
                // An unmatched run is literal, the whole run at once.
                const run = at(BACKTICKS, line, i)?.[0] ?? char;
                drawn += run;
                i += run.length;
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

// A code span opening at `start`: its length and the text it draws, or
// undefined when no run of backticks as long closes it.
function codeSpan(
    line: string,
    start: number,
): { length: number; drawn: string } | undefined {
    const open = at(BACKTICKS, line, start)?.[0] ?? "`";
    let from = start + open.length;
    for (;;) {
        const close = line.indexOf(open, from);
        if (close === -1) {
            return undefined;
        }
        const isExact =
            line[close - 1] !== "`" && line[close + open.length] !== "`";
        if (isExact) {
            return {
                length: close + open.length - start,
                drawn: line.slice(start + open.length, close).trim(),
            };
        }
        from = close + 1;
    }
}

// A sticky pattern's match at `index`, without slicing the line.
function at(pattern: RegExp, line: string, index: number) {
    pattern.lastIndex = index;
    return pattern.exec(line);
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
