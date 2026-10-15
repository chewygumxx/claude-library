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
    on("ui.render", { component: "AssistantMessage" }, (_$, e, next) =>
        next(e),
    );
};
