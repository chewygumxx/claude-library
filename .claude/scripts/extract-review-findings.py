#!/usr/bin/env python3
# vim:set expandtab shiftwidth=4 filetype=python:
# SPDX-License-Identifier: GPL-3.0-only
#
# ~chewygumxx/claude-library.git
# ::: :/.claude/scripts/extract-review-findings.py
#
"""Extract ReportFindings payloads from Claude Code session transcripts.

A /code-review run reports its results by calling the ReportFindings tool. That
call is recorded in the session transcript as an assistant tool_use block, which
means a finished review stays recoverable after the session that produced it has
ended. This script finds those calls and emits the findings as normalised JSON
so a later session can file them onto the task list.

Two traps in the transcript format, both found by running this against real
history rather than by reading the schema:

The literal string "ReportFindings" appears in essentially every transcript,
because the tool schema is part of the system prompt. Substring matching
therefore reports a hit on every session that merely had the tool available.
This script only ever counts a parsed tool_use block whose name is exactly
ReportFindings, which is the difference between 55 real payloads and several
hundred phantom ones.

Rejected calls are recorded too. ReportFindings caps short_summary at 60
characters, and a review that overshoots it gets an InputValidationError and
retries. Both the rejected call and the accepted retry sit in the transcript
looking alike, roughly 20 seconds apart with similar finding counts. Taking the
newest without checking would hand over a payload the harness refused. So every
candidate is correlated with its tool_result by tool_use id, and anything that
errored is discarded.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

# The seven keys a ReportFindings entry carries. Ordered as they are most useful
# to read. Absent optional keys are normalised to None so consumers can rely on
# the shape without guarding every access.
FINDING_KEYS = (
    "file",
    "line",
    "category",
    "verdict",
    "short_summary",
    "summary",
    "failure_scenario",
    "outcome",
)


def config_dir() -> Path:
    """Claude Code's config root, honouring an XDG-style relocation."""
    env = os.environ.get("CLAUDE_CONFIG_DIR")
    if env:
        return Path(env)
    return Path.home() / ".claude"


def mangle(path: str) -> str:
    """Render a filesystem path the way Claude Code names its transcript dir."""
    return re.sub(r"[^a-zA-Z0-9]", "-", path)


def candidate_dirs(projects: Path, explicit: str | None, any_project: bool) -> list[Path]:
    """Transcript directories to scan, most specific first.

    A single working directory can own more than one transcript directory: an
    older path-mangled form such as -home-chewygum-dev-claude-library, and a
    newer slug form such as chewygumxx_claude-library named by
    CLAUDE_CODE_PROJECT_DIR_NAME. Both are checked, because a review may live in
    either.
    """
    if any_project:
        return sorted(p for p in projects.iterdir() if p.is_dir())

    if explicit:
        return [projects / explicit]

    found: list[Path] = []
    slug = os.environ.get("CLAUDE_CODE_PROJECT_DIR_NAME")
    if slug:
        found.append(projects / slug)
    found.append(projects / mangle(str(Path.cwd())))

    seen: set[Path] = set()
    out: list[Path] = []
    for p in found:
        if p not in seen and p.is_dir():
            seen.add(p)
            out.append(p)
    return out


def normalise(raw: dict) -> dict:
    """Project a raw finding onto FINDING_KEYS, dropping unknown extras."""
    return {k: raw.get(k) for k in FINDING_KEYS}


def payloads_in(transcript: Path, keep_rejected: bool = False) -> list[dict]:
    """Every accepted ReportFindings call in one transcript, in file order.

    Walks the whole file collecting candidate tool_use blocks and the ids of any
    tool_result that came back an error, then discards candidates whose result
    errored. The ordering works out because a result always follows its call.
    """
    candidates: list[dict] = []
    rejected: set[str] = set()

    try:
        handle = transcript.open(encoding="utf-8", errors="replace")
    except OSError as exc:
        print(f"warning: cannot read {transcript}: {exc}", file=sys.stderr)
        return []

    with handle:
        for line in handle:
            # Cheap reject before the expensive parse. A real tool_use block
            # always carries the quoted tool name, and a tool_result always
            # carries the is_error key when it failed.
            interesting = '"ReportFindings"' in line or '"is_error":true' in line
            if not interesting:
                continue
            try:
                entry = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue

            content = entry.get("message", {}).get("content")
            if not isinstance(content, list):
                continue

            for block in content:
                if not isinstance(block, dict):
                    continue

                if block.get("type") == "tool_result":
                    if block.get("is_error"):
                        tool_id = block.get("tool_use_id")
                        if isinstance(tool_id, str):
                            rejected.add(tool_id)
                    continue

                if block.get("type") != "tool_use" or block.get("name") != "ReportFindings":
                    continue

                payload = block.get("input") or {}
                findings = payload.get("findings")
                if not isinstance(findings, list):
                    continue

                candidates.append(
                    {
                        "session_id": entry.get("sessionId") or transcript.stem,
                        "timestamp": entry.get("timestamp"),
                        "transcript": str(transcript),
                        "tool_use_id": block.get("id"),
                        "level": payload.get("level"),
                        "count": len(findings),
                        "findings": [normalise(f) for f in findings if isinstance(f, dict)],
                    }
                )

    if keep_rejected:
        for candidate in candidates:
            candidate["rejected"] = candidate.get("tool_use_id") in rejected
        return candidates

    return [c for c in candidates if c.get("tool_use_id") not in rejected]


def sort_key(payload: dict) -> tuple[int, str]:
    """Newest last. Payloads without a timestamp sort before those with one."""
    stamp = payload.get("timestamp")
    if isinstance(stamp, str) and stamp:
        return (1, stamp)
    return (0, "")


def collect(dirs: list[Path], session: str | None, keep_rejected: bool = False) -> list[dict]:
    found: list[dict] = []
    for directory in dirs:
        for transcript in sorted(directory.glob("*.jsonl")):
            if session and session not in transcript.stem:
                continue
            found.extend(payloads_in(transcript, keep_rejected=keep_rejected))
    found.sort(key=sort_key)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract ReportFindings payloads from Claude Code transcripts.",
    )
    parser.add_argument(
        "--session",
        metavar="ID",
        help="only consider transcripts whose filename contains this session id",
    )
    parser.add_argument(
        "--project-dir",
        metavar="NAME",
        help="scan this transcript directory under projects/ instead of guessing",
    )
    parser.add_argument(
        "--any-project",
        action="store_true",
        help="scan every project rather than just the current working directory",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="emit every payload found as a JSON array, not just the newest",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="summarise payloads one per line without their bodies",
    )
    parser.add_argument(
        "--keep-rejected",
        action="store_true",
        help="include calls the harness rejected, flagged with \"rejected\": true (diagnostic)",
    )
    args = parser.parse_args()

    projects = config_dir() / "projects"
    if not projects.is_dir():
        print(f"error: no transcript directory at {projects}", file=sys.stderr)
        return 2

    dirs = candidate_dirs(projects, args.project_dir, args.any_project)
    if not dirs:
        print(
            "error: no transcript directory matched this working directory; "
            "pass --project-dir or --any-project",
            file=sys.stderr,
        )
        return 2

    found = collect(dirs, args.session, keep_rejected=args.keep_rejected)
    if not found:
        scope = args.session or ", ".join(d.name for d in dirs)
        print(f"error: no accepted ReportFindings payload found in {scope}", file=sys.stderr)
        return 1

    if args.list:
        for payload in found:
            flag = " REJECTED" if payload.get("rejected") else ""
            print(
                f"{payload['timestamp'] or '(undated)'}  "
                f"{payload['session_id']}  "
                f"{payload['count']} finding(s)  "
                f"level={payload['level'] or '-'}{flag}"
            )
        print(f"\n{len(found)} payload(s) across {len(dirs)} project dir(s)", file=sys.stderr)
        return 0

    json.dump(found if args.all else found[-1], sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
