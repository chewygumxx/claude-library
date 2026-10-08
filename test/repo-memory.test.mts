// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/repo-memory.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { read, repo, runHook, write } from "./hook.mts";

function wikilinks(project: string, toolInput: Record<string, string>) {
    return runHook("repo-memory", "prohibit-wikilinks.sh", {
        project,
        payload: { tool_input: toolInput },
    });
}

describe("repo-memory: prohibit-wikilinks", () => {
    test("blocks a wikilink in a memory, naming its lines", () => {
        const project = repo();
        const result = wikilinks(project, {
            file_path: join(project, ".claude/memory/a.md"),
            content: "one\nsee [[other-memory]]\nthree\n",
        });
        expect(result.code).toBe(2);
        expect(result.stderr).toContain("line(s) 2 of the proposed content");
    });

    test("allows wikilinks in code spans and fenced code", () => {
        const project = repo();
        const result = wikilinks(project, {
            file_path: join(project, ".claude/memory/a.md"),
            new_string: "`[[a]]`\n```\n[[b]]\n```\n",
        });
        expect(result.code).toBe(0);
    });

    test("allows Bash tests and bracket expressions", () => {
        const project = repo();
        const result = wikilinks(project, {
            file_path: join(project, ".claude/memory/a.md"),
            content: "[[ -n x ]] and [[:space:]]\n",
        });
        expect(result.code).toBe(0);
    });

    test("ignores files outside .claude/memory", () => {
        const project = repo();
        const result = wikilinks(project, {
            file_path: join(project, "README.md"),
            content: "[[a]]\n",
        });
        expect(result.code).toBe(0);
    });

    test("leaves a path stepping through .. alone", () => {
        const project = repo();
        const result = wikilinks(project, {
            // Not join, which would resolve the ..
            file_path: `${project}/.claude/memory/../memory/a.md`,
            content: "[[a]]\n",
        });
        expect(result.code).toBe(0);
    });
});

describe("repo-memory: sync-auto-memory-dir", () => {
    function sync(project: string) {
        return runHook("repo-memory", "sync-auto-memory-dir.sh", {
            project,
            payload: { hook_event_name: "SessionStart" },
        });
    }

    test("points autoMemoryDirectory at .claude/memory, once", () => {
        const project = repo({
            ".gitignore": ".claude/settings.local.json\n",
            ".claude/settings.local.json": '{"other": true}\n',
        });
        const first = sync(project);
        expect(first.code).toBe(0);
        expect(String(first.json?.systemMessage)).toContain("next session");
        const settings = JSON.parse(
            read(join(project, ".claude/settings.local.json")),
        );
        expect(settings).toEqual({
            other: true,
            autoMemoryDirectory: join(project, ".claude/memory"),
        });
        expect(existsSync(join(project, ".claude/memory"))).toBe(true);

        const second = sync(project);
        expect(second.code).toBe(0);
        expect(second.stdout).toBe("");
    });

    test("refuses a settings file git would track", () => {
        const project = repo();
        write(project, ".claude/.keep", "");
        const result = sync(project);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("Not git ignored");
        expect(existsSync(join(project, ".claude/settings.local.json"))).toBe(
            false,
        );
    });
});
