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
const LINK = /^!?\[([^\]\n]*)\]\([^()\s]*\)/;
const AUTOLINK = /^<([a-z][a-z0-9+.-]*:[^<>\s]*)>/i;
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
        for (const unit of lineUnits(line, columns, inList)) {
            add(unit);
        }
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
                ...(head === ""
                    ? []
                    : [{ kind: "prose" as const, text: head }]),
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
