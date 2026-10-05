---
ctime: 2026-09-27
mtime: 2026-10-05
spdx: GPL-3.0-only
title: Repository metadata
description: >-
  The reminder shown after .repo-metadata.jsonc is read: which GitHub settings
  CI applies from it, and why they are edited there.
tags:
  - llm
  - claude
---

<!--
   -
   - ~chewygumxx/claude-library.git
   - ::: :/plugins/repo-metadata/hooks/repo-metadata.md
   -
   -->

# `.repo-metadata.jsonc` is the GitHub settings page

CI applies this file to the GitHub repository on every push to `main`, through
`chewygumxx/sync-repo-metadata`. It applies `description`, `homepage`,
`topics`, `visibility`, `archived`, `is_template`, the `has_*` toggles,
`allow_forking`, the merge options and commit message defaults,
`web_commit_signoff_required` and `immutable_releases`. Other keys, such as
`license` and `default_branch`, are read by other tools and change nothing on
GitHub.

A key the file leaves out is left alone on GitHub. A key it sets is the setting:
changing it in the web interface, with `gh repo edit` or with `gh api`, is the
failure worth naming, since nothing rejects it and the next push silently
reverts it.

<!-- vim:set expandtab shiftwidth=2 filetype=markdown foldlevel=3: -->
