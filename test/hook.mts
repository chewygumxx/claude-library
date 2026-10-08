// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/test/hook.mts
//
//

// Runs a plugin's hook script as its hooks.json declares it, against a
// payload, in a temporary project, so each test file reads as a list of
// cases.

import { afterEach } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

// The header's path marker, joined at run time: written out, it would read
// as this file's own marker to header-metadata and sync-header-metadata.
export const MARKER = [":::", ":/"].join(" ");

type Handler = { command: string; args?: string[] };
type HookGroup = { hooks: Handler[] };
type HooksFile = { hooks: Record<string, HookGroup[]> };

export type Result = {
    code: number;
    stdout: string;
    stderr: string;
    json: Record<string, unknown> | undefined;
};

const temporary: string[] = [];
afterEach(() => {
    for (const dir of temporary.splice(0)) {
        rmSync(dir, { recursive: true, force: true });
    }
});

// A directory removed after the test.
export function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "hook-test-"));
    temporary.push(dir);
    return dir;
}

// Git isolated from the user's configuration, whose global ignore file or
// hooks could hide a defect.
export function gitEnv(): Record<string, string> {
    return {
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        XDG_CONFIG_HOME: tempDir(),
        GIT_AUTHOR_NAME: "Test",
        GIT_AUTHOR_EMAIL: "test@example.com",
        GIT_COMMITTER_NAME: "Test",
        GIT_COMMITTER_EMAIL: "test@example.com",
    };
}

export function git(dir: string, ...args: string[]): string {
    const run = Bun.spawnSync(["git", "-C", dir, ...args], {
        env: { ...process.env, ...gitEnv() },
    });
    if (run.exitCode !== 0) {
        throw new Error(`git ${args.join(" ")}: ${run.stderr.toString()}`);
    }
    return run.stdout.toString();
}

// A temporary git repository holding the given files.
export function repo(files: Record<string, string> = {}): string {
    const dir = tempDir();
    git(dir, "init", "-q");
    for (const [path, content] of Object.entries(files)) {
        write(dir, path, content);
    }
    return dir;
}

export function write(dir: string, path: string, content: string): string {
    const file = join(dir, path);
    Bun.spawnSync(["mkdir", "-p", join(file, "..")]);
    writeFileSync(file, content);
    return file;
}

export function read(file: string): string {
    return readFileSync(file, "utf8");
}

// The interpreter hooks.json runs the script with, so a test catches a
// script that only works under another shell.
function interpreter(plugin: string, script: string): string {
    const hooks: HooksFile = JSON.parse(
        read(join(ROOT, "plugins", plugin, "hooks", "hooks.json")),
    );
    for (const groups of Object.values(hooks.hooks)) {
        for (const handler of groups.flatMap((group) => group.hooks)) {
            if (handler.args?.[0]?.endsWith(`/hooks/${script}`)) {
                return handler.command;
            }
        }
    }
    throw new Error(`${plugin}: No handler runs ${script}`);
}

export function runHook(
    plugin: string,
    script: string,
    options: {
        payload?: unknown;
        project?: string;
        env?: Record<string, string | undefined>;
        args?: string[];
    } = {},
): Result {
    const pluginRoot = join(ROOT, "plugins", plugin);
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries({
        ...process.env,
        ...gitEnv(),
        CLAUDE_PLUGIN_ROOT: pluginRoot,
        CLAUDE_PROJECT_DIR: options.project,
        ...options.env,
    })) {
        if (value !== undefined) {
            env[key] = value;
        }
    }
    const run = Bun.spawnSync(
        [
            interpreter(plugin, script),
            join(pluginRoot, "hooks", script),
            ...(options.args ?? []),
        ],
        {
            cwd: options.project ?? tempDir(),
            env,
            stdin:
                options.payload === undefined
                    ? "ignore"
                    : new TextEncoder().encode(JSON.stringify(options.payload)),
        },
    );
    const stdout = run.stdout.toString();
    let json: Result["json"];
    try {
        json = stdout.trim() ? JSON.parse(stdout) : undefined;
    } catch {
        json = undefined;
    }
    return { code: run.exitCode, stdout, stderr: run.stderr.toString(), json };
}

// Whether a tool runs, as the hooks test it: a mise shim is on PATH even
// where it has no version to run.
export function runs(...command: string[]): boolean {
    try {
        return (
            Bun.spawnSync(command, { stdout: "ignore", stderr: "ignore" })
                .exitCode === 0
        );
    } catch {
        return false;
    }
}
