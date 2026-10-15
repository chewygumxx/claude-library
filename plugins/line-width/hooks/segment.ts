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
