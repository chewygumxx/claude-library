#!/usr/bin/env sh
# vim:set expandtab shiftwidth=4 filetype=sh:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/claude-library.git
# ::: :/plugins/header-metadata/hooks/header-metadata.sh
#
#

# PreToolUse. Writes the house file header into each new file Claude creates,
# copied from the nearest headed file in the repository, in any repository
# whose files already carry one. SessionStart. Says so, in such repositories.

set -eu

# Exit Status
#     0  Always, short of an execution error; on Write, the header is added
#        through updatedInput and noted for Claude
#     1  Execution Error (non-blocking, user viewable)
#
# A repository opts in by already holding a file whose header carries the
# " ::: :/<path>" marker, so a user-wide install changes nothing elsewhere.
# Files that are git ignored, or that sync-header-metadata skips by the
# "-sync-header-metadata" attribute or its own defaults, are left alone.

command -v jq >/dev/null 2>&1 || {
    echo 'header-metadata: Command not found: jq' >&2
    exit 1
}
git --version >/dev/null 2>&1 || exit 0

# The markers as sync-header-metadata matches them, as POSIX ERE for git grep
# and awk, and as Oniguruma for jq.
MARKER=' ::: :/[^[:space:]]*[[:space:]]*$'

input=$(cat)
project=${CLAUDE_PROJECT_DIR:-${PWD}}
project=${project%/}

event=$(printf '%s' "${input}" | jq -r '.hook_event_name // empty')

if [ "${event}" = SessionStart ]; then
    git -C "${project}" grep -q -I -E "${MARKER}" 2>/dev/null || exit 0
    printf '%s' "This repository's files open with a house header, which the header-metadata hook writes into each file created with Write, copied from the nearest headed file: leave it out of new files and keep it intact in existing ones."
    # Only where Markdown is headed, so the sentence costs nothing elsewhere.
    if git -C "${project}" grep -q -I -E "${MARKER}" -- '*.md' 2>/dev/null; then
        printf ' %s' "In Markdown it adds the ctime, mtime and spdx front matter keys, the box beneath and the closing modeline; write the other keys, such as title, description and tags, yourself."
    fi
    printf ' %s\n' "After moving or renaming files, \`bunx sync-header-metadata --update\` corrects their headers' paths."
    exit 0
fi

file=$(printf '%s' "${input}" | jq -r '.tool_input.file_path // empty')
case ${file} in
"${project}"/*) ;;
*) exit 0 ;;
esac

dir=${file%/*}
while [ ! -d "${dir}" ]; do
    dir=${dir%/*}
done
root=$(git -C "${dir}" rev-parse --show-toplevel 2>/dev/null) || exit 0
case ${file} in
"${root}"/*) ;;
*) exit 0 ;;
esac
path=${file#"${root}"}
rel=${path#/}
base=${rel##*/}

# The path marker cannot hold whitespace, as sync-header-metadata matches it,
# and should not hold "." or ".." segments.
case ${rel} in
*[[:space:]]* | ./* | ../* | */./* | */../*) exit 0 ;;
*) ;;
esac
! git -C "${root}" check-ignore -q -- "${rel}" || exit 0

# The repository's own attribute, then sync-header-metadata's bundled
# exclusions, which it overrides.
case $(git -C "${root}" check-attr sync-header-metadata -- "${rel}") in
*': unset') exit 0 ;;
*': unspecified')
    case ${base} in
    LICENSE* | *.json | *.lock | *.min.js | *.min.css | .keep | go.sum | pnpm-lock.yaml)
        exit 0
        ;;
    *) ;;
    esac
    [ "${rel}" != .github/pull_request_template.md ] || exit 0
    ;;
*) ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf "${tmp}"' EXIT
printf '%s' "${input}" >"${tmp}/input"

# Every headed file in the repository, as "path<TAB>line<TAB>text"; none means
# the repository does not use the header. With -z, git separates the fields
# with NUL and leaves paths unquoted, so a path may hold ":" or any letter.
git -C "${root}" grep -z -n -I -E "${MARKER}" 2>/dev/null |
    tr '\0' '\t' >"${tmp}/marked"
[ -s "${tmp}/marked" ] || exit 0

slug=$(git -C "${root}" remote get-url origin 2>/dev/null |
    sed -E -n 's#/$##; s#\.git$##; s#^([a-z+]+://[^/]+/|[^@/]+@[^:]+:)([^[:space:]]+/[^/[:space:]]+)$#\2#p') ||
    slug=''

# Rewrites the "~owner/repo.git" and " ::: :/<path>" lines, the first of each,
# as sync-header-metadata does, keeping whatever leads them.
# shellcheck disable=SC2016 # jq, not shell, variables
JQ_DEFS='
def markers($slug; $path):
    (map(test("~\\S+/\\S+?\\.git\\s*$")) | index(true)) as $r
    | (map(test(" ::: :/\\S*\\s*$")) | index(true)) as $p
    | if $r != null and $slug != "" then
        .[$r] |= sub("~\\S+/\\S+?\\.git\\s*$"; "~\($slug).git")
      else . end
    | if $p != null then .[$p] |= sub(" ::: :/\\S*\\s*$"; " ::: :\($path)")
      else . end;
def respond($content; $note):
    {hookSpecificOutput: {
        hookEventName: "PreToolUse",
        updatedInput: (.tool_input | .content = $content),
        additionalContext: $note
    }};
'

# Content that already holds a header, written by hand or copied from
# another file, only has its markers corrected.
if jq -e '.tool_input.content // "" | split("\n")[:40]
    | any(test(" ::: :/\\S*\\s*$"))' "${tmp}/input" >/dev/null; then
    jq --arg slug "${slug}" --arg path "${path}" --arg rel "${rel}" "${JQ_DEFS}"'
        (.tool_input.content | split("\n")) as $lines
        | ($lines | markers($slug; $path)) as $fixed
        | if $fixed == $lines then empty else
            respond($fixed | join("\n");
                "header-metadata corrected the header markers of \($rel) to its repository and path.")
          end' "${tmp}/input"
    exit
fi

# The comment leader of the header's banner lines, and the filetype for its
# modeline, for borrowing a header from a file of another type.
suffixes='' rest=${base#?}
while case ${rest} in *.*) true ;; *) false ;; esac do
    rest=${rest#*.}
    suffixes="${suffixes} ${rest}"
done
key=${base#.}
[ -z "${suffixes}" ] || key=${base##*.}
filetype=${key}
case ${key} in
bash | cfg | cmake | conf | fish | ini | ksh | mount | nix | path | pl | py | r | rb | \
    service | sh | socket | target | tf | timer | toml | yaml | yml | zsh | \
    chezmoiignore | dockerignore | editorconfig | env | gitattributes | gitignore | \
    npmrc | prettierignore | shellcheckrc | worktreeinclude | \
    Dockerfile | Justfile | Makefile | justfile)
    leader='#'
    ;;
c | cc | cjs | cpp | cts | dart | go | h | hpp | java | js | json5 | jsonc | jsx | \
    kt | less | mjs | mts | proto | rs | scala | scss | swift | ts | tsx | zig)
    leader='//'
    ;;
elm | hs | lua | luacheckrc | sql) leader='--' ;;
clj | el | lisp | rkt | scm) leader=';' ;;
erl | sty | tex) leader='%' ;;
vim | vimrc) leader='"' ;;
htm | html | markdown | md | svg | vue | xml) leader='   -' ;;
*) leader='' ;;
esac
case ${key} in
cjs | js | mjs) filetype=javascript ;;
cts | mts | ts) filetype=typescript ;;
jsx) filetype=javascriptreact ;;
tsx) filetype=typescriptreact ;;
md) filetype=markdown ;;
py) filetype=python ;;
rb) filetype=ruby ;;
rs) filetype=rust ;;
yml) filetype=yaml ;;
mount | path | service | socket | target | timer) filetype=systemd ;;
Makefile) filetype='make' ;;
*) ;;
esac
# An extensionless script, such as a git hook, goes by its shebang.
shebang=$(jq -r '.tool_input.content // "" | split("\n")[0] // ""
    | select(startswith("#!"))' "${tmp}/input")
if [ -z "${leader}" ] && [ -n "${shebang}" ]; then
    leader='#'
    filetype=${shebang##*[/ ]}
fi

# Candidate source files, best first: a file of the same type, matching the
# longest suffix first, or by name when there is none; then a file whose
# banner has the same comment leader. Within each, the nearest by shared
# directories, then the shallowest.
awk -v rel="${rel}" -v base="${base}" -v suffixes="${suffixes}" -v leader="${leader}" '
    function dirs(p, out) { n = split(p, out, "/"); return n - 1 }
    BEGIN {
        ns = split(suffixes, suffix, " ")
        td = dirs(rel, t)
    }
    {
        p = index($0, "\t"); file = substr($0, 1, p - 1)
        rest = substr($0, p + 1); q = index(rest, "\t")
        line = substr(rest, 1, q - 1) + 0; text = substr(rest, q + 1)
        if (line > 40 || file == rel || seen[file]++) next
        cd = dirs(file, c); name = c[cd + 1]
        for (shared = 0; shared < td && shared < cd && t[shared + 1] == c[shared + 1]; shared++);
        tier = -1
        for (i = 1; i <= ns && tier < 0; i++) {
            s = "." suffix[i]
            if (length(name) > length(s) &&
                substr(name, length(name) - length(s) + 1) == s) tier = i
        }
        # An extensionless file matches one of the same name, then any
        # extensionless file beside it, such as a zsh autoload function.
        if (ns == 0 && name == base) tier = 0
        if (ns == 0 && tier < 0 && cd == td && shared == td && name !~ /.\./)
            tier = 1
        if (tier < 0 && leader != "") {
            lead = substr(text, 1, index(text, " ::: :") - 1)
            sub(/[[:space:]]+$/, "", lead)
            if (lead == leader) tier = (ns ? ns : 1) + 1
        }
        if (tier < 0) next
        printf "%d\t%d\t%d\t%s\t%s\n", tier, -shared, cd,
            (tier > (ns ? ns : 1) ? "leader" : "type"), file
    }
' "${tmp}/marked" | sort -t "$(printf '\t')" -k1,1n -k2,2n -k3,3n -k5 |
    head -n 5 | cut -f 4,5 >"${tmp}/candidates"

# A file being overwritten keeps its own header, ahead of any candidate.
if [ -f "${file}" ]; then
    printf 'type\t%s\n' "${rel}" | cat - "${tmp}/candidates" >"${tmp}/ordered"
else
    mv "${tmp}/candidates" "${tmp}/ordered"
fi

# Prints a file's header: from its first line, or past Markdown front matter,
# or in it from a __cgxx key, to the two comment-only lines closing the banner
# after the path marker. Fails when the marker is not within the first 40
# lines.
extract() {
    awk -v re="${MARKER}" '
        NR > 40 && !marked { exit }
        NR == 1 && $0 == "---" { fm = 1; next }
        fm && !started {
            if ($0 ~ /^__cgxx:/) started = 1
            else {
                if ($0 == "---") fm = 0
                next
            }
        }
        marked && ($0 !~ /^[[:space:]]*[-#\/;*!<>%"]+[[:space:]]*$/ || closing++ == 2) {
            exit
        }
        { lines[++n] = $0 }
        $0 ~ re { marked = 1 }
        END {
            if (!marked) exit 1
            for (i = 1; i <= n; i++) print lines[i]
            exit 0
        }
    ' "$1"
}

source='' kind='' style=plain
while IFS="$(printf '\t')" read -r kind candidate; do
    [ -f "${root}/${candidate}" ] || continue
    if extract "${root}/${candidate}" >"${tmp}/header"; then
        source=${candidate}
        IFS= read -r first <"${root}/${candidate}" || true
        [ "${first}" != --- ] || style=frontmatter
        break
    fi
done <"${tmp}/ordered"
[ -n "${source}" ] || exit 0
markdown=false
case ${key} in
markdown | md) markdown=true ;;
*) ;;
esac
# A header in front matter suits only Markdown.
[ "${style}" = plain ] || [ "${markdown}" = true ] || exit 0
today=$(date +%Y-%m-%d)

jq --rawfile header "${tmp}/header" --rawfile src "${root}/${source}" \
    --arg slug "${slug}" --arg path "${path}" --arg today "${today}" \
    --arg rel "${rel}" --arg source "${source}" --arg kind "${kind}" \
    --argjson markdown "${markdown}" --arg filetype "${filetype}" "${JQ_DEFS}"'
    def bang: (.[0] // "") | startswith("#!");
    def leading_blanks: ((map(. != "") | index(true)) // length) as $i | .[$i:];
    def trim_blanks: leading_blanks | reverse | leading_blanks | reverse;

    # Markdown splits the header in three: ctime, mtime and spdx keys in the
    # front matter, the banner as an HTML comment box beneath it, and the
    # modeline on the last line. Each is read from the source in whichever
    # shape it has, so a __cgxx header or a file of another type serves too.
    def markdown_header:
        ($src | split("\n")) as $s
        | $s[:40] as $top
        | ([($top + $s[-5:])[]
            | capture("(?<m>vim:set [^>]*?:)(?:\\s*-->)?\\s*$") | .m]
           | first
           | if . != null and $kind != "type"
             then sub("filetype=[^ :]+"; "filetype=markdown") else . end)
          as $modeline
        | ([$top[] | (capture("^spdx:\\s*(?<v>\\S+)\\s*$"),
                      capture("SPDX-License-Identifier:\\s*(?<v>[^\\s>]+)"))
            | .v] | first) as $spdx
        | ([$top[] | capture("^ctime:\\s*(?<v>\\S+)\\s*$") | .v] | first)
          as $ctime
        | ($top | map(test(" ::: :/")) | index(true)) as $p
        | ([range(0; $p + 1) | select($top[.] | startswith("<!--"))] | last)
          as $a
        | ([range($p; $top | length) | select($top[.] | test("-->"))] | first)
          as $z
        | (if $a != null and $z != null then $top[$a:$z + 1]
           else ["<!--", "   -"]
             + ([$top[] | capture("(?<r>~\\S+/\\S+?\\.git)\\s*$")
                 | "   - \(.r)"] | .[:1])
             + ["   - ::: :/", "   -", "   -->"]
           end | markers($slug; $path)) as $box
        | (.tool_input.content // "" | split("\n")) as $lines
        | (if $lines[0] == "---" then $lines[1:] | index(["---"]) else null end)
          as $c
        | (if $c != null then $lines[1:$c + 1] else [] end) as $fm
        | (if $c != null then $lines[$c + 2:] else $lines end | trim_blanks)
          as $body
        | ($fm | map(select(test("^(ctime|mtime|spdx):")))) as $own
        | def own($k): [$own[] | select(startswith("\($k):"))] | first;
        # A file being overwritten keeps its own ctime.
          ["---",
           own("ctime") // "ctime: \(if $source == $rel and $ctime != null
                                   then $ctime else $today end)",
           own("mtime") // "mtime: \($today)"]
          + ([own("spdx") // (if $spdx != null then "spdx: \($spdx)"
                              else empty end)])
          + ($fm | map(select(test("^(ctime|mtime|spdx):") | not)))
          + ["---", ""] + $box + [""] + $body
          + (if $modeline == null
                or ($body | last // "" | test("^<!--.*vim:set .*-->$"))
             then []
             else [""] + ["<!-- \($modeline) -->"] end)
          | trim_blanks + [""];

    . as $in
    | ($header | rtrimstr("\n") | split("\n") | markers($slug; $path)) as $h
    # From a file of another type, keep only the modeline, with this
    # filetype, the licence and the banner.
    | (if $kind == "type" then $h else
        ($h | map(test(" ::: :/")) | index(true)) as $p
        | ([range(0; $p) | select($h[.] == "")] | last // -1) as $b
        | [$h[] | select(test("vim:set "))
            | sub("filetype=[^ :]+"; "filetype=\($filetype)")]
          + [$h[] | select(test("SPDX-License-Identifier:"))]
          + [""] + $h[$b + 1:]
      end) as $h
    | (.tool_input.content // "" | split("\n")) as $lines
    | if $markdown then markdown_header
      else
        # The content keeps its shebang; otherwise it takes the source s.
        (if ($lines | bang) then $lines[:1]
         elif ($h | bang) and $kind == "type" then $h[:1]
         else [] end) as $shebang
        | (if ($h | bang) then $h[1:] else $h end) as $h
        | (if ($lines | bang) then $lines[1:] else $lines end) as $body
        # Markdown front matter stays first, ahead of the header.
        | (if $body[0] == "---" then
            (($body[1:] | index(["---"])) // -1) + 2
           else 0 end) as $fm
        | ($body[$fm:] | leading_blanks) as $rest
        | $shebang + $body[:$fm] + (if $fm > 0 then [""] else [] end) + $h
          + [""] + $rest
      end
    | join("\n") as $content
    | $in | respond($content;
        if $markdown then
            "header-metadata added the file header to \($rel), copied from \($source): ctime, mtime and spdx in its front matter, the box beneath it and the modeline on its last line; read the file before editing its first or last lines."
        else
            "header-metadata added the file header to \($rel), copied from \($source); read the file before editing its first lines."
        end)
' "${tmp}/input"
