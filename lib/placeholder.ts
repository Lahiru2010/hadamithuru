// lib/placeholder.ts
// SERVER එකේ විතරයි. Photo එකේ ඉතාම පොඩි (16px) version එකක් හදලා text එකක් (data URL) විදිහට දෙනවා.
// ඒක ~300 bytes විතර නිසා profile data එකත් එක්කම එනවා — photo එක load වෙනකම් ඒක blur කරලා පෙන්නනවා.
// වැදගත්: මේක හදන්නේ හැමෝටම පේන (public / blur) version එකෙන් — ඒ නිසා privacy ප්‍රශ්නයක් නෑ.
import sharp from "sharp";

export async function makePlaceholder(image: Buffer): Promise<string> {
  const tiny = await sharp(image)
    .resize(16, 16, { fit: "cover" })
    .webp({ quality: 50 })
    .toBuffer();
  return `data:image/webp;base64,${tiny.toString("base64")}`;
}
