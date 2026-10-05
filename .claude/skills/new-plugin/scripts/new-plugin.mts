// vim:set expandtab shiftwidth=4 filetype=typescript:
// SPDX-License-Identifier: GPL-3.0-only

//
//
// ~chewygumxx/claude-library.git
// ::: :/.claude/skills/new-plugin/scripts/new-plugin.mts
//
//

// Scaffolds a hook plugin under plugins/ and registers it in the marketplace,
// the commitlint scopes and the project settings, so Claude writes only the
// hook logic and prose. Run from the repository root:
//
//     bun .claude/skills/new-plugin/scripts/new-plugin.mts --name <name> ...
//
// --help lists the options.

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";

const USAGE = `Usage: bun .claude/skills/new-plugin/scripts/new-plugin.mts [options]

Required:
  --name <kebab-case>        Plugin name, also its commitlint scope
  --description <sentence>   One sentence on what the plugin does
  --scope <text>             Commitlint scope description, "Plugin: ..."
  --event <HookEvent>        Hook event, such as PreToolUse or SessionStart

Optional:
  --matcher <regex>          Tool name matcher, such as "Write|Edit"
  --if <rule>                Permission rule filter, such as "Bash(git *)"
  --shell <sh|bash>          Hook script shell (default: sh)
  --timeout <seconds>        Hook timeout (default: 10)
  --keyword <word>           Extra keyword and README tag; repeatable
  --display-name <text>      Display name (default: title-cased name)
  --disabled                 Set defaultEnabled to false
  --help                     Show this message`;

// The local date, as toISOString() gives UTC's: a day behind east of
// Greenwich until UTC's midnight.
const TODAY = new Date().toLocaleDateString("sv-SE");
const WIDTH = 80;

const { values: options } = parseArgs({
    options: {
        name: { type: "string" },
        description: { type: "string" },
        scope: { type: "string" },
        event: { type: "string" },
        matcher: { type: "string" },
        if: { type: "string" },
        shell: { type: "string", default: "sh" },
        timeout: { type: "string", default: "10" },
        keyword: { type: "string", multiple: true, default: [] },
        "display-name": { type: "string" },
        disabled: { type: "boolean", default: false },
        help: { type: "boolean", default: false },
    },
    strict: true,
});

if (options.help) {
    console.log(USAGE);
    process.exit(0);
}

function fail(message: string): never {
    console.error(`new-plugin: ${message}`);
    process.exit(1);
}

const { name, description, scope, event } = options;
if (!name || !description || !scope || !event) {
    fail(
        `--name, --description, --scope and --event are required.\n\n${USAGE}`,
    );
}
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    fail(`Name must be kebab-case: ${name}`);
}
if (options.shell !== "sh" && options.shell !== "bash") {
    fail(`Shell must be sh or bash: ${options.shell}`);
}
const timeout = Number(options.timeout);
if (!Number.isInteger(timeout) || timeout < 1) {
    fail(`Timeout must be a positive integer: ${options.timeout}`);
}
if (!existsSync(".claude-plugin/marketplace.json")) {
    fail("Run from the repository root.");
}

const pluginDirectory = join("plugins", name);
if (existsSync(pluginDirectory)) {
    fail(`Already exists: ${pluginDirectory}`);
}

const shell = options.shell;
const displayName =
    options["display-name"] ??
    name
        .split("-")
        .map((word) => word[0]?.toUpperCase() + word.slice(1))
        .join(" ");
const keywords = ["hooks", ...options.keyword];

// The repository and its owner, from package.json and the marketplace.
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const marketplace = JSON.parse(
    await readFile(".claude-plugin/marketplace.json", "utf8"),
);
const slug = String(packageJson.repository.url).match(
    /github\.com[/:](.+?\/.+?)(\.git)?$/,
)?.[1];
if (!slug) {
    fail("No GitHub repository in package.json.");
}

// Greedily wraps text to the width, after the prefix on each line.
function wrap(text: string, prefix = ""): string {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
        if (line && prefix.length + line.length + 1 + word.length > WIDTH) {
            lines.push(prefix + line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    lines.push(prefix + line);
    return lines.join("\n");
}

// The house file header, each line led by the comment prefix. The header
// sync in CI reads only a file's first path marker, its own header's, so the
// markers here are safe.
function banner(path: string, prefix: string, modeline: string) {
    return [
        `vim:set ${modeline}:`,
        `SPDX-License-Identifier: ${packageJson.license}`,
        null,
        "",
        "",
        `~${slug}.git`,
        `::: :/${path}`,
        "",
        "",
    ]
        .map((line) =>
            line === null ? "" : `${prefix}${line ? ` ${line}` : ""}`,
        )
        .join("\n");
}

// Markdown's form of the banner: an HTML comment beneath the front matter,
// whose dashes align under the "!" of "<!--". The modeline and licence move
// to the last line and the front matter.
function box(path: string) {
    return [
        "<!--",
        "   -",
        `   - ~${slug}.git`,
        `   - ::: :/${path}`,
        "   -",
        "   -->",
    ].join("\n");
}

// Reads a template, drops its own leading comment block, and fills it.
async function render(template: string, fields: Record<string, string>) {
    const path = join(import.meta.dir, "..", "templates", template);
    const lines = (await readFile(path, "utf8")).split("\n");
    const start = lines.findIndex(
        (line) => !(line === "" || line === "#" || line.startsWith("# ")),
    );
    return lines
        .slice(start)
        .join("\n")
        .replace(/\{\{(\w+)\}\}/g, (_, field: string) => {
            const value = fields[field];
            if (value === undefined) {
                fail(`${template}: No value for {{${field}}}`);
            }
            return value;
        });
}

async function write(path: string, content: string) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    console.log(`Created ${path}`);
}

async function editJson<T>(path: string, edit: (json: T) => void) {
    const json: T = JSON.parse(await readFile(path, "utf8"));
    edit(json);
    await writeFile(path, `${JSON.stringify(json, null, 4)}\n`);
    console.log(`Updated ${path}`);
}

// plugins/<name>/.claude-plugin/plugin.json
await write(
    join(pluginDirectory, ".claude-plugin", "plugin.json"),
    `${JSON.stringify(
        {
            $schema:
                "https://json.schemastore.org/claude-code-plugin-manifest.json",
            name,
            version: "0.0.1",
            displayName,
            description,
            author: marketplace.owner,
            homepage: `https://github.com/${slug}/tree/main/${pluginDirectory}`,
            license: packageJson.license,
            keywords,
            defaultEnabled: !options.disabled,
            hooks: "./hooks/hooks.json",
        },
        null,
        4,
    )}\n`,
);

// plugins/<name>/hooks/hooks.json
const handler: Record<string, unknown> = { type: "command" };
if (options.if) {
    handler.if = options.if;
}
Object.assign(handler, {
    command: shell,
    args: [`\${CLAUDE_PLUGIN_ROOT}/hooks/${name}.sh`],
    timeout,
});
const group: Record<string, unknown> = {};
if (options.matcher) {
    group.matcher = options.matcher;
}
group.hooks = [handler];
await write(
    join(pluginDirectory, "hooks", "hooks.json"),
    `${JSON.stringify({ hooks: { [event]: [group] } }, null, 4)}\n`,
);

// plugins/<name>/hooks/<name>.sh
const scriptPath = join(pluginDirectory, "hooks", `${name}.sh`);
await write(
    scriptPath,
    await render("hook.sh.tmpl", {
        shell,
        banner: banner(
            scriptPath,
            "#",
            `expandtab shiftwidth=4 filetype=${shell}`,
        ),
        summary: wrap(`${event}. ${description}`, "# "),
        strictMode: shell === "bash" ? "set -euo pipefail" : "set -eu",
    }),
);

// plugins/<name>/README.md
const readmePath = join(pluginDirectory, "README.md");
await write(
    readmePath,
    await render("README.md.tmpl", {
        box: box(readmePath),
        modeline:
            "<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->",
        spdx: packageJson.license,
        date: TODAY,
        displayName,
        descriptionFolded: wrap(description, "  "),
        descriptionWrapped: wrap(description),
        tags: keywords.map((keyword) => `  - ${keyword}`).join("\n"),
    }),
);

// The marketplace lists plugins by name.
type Marketplace = { plugins: { name: string; source: string }[] };
await editJson<Marketplace>(".claude-plugin/marketplace.json", (json) => {
    json.plugins.push({ name, source: `./${pluginDirectory}` });
    json.plugins.sort((a, b) => a.name.localeCompare(b.name));
});

// The project enables it, from this repository's marketplace.
type Settings = { enabledPlugins: Record<string, boolean> };
await editJson<Settings>(".claude/settings.json", (json) => {
    json.enabledPlugins[`${name}@${marketplace.name}`] = true;
});

// The commitlint scope, among the plugins by name.
const commitlintPath = ".commitlintrc.mts";
const commitlint = await readFile(commitlintPath, "utf8");
const entry = `        {
            name: ${JSON.stringify(name)},
            fullName: ${JSON.stringify(displayName)},
            description: ${JSON.stringify(scope)},
        },
`;
const entries = [...commitlint.matchAll(/^ {8}\{\n {12}name: "([^"]+)"/gm)];
const next = entries.find((match) => (match[1] ?? "") > name);
const insertAt = next?.index ?? commitlint.indexOf("    ],\n});");
if (insertAt < 0) {
    fail(`${commitlintPath}: No scopes array found.`);
}
await writeFile(
    commitlintPath,
    commitlint.slice(0, insertAt) + entry + commitlint.slice(insertAt),
);
console.log(`Updated ${commitlintPath}`);

// Biome settles the layout JSON.stringify cannot, such as short arrays on
// one line.
const formatted = Bun.spawnSync(
    [
        "bunx",
        "--bun",
        "--no-install",
        "biome",
        "format",
        "--write",
        pluginDirectory,
        ".claude-plugin/marketplace.json",
        ".claude/settings.json",
        commitlintPath,
    ],
    { stdout: "ignore", stderr: "inherit" },
);
if (formatted.exitCode !== 0) {
    fail("biome format failed.");
}
