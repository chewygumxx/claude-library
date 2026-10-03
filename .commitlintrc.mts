// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/.commitlintrc.mts
//
//

import { defineConfig } from "@chewygumxx/commitlint-config";

// Types, limits and the prompt are shared; only the scopes are this
// repository's own.
export default defineConfig({
    scopes: [
        {
            name: "claude",
            fullName: "Claude",
            description:
                "Claude Code assets within /.claude/* (hooks, skills, agents, etc.)",
        },
        {
            name: "prohibit-em-dash",
            fullName: "Prohibit Em Dash",
            description:
                "Plugin: PreToolUse hook on Write|Edit to prohibit em dashes",
        },
        {
            name: "repo-memory",
            fullName: "Repo Memory",
            description:
                "Plugin: SessionStart hook to pin autoMemoryDirectory locally",
        },
        {
            name: "repo-metadata",
            fullName: ".repo-metadata.jsonc",
            description: "Plugin: Rule",
        },
    ],
});
