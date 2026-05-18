#!/usr/bin/env bash
# Extract the changelog entry for a given version tag from CHANGELOG.md.
# Usage: bash scripts/extract-changelog.sh v1.0.0
# Outputs the content between the version header and the next ## header.
set -euo pipefail

TAG="${1:?Usage: extract-changelog.sh <tag>}"
# Strip leading 'v' to match "## [1.0.0]" format
VERSION="${TAG#v}"

awk "/^## \[${VERSION}\]/{found=1; next} found && /^## \[/{exit} found{print}" CHANGELOG.md
