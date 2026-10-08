// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/biome-lint.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { symlinkSync } from "node:fs";
import { basename, join } from "node:path";
import { read, repo, runHook, tempDir, write } from "./hook.mts";

// A project extending the shared configuration, with this repository's
// Biome and node_modules.
function project(): string {
    const dir = repo({
        ".biome.json": '{"extends": ["@chewygumxx/biome-config"]}\n',
        ".editorconfig":
            "root = true\n[*]\nindent_style = space\nindent_size = 4\n",
    });
    symlinkSync(
        join(import.meta.dir, "..", "node_modules"),
        join(dir, "node_modules"),
    );
    return dir;
}

function lint(dir: string, file: string) {
    return runHook("biome-lint", "biome-lint.sh", {
        project: dir,
        payload: { tool_input: { file_path: file } },
    });
}

describe("biome-lint", () => {
    test("formats a file and tells Claude to read it again", () => {
        const dir = project();
        const file = write(dir, "a.json", '{"a":1,\n"b":[1,2]}\n');
        const result = lint(dir, file);
        expect(result.code).toBe(0);
        expect(read(file)).toBe('{ "a": 1, "b": [1, 2] }\n');
        const output = result.json?.hookSpecificOutput as Record<
            string,
            string
        >;
        expect(output.additionalContext).toContain("read it again");
    });

    test("reports what it cannot fix with exit 2", () => {
        const dir = project();
        const file = write(dir, "a.ts", "debugger;\nexport {};\n");
        const result = lint(dir, file);
        expect(result.code).toBe(2);
        expect(result.stderr).toContain("noDebugger");
    });

    test("is silent on a clean file", () => {
        const dir = project();
        const file = write(dir, "a.json", '{ "a": 1 }\n');
        const result = lint(dir, file);
        expect(result.code).toBe(0);
        expect(result.stdout).toBe("");
    });

    test("leaves files Biome does not handle alone", () => {
        const dir = project();
        const file = write(dir, "a.md", "#  Title\n");
        expect(lint(dir, file).code).toBe(0);
        expect(read(file)).toBe("#  Title\n");
    });

    test("leaves files the configuration excludes alone", () => {
        const dir = project();
        const file = write(dir, ".claude/settings.json", '{\n  "a": 1\n}\n');
        expect(lint(dir, file).code).toBe(0);
        expect(read(file)).toBe('{\n  "a": 1\n}\n');
    });

    test("does nothing in a project without a Biome configuration", () => {
        const dir = tempDir();
        const file = write(dir, "a.json", '{"a":1}\n');
        expect(lint(dir, file).code).toBe(0);
        expect(read(file)).toBe('{"a":1}\n');
    });

    test("leaves a file outside the project alone", () => {
        const file = write(tempDir(), "a.json", '{"a":1}\n');
        expect(lint(project(), file).code).toBe(0);
        expect(read(file)).toBe('{"a":1}\n');
    });

    test("leaves a file reached through .. alone", () => {
        const outside = tempDir();
        const file = write(outside, "a.json", '{"a":1}\n');
        const dir = project();
        const result = lint(dir, `${dir}/../${basename(outside)}/a.json`);
        expect(result.code).toBe(0);
        expect(read(file)).toBe('{"a":1}\n');
    });

    test("leaves a symlink to a file outside alone", () => {
        const file = write(tempDir(), "a.json", '{"a":1}\n');
        const dir = project();
        symlinkSync(file, join(dir, "link.json"));
        expect(lint(dir, join(dir, "link.json")).code).toBe(0);
        expect(read(file)).toBe('{"a":1}\n');
    });

    test("acts when the project is named through a symlink", () => {
        const dir = project();
        const link = join(tempDir(), "link");
        symlinkSync(dir, link);
        const file = write(dir, "a.json", '{"a":1,\n"b":2}\n');
        expect(lint(link, file).code).toBe(0);
        expect(read(file)).toBe('{ "a": 1, "b": 2 }\n');
    });

    test("acts when the project ends in a slash", () => {
        const dir = project();
        const file = write(dir, "a.json", '{"a":1,\n"b":2}\n');
        expect(lint(`${dir}/`, file).code).toBe(0);
        expect(read(file)).toBe('{ "a": 1, "b": 2 }\n');
    });
});
