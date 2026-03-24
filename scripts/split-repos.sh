#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GITHUB_USER="code2031"

declare -A REPOS=(
  ["validator"]="solclone-validator"
  ["web3js-sdk"]="solclone-web3js"
  ["program-library"]="solclone-programs"
  ["explorer"]="solclone-explorer"
  ["wallet-adapter"]="solclone-wallet-adapter"
  ["wallet-gui"]="solclone-backpack"
  ["dapp-scaffold"]="solclone-dapp-scaffold"
)

for dir in "${!REPOS[@]}"; do
  repo="${REPOS[$dir]}"
  echo "=== Pushing $dir → $repo ==="

  cd "$ROOT/$dir"

  # Init fresh git repo
  rm -rf .git
  git init
  git branch -m main
  git config user.email "${GITHUB_USER}@users.noreply.github.com"
  git config user.name "$GITHUB_USER"

  git add -A
  git commit -m "Initial commit: forked from upstream" --quiet
  git remote add origin "https://github.com/${GITHUB_USER}/${repo}.git"
  git push -u origin main --force 2>&1 | tail -2

  echo "  ✓ https://github.com/${GITHUB_USER}/${repo}"
  echo ""
done

echo "All 7 repos pushed!"
