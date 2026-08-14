#!/usr/bin/env bash
# ==============================================================================
# AIVOA.AI Automated Repository Update Script
# ==============================================================================
# Usage: ./scripts/auto_update.sh [commit_message]
# Example: ./scripts/auto_update.sh "feat: add complaint detail view"
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

COMMIT_MSG="${1:-"chore(update): automated repository update $(date '+%Y-%m-%d %H:%M:%S')"}"

echo "🔄 [AIVOA.AI Auto-Update] Checking repository status..."

# Ensure we are on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ -n "$CURRENT_BRANCH" ]; then
    echo "📌 Switching to main branch..."
    git checkout main
fi

# Stage all tracked and new files (respecting .gitignore)
git add .

if git diff --staged --quiet; then
    echo "✅ No changes to commit. Repository is up to date."
else
    echo "📦 Committing changes..."
    git commit -m "$COMMIT_MSG"
    
    echo "🚀 Pushing updates to origin/main..."
    git push origin main
    echo "✨ Successfully pushed updates to GitHub!"
fi
