// blur-existing-images.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials. Check your .env.local file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function blurExistingImages() {
  console.log("🔍 Fetching profiles with blur_photo = true (Limit: 20)...");
  
  // 1. බ්ලර් කරන්න ඕන ප්‍රොෆයිල්ස් ටික ඩේටාබේස් එකෙන් ගන්නවා (පළවෙනි 20 දෙනා විතරක්)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('blur_photo', true)
    .limit(20); // 👈 මෙතන තමයි 20කට සීමා කළේ

  if (error) {
    console.error("❌ Error fetching profiles:", error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("✅ No profiles found with blur_photo = true.");
    return;
  }

  console.log(`📸 Found ${profiles.length} profiles to blur.`);

  for (const profile of profiles) {
    if (!profile.avatar_url) continue;

    try {
      // 2. ෆොටෝ එකේ නම හොයාගන්නවා (URL එකෙන්)
      const urlParts = profile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Query params අයින් කරන්න

      console.log(`⏳ Processing image for: ${profile.full_name} (${fileName})`);

      // 3. ෆොටෝ එක ඩවුන්ලෝඩ් කරනවා
      const response = await fetch(profile.avatar_url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 4. Sharp පාවිච්චි කරලා බ්ලර් කරනවා (30px - ලොකු බ්ලර් එකක්)
      const blurredBuffer = await sharp(buffer)
        .blur(50) // 👈 මෙතන තමයි බ්ලර් එක වැඩි කළේ
        .toBuffer();

      // 5. බ්ලර් කරපු ෆොටෝ එක ආයේ Supabase එකට අප්ලෝඩ් කරනවා (Overwrite)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blurredBuffer, {
          contentType: response.headers.get('content-type') || 'image/jpeg',
          upsert: true // පරණ ෆොටෝ එක උඩින් ලියවෙන්න
        });

      if (uploadError) throw uploadError;

      console.log(`✅ Successfully blurred: ${fileName}`);

    } catch (err) {
      console.error(`❌ Failed to process ${profile.full_name}:`, err.message);
    }
  }

  console.log("🎉 All done!");
}

blurExistingImages();