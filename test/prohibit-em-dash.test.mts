// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/prohibit-em-dash.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { runHook, tempDir } from "./hook.mts";

// Built from its code point, so this file holds no em dash itself.
const EM_DASH = String.fromCodePoint(0x2014);

function check(project: string, toolInput: Record<string, string>) {
    return runHook("prohibit-em-dash", "prohibit-em-dash.sh", {
        project,
        payload: { tool_input: toolInput },
    });
}

describe("prohibit-em-dash", () => {
    test("blocks a Write whose content holds one, naming its lines", () => {
        const project = tempDir();
        const result = check(project, {
            file_path: join(project, "a.md"),
            content: `one\ntwo ${EM_DASH} three\nfour\n${EM_DASH}\n`,
        });
        expect(result.code).toBe(2);
        expect(result.stderr).toContain("line(s) 2, 4 of the proposed content");
    });

    test("blocks an Edit whose new_string holds one", () => {
        const project = tempDir();
        const result = check(project, {
            file_path: join(project, "a.md"),
            old_string: "a",
            new_string: `b ${EM_DASH} c`,
        });
        expect(result.code).toBe(2);
        expect(result.stderr).toContain("of the proposed new_string");
    });

    test("allows text without one", () => {
        const project = tempDir();
        const result = check(project, {
            file_path: join(project, "a.md"),
            content: `an en dash ${String.fromCodePoint(0x2013)} is fine\n`,
        });
        expect(result.code).toBe(0);
        expect(result.stderr).toBe("");
    });

    test("ignores a file outside the project", () => {
        const result = check(tempDir(), {
            file_path: join(tempDir(), "a.md"),
            content: EM_DASH,
        });
        expect(result.code).toBe(0);
    });

    test("resolves .. before deciding a path is outside", () => {
        const project = tempDir();
        const result = check(project, {
            file_path: `${project}/sub/../new/a.md`,
            content: EM_DASH,
        });
        expect(result.code).toBe(2);
    });

    test("fails without CLAUDE_PROJECT_DIR, without blocking", () => {
        const result = runHook("prohibit-em-dash", "prohibit-em-dash.sh", {
            payload: { tool_input: { file_path: "/a.md", content: EM_DASH } },
        });
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("CLAUDE_PROJECT_DIR");
    });
});
