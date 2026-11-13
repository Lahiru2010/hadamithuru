#!/usr/bin/env bash
# scripts/promote-live.sh — 🚀 Staging එකේ test කරලා OK නම් විතරක් → Live (main) එකට
# භාවිතය:  ./scripts/promote-live.sh
# • develop → main merge කරලා push කරනවා → Vercel එක live site එකට deploy කරනවා
# • අලුත් SQL තියෙනවා නම් මුලින්ම Production Supabase එකේ run කරන්න කියලා මතක් කරනවා
set -euo pipefail

[ -z "$(git status --porcelain)" ] || { echo "❌ Commit නොකළ වෙනස්කම් තියෙනවා. මුලින් commit / stash කරන්න."; exit 1; }
git fetch -q origin

NEW_SQL="$(git diff --name-only origin/main origin/develop -- supabase/migrations/ || true)"
echo "📦 Live එකට යන commits:"; git log --oneline origin/main..origin/develop || true
if [ -n "$NEW_SQL" ]; then
  echo; echo "🗄️  අලුත් SQL files — මුලින්ම PRODUCTION Supabase එකේ run කරන්න:"; echo "$NEW_SQL" | sed 's/^/    • /'
fi
echo
read -r -p "✅ Staging එකේ test කරලා OK ද? SQL production එකේ run කළාද? Live කරන්නද? (yes/N) " ok
[ "$ok" = "yes" ] || { echo "නැවැත්තුවා — live එකට කිසිවක් ගියේ නෑ."; exit 1; }

git checkout -q main
git merge -q --no-edit origin/develop
git push -q origin main
git checkout -q develop
echo "🎉 Live එකට push කළා. Vercel → Deployments එකේ build එක බලන්න."
