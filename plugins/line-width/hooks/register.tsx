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
// terminal's width. The engine refuses its own drawing under a Box with a
// width, so each piece is drawn as the mod's own Markdown, as a reply is,
// beside a bullet drawn as the engine draws its own.

import type { Register, RenderElement } from "claude-code";
import { segment } from "./segment.ts";

// The columns the engine's bullet and the space after it take.
const GUTTER = 2;

export const register: Register = (on, options) => {
    const columns = typeof options.columns === "number" ? options.columns : 80;

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
