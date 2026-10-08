// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/plugin-lint.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { runHook, runs, tempDir, write } from "./hook.mts";

// Complete enough for --strict, which fails on a missing author.
const MANIFEST = {
    name: "fixture",
    version: "0.0.1",
    description: "A test.",
    author: { name: "Test" },
};

function lint(project: string, file: string) {
    return runHook("plugin-lint", "plugin-lint.sh", {
        project,
        payload: { tool_input: { file_path: file } },
    });
}

describe.skipIf(!runs("claude", "--version"))("plugin-lint", () => {
    test("passes a valid manifest", () => {
        const project = tempDir();
        const file = write(
            project,
            "plugins/fixture/.claude-plugin/plugin.json",
            JSON.stringify(MANIFEST),
        );
        expect(lint(project, file).code).toBe(0);
    });

    test("reports a broken manifest with exit 2", () => {
        const project = tempDir();
        const file = write(
            project,
            "plugins/fixture/.claude-plugin/plugin.json",
            '{"name": "fixture",',
        );
        const result = lint(project, file);
        expect(result.code).toBe(2);
        expect(result.stderr).toStartWith("plugin-lint: ");
    });

    test("validates the plugin holding a broken hooks file", () => {
        const project = tempDir();
        write(
            project,
            "plugins/fixture/.claude-plugin/plugin.json",
            JSON.stringify(MANIFEST),
        );
        const file = write(
            project,
            "plugins/fixture/hooks/hooks.json",
            '{"hooks": {"NoSuchEvent": []}}',
        );
        expect(lint(project, file).code).toBe(2);
    });

    test("ignores other files", () => {
        const project = tempDir();
        const file = write(project, "plugins/fixture/README.md", "# x\n");
        expect(lint(project, file).code).toBe(0);
    });

    test("ignores a hooks file outside any plugin", () => {
        const project = tempDir();
        const file = write(project, "hooks/hooks.json", "{");
        expect(lint(project, file).code).toBe(0);
    });
});
