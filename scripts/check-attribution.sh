#!/usr/bin/env bash
# Check that every commit in a revision range is authored by Angze Li and
# carries a Claude co-author trailer. Used by the `attribution` CI job and
# runnable locally:
#
#   scripts/check-attribution.sh origin/main..HEAD
#   scripts/check-attribution.sh <sha>          # a single commit
#
# Exit status is non-zero if any commit breaks the rule.
set -euo pipefail

range="${1:?usage: scripts/check-attribution.sh <rev-range | sha>}"
expected_name="Angze Li"
expected_email="162757881+angzeli@users.noreply.github.com"
trailer_re='^Co-Authored-By: Claude( [^<>]*)? <noreply@anthropic\.com>[[:space:]]*$'

if [[ "$range" == *..* ]]; then
  mapfile -t commits < <(git rev-list --reverse "$range")
else
  commits=("$(git rev-parse --verify "$range^{commit}")")
fi

if [[ ${#commits[@]} -eq 0 ]]; then
  echo "attribution: no commits in $range"
  exit 0
fi

failures=0
for sha in "${commits[@]}"; do
  name=$(git log -1 --format='%an' "$sha")
  email=$(git log -1 --format='%ae' "$sha")
  subject=$(git log -1 --format='%s' "$sha")
  problems=()
  if [[ "$name" != "$expected_name" || "$email" != "$expected_email" ]]; then
    problems+=("author is '$name <$email>'")
  fi
  if ! git log -1 --format='%B' "$sha" | grep -qiE "$trailer_re"; then
    problems+=("missing Claude co-author trailer")
  fi
  if [[ ${#problems[@]} -eq 0 ]]; then
    printf 'ok    %s  %s\n' "${sha:0:10}" "$subject"
  else
    failures=$((failures + 1))
    printf 'FAIL  %s  %s\n' "${sha:0:10}" "$subject"
    for p in "${problems[@]}"; do printf '        - %s\n' "$p"; done
  fi
done

echo
if [[ $failures -gt 0 ]]; then
  echo "attribution: $failures of ${#commits[@]} commit(s) break the rule."
  echo "Every commit must be authored by '$expected_name <$expected_email>'"
  echo "and end with 'Co-Authored-By: Claude <noreply@anthropic.com>' (any Claude model name is fine)."
  exit 1
fi
echo "attribution: all ${#commits[@]} commit(s) pass."
