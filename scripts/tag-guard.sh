#!/usr/bin/env bash
# Refuses a release tag that is not bare semver or whose commit is not on main.
# Needs full history (checkout fetch-depth: 0) for the ancestry check.
set -euo pipefail

tag="${1:?usage: tag-guard.sh <tag>}"

if ! [[ "$tag" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "::error::tags are bare semver (1.2.3), not v1.2.3; got '${tag}'"
  exit 1
fi

git fetch --no-tags origin +refs/heads/main:refs/remotes/origin/main
sha="$(git rev-list -n1 "refs/tags/${tag}")"
if ! git merge-base --is-ancestor "$sha" origin/main; then
  echo "::error::release tag ${tag} is not on main (${sha})"
  exit 1
fi

echo "tag ${tag} is bare semver and on main (${sha})"
