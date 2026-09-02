<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/initial_purpose.md
   -
   -->

<!--
   - Document that sporadically inscribes the initally intended purpose of this
   - directory for Claude Code configuration, experimentation, education and 
   - exploration as a dedicated repository.
   -->

# claude-library - Initial Purpose

This repository is intended as an exclusive dedicated space for learning and
understanding the myriad of functionality Claude Code offers and the
compilation of documentation regarding such for future reference ease.

## Current Understanding

### ~/.claude/

As I currently understand, the home directory `~/.claude/` is apparently the
intended repository for such however, given my current expertise, it is an
apparent mess of programmatically reformatted subdirectories refering to
other directories that contain data relevant to those paths I have employed
Claude. Per current configuration, files pertaining to other directories
are stored both under a dedicated `~/.claude/` subdirectory and locally to
aformentioned repository despite the given referred directory containing its
own `/.claude`. This is especially confusing when Claude stores MEMORY.md
files specific to the project repository within a `~/.claude/` subdirectory
with an unmistably resemblant name to the project directory instead of the
repository `/.claude/` instead.

As if generation of files into and 'directory-local' and 'user-wide'
directories were not enough, Claude seems to be XDG Desktop Specification
oblivious and will write files to `~` as if its 2008. While aware of
environment variables such as `CLAUDE_CONFIG_DIR`,
`CLAUDE_CODE_PROJECT_DIR_NAME`, `*_DEBUG_LOGS_DIR`, `MCP_*`,
`*_PLUGIN_CACHE_DIR`, et cetera, there are so many mediums of configuration
and so many settings available I'm rather hesitant to invest in tuning when
the herdr terminal multiplexer I've recently adopted remains stock.

### Universal Configuration

While a simple

```bash
export CLAUDE_CONFIG_DIR="$XDG_CONFIG_DIR/claude"
```

Would be progress, Claude seems the type to write the user's configuration
for them rather than reserving a `XDG_DATA_DIR` subdirectory to prepend/append
whatever the user manually edited. While I very typically appreciate such, the
hapazrd nature of its sourced files of recording current demands and context
reconnaissance lead me to conjecture Claude would populate the
`XDG_CONFIG_HOME` with files unrelated to user configuration, negating the
purpose of personally composed and navigably effortless dotfiles and instead
store content further reminiscent of the nature in which a Mozilla Firefox
volunteer implemented a decades long request, by simply moving `/.mozilla` to
`$XDG_CONFIG_DIR/mozilla`, with all of its databases, proprietary formats,
and other non-config data.

### Sheer Application Scope

The encyclopedia that is the reference documentation is as exciting as it seems
boundless. While it could be read within a night, the chance I'd forget it
without personal application renders the prospect questionable. It mentions
plugins, skills, sandboxing, hooks, channels et cetera, in which while I grasp
the concept surface, I'm oblivious to the cost/value of fabricating bespoke
devcontainers despite them solving all the aformentioned filesystem perplexity.
For now I'd like to learn basic utility, the extension from such, and what
external tooling may enhance.

## Immediate Objectives

- Learn basic and essential interface necessities beyond prompt and markdown
  "engineering". I burned through $40 worth of API tokens the first time I used
  Claude and I loved it. I didn't learn of `/compact` until after sitting
  through hours of wait time for usage reset. Commands seem the most obvious
  place to start. Intuitively, their employment would offer insight into later
  explicit configuration.

- I've dismissed 'skills', 'plugins', and now ubiquitous from its formerly
  acadmeic roots 'harness', agentic terms as little more than markdown
  pamphlets without actually investigating them further. They obviously must be
  of value and resolving a repository of them may be a start.

- External tooling to supplement Claude without needing to prompt for reverts,
  context provision, HTTP fetch, former conversation recollection, parallel
  reasoning, et cetera. I'm currently employing `herdr`, which seems rather
  decent without configuration but could clearly use some, especially with
  respect to keybinds. According to my very short experience Claude is rather
  boundary respecting with `git` for obvious reasons. Having Claude checkout
  and commit to their forked branches for later merge, reversion or reference
  would also be of great value.

## Conclusion

This repository very much is a project with no end purpose in mind. It's a
place where historic record of conversation may be kept for future perusal and
clarification. It's not even limited to learning about Claude. It's currently
learning what Claude may offer and where I may keep what I generally wish to
learn in consultation.
