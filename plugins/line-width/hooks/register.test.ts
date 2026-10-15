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
type Tree = { props?: { width?: number }; children?: Tree[] };

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
        expect(
            await draw($, `Text\n\n${TABLE}`, { surface: "desktop" }),
        ).toMatchObject({ type: "Text" });
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
        // The table's Box, second in the column beside the bullet.
        const table = (tree as Tree).children?.[1]?.children?.[1];
        expect(table?.props?.width).toBe(undefined);
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
