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
  echo "=== Updating $dir → $repo ==="

  cd "$ROOT/$dir"

  if [ ! -d .git ]; then
    git init --quiet
    git branch -m main
    git remote add origin "https://github.com/${GITHUB_USER}/${repo}.git"
  fi

  git config user.email "${GITHUB_USER}@users.noreply.github.com"
  git config user.name "$GITHUB_USER"

  git add -A
  git diff --cached --quiet && echo "  No changes" && continue
  git commit -m "Add README.md and CLAUDE.md" --quiet
  git push origin main --force 2>&1 | tail -2

  echo "  ✓ Updated"
  echo ""
done

echo "All repos updated!"
