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
            name: "bun-install",
            fullName: "Bun Install",
            description:
                "Plugin: SessionStart hook to bun install in remote sessions",
        },
        {
            name: "header-metadata",
            fullName: "Header Metadata",
            description: "Plugin: Hooks to write file headers",
        },
        {
            name: "plugin-lint",
            fullName: "Plugin Lint",
            description:
                "Plugin: PostToolUse hook to validate edited plugin files",
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
            fullName: "Repo Metadata",
            description:
                "Plugin: Hooks on editing GitHub settings via .repo-metadata.jsonc",
        },
        {
            name: "shell-lint",
            fullName: "Shell Lint",
            description:
                "Plugin: PostToolUse hook to shfmt and shellcheck scripts",
        },
    ],
});
