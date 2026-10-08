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
            name: "biome-lint",
            fullName: "Biome Lint",
            description: "Plugin: PostToolUse hook running Biome",
        },
        {
            name: "common",
            fullName: "Common",
            description: "Ubiquitous baseline plugins of minimal token demand",
        },
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
                "Plugin: Hooks to pin autoMemoryDirectory and its link style",
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
        {
            name: "github-mcp",
            fullName: "GitHub MCP",
            description: "GitHub MCP Server Integration via `gh auth token`",
        },
        {
            name: "context7-mcp",
            fullName: "Context7 MCP",
            description: "Plugin: MCP server for library documentation",
        },
        {
            name: "compact",
            fullName: "Compact",
            description: "Plugin: Skill to generate a compaction invocation",
        },
    ],
});
