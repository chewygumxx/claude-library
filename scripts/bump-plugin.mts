// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/scripts/bump-plugin.mts
//
//

// Bumps a plugin's version in its manifest, editing only the version string
// so the rest of the file keeps its layout. A plugin's version is how an
// installed copy notices a change, so any change in behaviour bumps it.
//
//     bun run bump <plugin> [patch|minor|major]

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PARTS = ["major", "minor", "patch"] as const;
type Part = (typeof PARTS)[number];

function fail(message: string): never {
    console.error(`bump: ${message}`);
    process.exit(1);
}

const [plugin, part = "patch"] = process.argv.slice(2);
if (!plugin || process.argv.length > 4) {
    fail("Usage: bun run bump <plugin> [patch|minor|major]");
}
if (!PARTS.includes(part as Part)) {
    fail(`Part must be patch, minor or major: ${part}`);
}

const path = join("plugins", plugin, ".claude-plugin", "plugin.json");
const manifest = await readFile(path, "utf8").catch(() =>
    fail(`No plugin manifest: ${path}`),
);

const VERSION = /^( {4}"version": ")(\d+)\.(\d+)\.(\d+)(",?)$/m;
const match = manifest.match(VERSION);
if (!match) {
    fail(`${path}: No top-level "version": "X.Y.Z" line.`);
}

const [major, minor, patch] = match.slice(2, 5).map(Number) as [
    number,
    number,
    number,
];
const next = {
    major: `${major + 1}.0.0`,
    minor: `${major}.${minor + 1}.0`,
    patch: `${major}.${minor}.${patch + 1}`,
}[part as Part];

await writeFile(path, manifest.replace(VERSION, `$1${next}$5`));
console.log(`${plugin}: ${major}.${minor}.${patch} -> ${next}`);
