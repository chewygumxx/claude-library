// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/bun-install.test.mts
//
//

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { runHook, tempDir, write } from "./hook.mts";

// A project whose install leaves a marker, through its prepare script. Bun
// writes no lockfile without a dependency, so it has a local one.
function project(lockfile: boolean): string {
    const dir = tempDir();
    write(dir, "dep/package.json", '{"name": "dep", "version": "1.0.0"}');
    write(
        dir,
        "package.json",
        JSON.stringify({
            name: "fixture",
            private: true,
            dependencies: { dep: "file:./dep" },
            scripts: { prepare: "touch prepared" },
        }),
    );
    if (lockfile) {
        Bun.spawnSync(["bun", "install", "--ignore-scripts"], { cwd: dir });
    }
    return dir;
}

function install(dir: string, remote: string | undefined) {
    return runHook("bun-install", "bun-install.sh", {
        project: dir,
        payload: { hook_event_name: "SessionStart" },
        env: { CLAUDE_CODE_REMOTE: remote },
    });
}

describe("bun-install", () => {
    test("installs in a remote session", () => {
        const dir = project(true);
        expect(existsSync(join(dir, "bun.lock"))).toBe(true);
        const result = install(dir, "true");
        expect(result.code).toBe(0);
        expect(existsSync(join(dir, "prepared"))).toBe(true);
    });

    test("skips a local session", () => {
        const dir = project(true);
        expect(install(dir, undefined).code).toBe(0);
        expect(existsSync(join(dir, "prepared"))).toBe(false);
    });

    test("skips a project without a Bun lockfile", () => {
        const dir = project(false);
        expect(install(dir, "true").code).toBe(0);
        expect(existsSync(join(dir, "prepared"))).toBe(false);
    });
});
