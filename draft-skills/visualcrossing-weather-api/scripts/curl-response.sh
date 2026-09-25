#!/usr/bin/env bash
# vim:set expandtab shiftwidth=4 filetype=bash:
# SPDX-License-Identifier: GPL-3.0-only

#
#
# ~chewygumxx/waybar-weather.git
# ::: :/scripts/curl-response.sh
#
#

set -euo pipefail

: "${OUTFILE:=./sample-response.json}"

if [[ ! -v VISUALCROSSING_APIKEY ]]; then
    pass_cli_cmd="pass-cli item view 'pass://pass-cli/api_visualcrossing/APIKEY'"

    printf "[INFO] %s\n" \
        "Environment variable not provided: VISUALCROSSING_APIKEY" \
        "Attempting default APIKEY resolution: \`$pass_cli_cmd\`"
    if VISUALCROSSING_APIKEY="$($pass_cli_cmd 2>&1)"; then :; else
        exit_code=$?
        printf "[FATAL] pass-cli exited with code %s:\n" "$exit_code"
        printf "%s\n" "$VISUALCROSSING_APIKEY"
        exit $exit_code
    fi
fi

printf "[INFO] %s\n" "Attempting request..."

curl \
    --get \
    --data-urlencode 'unitGroup=metric' \
    --data-urlencode 'contentType=json' \
    --data-urlencode 'iconSet=icons2' \
    --data-urlencode "key=$VISUALCROSSING_APIKEY" \
    'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Melbourne' | jq --indent 4 > "$OUTFILE"

printf "[NOTICE] %s\n" "Printed response to: $(realpath "$OUTFILE")"
