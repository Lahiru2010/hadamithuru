#!/usr/bin/env bash
# scripts/apply-update.sh — 🚀 Claude එවන update zip එක දාලා, check කරලා, git commit + tag කරනවා
# භාවිතය (project folder එකේ ඉඳන්):   ./scripts/apply-update.sh 38
# • ~/Downloads/update-38.zip  → files copy කරනවා
# • ~/Downloads/2026*.sql      → supabase/migrations/ එකට ගෙනියනවා (Supabase එකේ run කරන්න මතක තියාගන්න)
# • npm install + tsc check    → වැරැද්දක් තිබ්බොත් commit කරන්නේ නෑ
# • git commit "update-38" + tag "update-38" (ආපහු යන්න ඕන නම්: git checkout update-37)
set -euo pipefail

N="${1:?update අංකය දෙන්න — උදා: ./scripts/apply-update.sh 38}"
ZIP="$HOME/Downloads/update-$N.zip"
[ -f "$ZIP" ] || { echo "❌ $ZIP හොයාගන්න බැහැ"; exit 1; }

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" = "main" ]; then
  echo "⚠️  ඔබ ඉන්නේ main (live) branch එකේ. Updates මුලින්ම 'develop' (staging) එකට දාන්න:  git checkout develop"
  read -r -p "එහෙම නැතුව main එකටම දානවද? (y/N) " ok
  [ "$ok" = "y" ] || exit 1
fi

rm -rf "/tmp/u$N" && unzip -oq "$ZIP" -d "/tmp/u$N" && cp -R "/tmp/u$N/update-$N/"* ./
echo "📦 files copy කළා"

shopt -s nullglob
SQLS=("$HOME"/Downloads/2026*.sql)
if [ ${#SQLS[@]} -gt 0 ]; then
  mv "${SQLS[@]}" supabase/migrations/
  echo "🗄️  SQL files → supabase/migrations/:"; for f in "${SQLS[@]}"; do echo "    • $(basename "$f")  ← Supabase එකේ run කරන්න"; done
fi

npm install --no-audit --no-fund --loglevel=error
# 👇 update-63: TypeScript error එකක් තිබ්බොත් මෙතනින් නවතිනවා (කලින් error එක තිබ්බත් commit වුණා)
if ! npx tsc --noEmit; then
  echo "❌ TypeScript errors තියෙනවා — commit කළේ නෑ. මේ error එක Claude ට එවන්න."
  exit 1
fi
echo "✅ TypeScript OK"

git add -A
git commit -qm "update-$N"
git tag -f "update-$N"
echo "🎉 update-$N commit + tag කළා ($BRANCH). දැන්:  git push && git push --tags"
