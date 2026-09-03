<!-- vim:set expandtab shiftwidth=2 filetype=markdown: -->
<!-- SPDX-License-Identifier: GPL-3.0-only -->

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/CLAUDE.md
   -
   -->

<!--
   - Everchanging repository-local Claude instruction document
   -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Please do not use absolutely any em dashes.

Keep as many of your files as local to this repository as you possibly can. This
repository is intended to be portable. None of your documentation is to be
ignored per `git` configuration.

You are permitted to utilise `git` with respect to this repository including
commits, remote pushes and pulls, branching et cetera. Thoroughly consider
invocations involving `reset` and `--force` are truly necessary. You have
permission to use them and are free to ask me if you're uncertain of my
appraisal of potentially lost assets.

When a task leaves uncommitted writes sitting in this repository at a
natural stopping point, ask whether they should be committed and pushed
rather than assuming either answer or leaving it unmentioned. Mid-task file
writes don't warrant asking every time, only checkpoints such as the end of
a task or before concluding a session.

Please suggest anything and everything you would consider helpful or valuable.
If I seem to dismiss it due to ignorance, lassitude or negligence you are
encouraged to repropose the initally dismissed offer.

The indeterminate details of the initial purpose of this repository are
inscribed in the aptly named `./initial_purpose.md` file.

## Current State

There is no source code, build system, linter, or test suite here. The
repository currently holds markdown documentation (this file,
`initial_purpose.md`, and `notes/`). Do not go looking for package manifests,
CI config, or a project scaffold, there isn't one yet. When work here does
start producing artifacts (scripts, configuration snippets, forked-branch
experiments), prefer adding them as plain files local to this repository over
writing them to `~/.claude/` or other locations outside the repo, per the
portability directive above.

## Notes

Historic conversation records and findings belong in `notes/`, one file per
session or topic, named `YYYY-MM-DD-short-topic-slug.md`. See
`notes/README.md` for the full convention before adding a file there.

## Purpose

Per `initial_purpose.md`, this repository exists as a dedicated space for the
user to learn Claude Code itself: commands, skills, plugins, hooks, agentic
concepts generally, and to keep a historic record of conversations and
findings for later reference. It has no fixed end goal. Treat requests here
as exploratory and educational rather than as feature work on a product, and
feel free to proactively document useful findings back into this repository
so they persist across sessions.
