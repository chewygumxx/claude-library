// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/line-width.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { type Piece, segment } from "../plugins/line-width/hooks/segment.ts";

// A narrow measure keeps the cases short.
const COLUMNS = 20;

const prose = (text: string, indent = 0, gapBefore = false): Piece => ({
    kind: "prose",
    text,
    indent,
    gapBefore,
});
const wide = (text: string, indent = 0, gapBefore = false): Piece => ({
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
