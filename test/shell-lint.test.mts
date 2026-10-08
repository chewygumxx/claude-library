// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/shell-lint.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { read, runHook, runs, tempDir, write } from "./hook.mts";

function lint(project: string, file: string) {
    return runHook("shell-lint", "shell-lint.sh", {
        project,
        payload: { tool_input: { file_path: file } },
    });
}

describe.skipIf(!runs("shfmt", "--version"))("shell-lint", () => {
    test("formats a script and tells Claude to read it again", () => {
        const project = tempDir();
        const file = write(
            project,
            "a.sh",
            "#!/bin/sh\nif true;then\necho hi\nfi\n",
        );
        const result = lint(project, file);
        expect(result.code).toBe(0);
        expect(read(file)).toContain("if true; then");
        const output = result.json?.hookSpecificOutput as Record<
            string,
            string
        >;
        expect(output.additionalContext).toContain("read it again");
    });

    test("finds a script by its shebang", () => {
        const project = tempDir();
        const file = write(project, "hook", "#!/bin/sh\nif true;then :;fi\n");
        expect(lint(project, file).code).toBe(0);
        expect(read(file)).toContain("if true; then");
    });

    test.skipIf(!runs("shellcheck", "--version"))(
        "reports shellcheck's findings with exit 2",
        () => {
            const project = tempDir();
            const file = write(project, "a.sh", "#!/bin/sh\necho $1\n");
            const result = lint(project, file);
            expect(result.code).toBe(2);
            expect(result.stderr).toContain("SC2086");
        },
    );

    test("leaves other files alone", () => {
        const project = tempDir();
        const file = write(project, "a.txt", "if true;then\n");
        expect(lint(project, file).code).toBe(0);
        expect(read(file)).toBe("if true;then\n");
    });

    test("leaves a file outside the project alone", () => {
        const file = write(tempDir(), "a.sh", "if true;then :;fi\n");
        expect(lint(tempDir(), file).code).toBe(0);
        expect(read(file)).toBe("if true;then :;fi\n");
    });

    test("ignores a missing file", () => {
        const project = tempDir();
        expect(lint(project, join(project, "gone.sh")).code).toBe(0);
    });
});
