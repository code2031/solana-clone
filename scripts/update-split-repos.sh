#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GITHUB_USER="code2031"

declare -A REPOS=(
  ["validator"]="prism-validator"
  ["web3js-sdk"]="prism-web3js"
  ["program-library"]="prism-programs"
  ["explorer"]="prism-explorer"
  ["wallet-adapter"]="prism-wallet-adapter"
  ["wallet-gui"]="prism-backpack"
  ["dapp-scaffold"]="prism-dapp-scaffold"
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
