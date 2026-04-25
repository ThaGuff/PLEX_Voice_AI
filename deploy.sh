#!/bin/bash
set -e
echo "🚀 ARIA Platform v2 — Full Deploy Script"
echo "========================================="

REPO_DIR="$HOME/PLEX_Voice_AI_clone"
SRC_DIR="$HOME/Downloads/aria-v4"

# Clone fresh or reset
if [ -d "$REPO_DIR" ]; then
  echo "📁 Using existing clone..."
  cd "$REPO_DIR"
  git fetch origin
  git reset --hard origin/main
  git clean -fd
else
  echo "📁 Cloning fresh..."
  git clone https://github.com/ThaGuff/PLEX_Voice_AI.git "$REPO_DIR"
  cd "$REPO_DIR"
fi

echo "✅ Repo ready at $REPO_DIR"
echo ""
echo "Now run: cd $REPO_DIR && bash $SRC_DIR/push.sh"
