// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/header-metadata.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { git, MARKER, repo, runHook, write } from "./hook.mts";

function headedScript(path: string, licence = "GPL-3.0-only"): string {
    return `#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: ${licence}

#
#
# ~test/fixture.git
# ${MARKER}${path}
#
#

echo a
`;
}

// A repository whose committed files carry the house header, as git grep
// finds only tracked files.
function headedRepo(files: Record<string, string> = {}): string {
    const dir = repo({
        "a.sh": headedScript("a.sh"),
        ".gitignore": "ignored/\n",
        ...files,
    });
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "Fixture");
    return dir;
}

function writeFile(project: string, path: string, content: string) {
    return runHook("header-metadata", "header-metadata.sh", {
        project,
        payload: {
            hook_event_name: "PreToolUse",
            tool_name: "Write",
            tool_input: { file_path: join(project, path), content },
        },
    });
}

function updatedContent(result: ReturnType<typeof writeFile>): string {
    const output = result.json?.hookSpecificOutput as {
        updatedInput?: { content?: string };
    };
    return output?.updatedInput?.content ?? "";
}

describe("header-metadata: PreToolUse", () => {
    test("heads a new file with its own path", () => {
        const project = headedRepo();
        const result = writeFile(project, "b/c.sh", "#!/bin/sh\necho c\n");
        expect(result.code).toBe(0);
        const content = updatedContent(result);
        expect(content).toStartWith("#!/bin/sh\n");
        expect(content).toContain(`${MARKER}b/c.sh`);
        expect(content).toContain("SPDX-License-Identifier: GPL-3.0-only");
        expect(content).toEndWith("echo c\n");
    });

    test("keeps an overwritten file's own header", () => {
        const project = headedRepo({ "b.sh": headedScript("b.sh", "MIT") });
        const result = writeFile(project, "b.sh", "#!/bin/sh\necho b\n");
        expect(result.code).toBe(0);
        const content = updatedContent(result);
        expect(content).toContain("SPDX-License-Identifier: MIT");
        expect(content).toEndWith("echo b\n");
    });

    test("leaves a git ignored file alone", () => {
        const project = headedRepo();
        const result = writeFile(project, "ignored/c.sh", "#!/bin/sh\n");
        expect(updatedContent(result)).toBe("");
    });

    test("leaves a path holding whitespace alone", () => {
        const project = headedRepo();
        const result = writeFile(project, "b c.sh", "#!/bin/sh\n");
        expect(updatedContent(result)).toBe("");
    });

    test("does nothing in a repository without headers", () => {
        const project = repo({ "a.sh": "#!/bin/sh\n" });
        git(project, "add", "-A");
        git(project, "commit", "-q", "-m", "Fixture");
        const result = writeFile(project, "b.sh", "#!/bin/sh\n");
        expect(result.code).toBe(0);
        expect(result.stdout).toBe("");
    });
});

describe("header-metadata: SessionStart", () => {
    function start(project: string) {
        return runHook("header-metadata", "header-metadata.sh", {
            project,
            payload: { hook_event_name: "SessionStart" },
        });
    }

    test("explains the header where files carry one", () => {
        const result = start(headedRepo());
        expect(result.code).toBe(0);
        expect(result.stdout).toContain("house header");
        expect(result.stdout).not.toContain("In Markdown");
    });

    test("is silent elsewhere", () => {
        const result = start(repo());
        expect(result.code).toBe(0);
        expect(result.stdout).toBe("");
    });
});
