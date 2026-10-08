// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/repo-metadata.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { MARKER, runHook, tempDir, write } from "./hook.mts";

const METADATA = `{
    "description": "A repository",
    // "homepage": "https://example.com",
    "topics": ["a"]
}
`;

function deny(project: string, command: string) {
    return runHook("repo-metadata", "deny-gh-repo-edit.sh", {
        project,
        payload: { tool_input: { command } },
    });
}

function projectWithMetadata(): string {
    const project = tempDir();
    write(project, ".repo-metadata.jsonc", METADATA);
    return project;
}

describe("repo-metadata: deny-gh-repo-edit", () => {
    test("denies a flag whose key the file holds", () => {
        const result = deny(
            projectWithMetadata(),
            "gh repo edit --description 'x' --add-topic b",
        );
        expect(result.code).toBe(0);
        const output = result.json?.hookSpecificOutput as Record<
            string,
            string
        >;
        expect(output.permissionDecision).toBe("deny");
        expect(output.permissionDecisionReason).toContain(
            "--description (description)",
        );
        expect(output.permissionDecisionReason).toContain(
            "--add-topic (topics)",
        );
    });

    test("allows a flag whose key is only in a comment", () => {
        const result = deny(
            projectWithMetadata(),
            "gh repo edit --homepage https://example.org",
        );
        expect(result.code).toBe(0);
        expect(result.stdout).toBe("");
    });

    test("allows a flag no key covers", () => {
        const result = deny(
            projectWithMetadata(),
            "gh repo edit --default-branch main",
        );
        expect(result.stdout).toBe("");
    });

    test("finds gh repo edit after another command", () => {
        const result = deny(
            projectWithMetadata(),
            "git status && gh repo edit -d x",
        );
        expect(result.json).toBeDefined();
    });

    test("allows other commands", () => {
        const result = deny(projectWithMetadata(), "gh repo view");
        expect(result.stdout).toBe("");
    });

    test("does nothing without .repo-metadata.jsonc", () => {
        const result = deny(tempDir(), "gh repo edit --description x");
        expect(result.code).toBe(0);
        expect(result.stdout).toBe("");
    });
});

describe("repo-metadata: remind", () => {
    test("prints the reminder without its front matter or header", () => {
        const result = runHook("repo-metadata", "remind.sh", {
            project: tempDir(),
            payload: { tool_input: { file_path: ".repo-metadata.jsonc" } },
            args: [
                join(
                    import.meta.dir,
                    "../plugins/repo-metadata/hooks/repo-metadata.md",
                ),
            ],
        });
        expect(result.code).toBe(0);
        const output = result.json?.hookSpecificOutput as Record<
            string,
            string
        >;
        expect(output.hookEventName).toBe("PostToolUse");
        const context = output.additionalContext ?? "";
        expect(context.length).toBeGreaterThan(0);
        expect(context).not.toStartWith("---");
        expect(context).not.toContain(MARKER);
        expect(context).not.toContain("vim:set");
    });
});
