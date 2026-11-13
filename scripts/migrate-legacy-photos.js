// scripts/migrate-legacy-photos.js
// පරණ profiles (avatar_url එකේ Supabase public URL එකක් තියෙන අය) අලුත් system එකට මාරු කරනවා:
//   - පරණ photo එක download කරනවා
//   - originals/<id>/ සහ blurred/<id>/ version දෙක හදලා upload කරනවා
//   - profiles row එක update කරනවා (avatar_url → /api/avatar/<id>)
// පරණ file එක DELETE කරන්නේ නෑ, overwrite කරන්නෙත් නෑ.
//
// Run:  node scripts/migrate-legacy-photos.js            (dry run — මොනවා වෙනවද කියලා පෙන්නනවා විතරයි)
//       node scripts/migrate-legacy-photos.js --apply    (ඇත්තටම කරනවා)
//
// වැදගත්: bucket එක private කරන්න කලින් (migration SQL එකට කලින්) මේක run කරන්න,
// නැත්නම් පරණ public URLs වැඩ කරන්නේ නෑ.

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const APPLY = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function makeOriginal(buf) {
  return sharp(buf).rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
async function makeBlurred(buf) {
  const tiny = await sharp(buf).rotate().resize({ width: 24, height: 24, fit: "inside" }).toBuffer();
  return sharp(tiny).resize({ width: 600, height: 600, fit: "inside", kernel: "cubic" })
    .blur(20).jpeg({ quality: 60 }).toBuffer();
}

// අපේම avatars bucket එකේ file එකක් නම් service key එකෙන් කෙලින්ම download කරනවා
// (bucket එක private නිසා public URL එක වැඩ කරන්නේ නෑ). නැත්නම් සාමාන්‍ය fetch.
const OWN_PREFIX = `${url}/storage/v1/object/public/avatars/`;
async function loadImage(avatarUrl) {
  if (avatarUrl.startsWith(OWN_PREFIX)) {
    const path = decodeURIComponent(avatarUrl.slice(OWN_PREFIX.length).split("?")[0]);
    const { data, error } = await supabase.storage.from("avatars").download(path);
    if (error || !data) throw new Error(`storage download failed: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }
  const res = await fetch(avatarUrl);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, photo_original_path")
    .not("avatar_url", "is", null)
    .is("photo_original_path", null);
  if (error) throw error;

  const legacy = profiles.filter((p) => p.avatar_url && !p.avatar_url.startsWith("/api/avatar/"));
  console.log(`${legacy.length} legacy profile photo(s) found. ${APPLY ? "APPLYING" : "DRY RUN"}`);

  for (const p of legacy) {
    try {
      const input = await loadImage(p.avatar_url);
      const name = `${Date.now()}.jpg`;
      const originalPath = `originals/${p.id}/${name}`;
      const blurredPath = `blurred/${p.id}/${name}`;
      console.log(`- ${p.full_name || p.id}: → ${originalPath}`);
      if (!APPLY) continue;

      const [orig, blur] = await Promise.all([makeOriginal(input), makeBlurred(input)]);
      const bucket = supabase.storage.from("avatars");
      let r = await bucket.upload(originalPath, orig, { contentType: "image/jpeg" });
      if (r.error) throw r.error;
      r = await bucket.upload(blurredPath, blur, { contentType: "image/jpeg" });
      if (r.error) throw r.error;

      const { error: upErr } = await supabase.from("profiles").update({
        photo_original_path: originalPath,
        photo_blurred_path: blurredPath,
        avatar_url: `/api/avatar/${p.id}?v=${Date.now()}`,
      }).eq("id", p.id);
      if (upErr) throw upErr;
    } catch (e) {
      console.error(`  ✗ ${p.full_name || p.id}: ${e.message}`);
    }
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
