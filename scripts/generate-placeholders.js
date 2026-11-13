// scripts/generate-placeholders.js
// දැනටමත් photo දාලා තියෙන users ලට "blur placeholder" (photo එකේ ඉතාම පොඩි version එක) හදනවා.
// අලුතින් upload කරන photos වලට මේක auto හැදෙනවා — මේ script එක ඕන දැනට තියෙන photos වලට විතරයි.
//
// Run:  node scripts/generate-placeholders.js            (placeholder නැති අයට විතරක්)
//       node scripts/generate-placeholders.js --force    (හැමෝටම ආයේ හදනවා)
//
// වැදගත්: Placeholder එක හදන්නේ හැමෝටම පේන (blur / public) version එකෙන් — original එකෙන් නෙවෙයි.

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const FORCE = process.argv.includes("--force");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function makePlaceholder(buf) {
  const tiny = await sharp(buf).resize(16, 16, { fit: "cover" }).webp({ quality: 50 }).toBuffer();
  return `data:image/webp;base64,${tiny.toString("base64")}`;
}

// හැමෝටම පේන version එක තියෙන්නේ කොහෙද
function publicFileOf(p) {
  if (p.avatar_public_path) return { bucket: "avatars", path: p.avatar_public_path }; // අලුත් system එක
  if (p.blur_photo && p.photo_blurred_path) return { bucket: "avatars", path: p.photo_blurred_path }; // පරණ, blur on
  if (!p.blur_photo && p.photo_original_path) return { bucket: "avatars", path: p.photo_original_path }; // පරණ, blur off
  return null;
}

async function main() {
  let query = supabase
    .from("profiles")
    .select("id, full_name, avatar_public_path, photo_original_path, photo_blurred_path, blur_photo, avatar_placeholder");
  if (!FORCE) query = query.is("avatar_placeholder", null);

  const { data: profiles, error } = await query;
  if (error) throw error;

  const todo = (profiles || []).filter((p) => publicFileOf(p));
  console.log(`🖼️  ${todo.length} profile(s) need a placeholder.`);

  let done = 0;
  for (const p of todo) {
    const file = publicFileOf(p);
    try {
      const { data, error: dlErr } = await supabase.storage.from(file.bucket).download(file.path);
      if (dlErr || !data) throw new Error(dlErr?.message || "download failed");

      const placeholder = await makePlaceholder(Buffer.from(await data.arrayBuffer()));
      const { error: upErr } = await supabase.from("profiles").update({ avatar_placeholder: placeholder }).eq("id", p.id);
      if (upErr) throw upErr;

      done++;
      console.log(`  ✓ ${p.full_name || p.id}`);
    } catch (e) {
      console.error(`  ✗ ${p.full_name || p.id}: ${e.message}`);
    }
  }
  console.log(`✅ Done. ${done}/${todo.length} updated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
