// lib/photo.ts
// Server-side image processing. Blur එක CSS එකෙන් නෙවෙයි — server එකේදීම
// අලුත් image file එකක් හදනවා. ඒ නිසා blurred file එකෙන් original එක ආපහු ගන්න බෑ.
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Original version: rotate fix කරනවා, 1600px දක්වා අඩු කරනවා, EXIF/GPS metadata අයින් කරනවා. */
export async function makeOriginal(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

/**
 * Blurred version: මුලින්ම 24px වලට පොඩි කරනවා (විස්තර ඔක්කොම නැති වෙනවා),
 * ඊට පස්සේ ආපහු ලොකු කරලා blur කරනවා. මේකෙන් original එක reconstruct කරන්න බෑ.
 */
export async function makeBlurred(input: Buffer): Promise<Buffer> {
  const tiny = await sharp(input)
    .rotate()
    .resize({ width: 24, height: 24, fit: "inside" })
    .toBuffer();

  return sharp(tiny)
    .resize({ width: 600, height: 600, fit: "inside", kernel: "cubic" })
    .blur(20)
    .jpeg({ quality: 60 })
    .toBuffer();
}

/** Upload කරපු file එක ඇත්තටම image එකක්ද කියලා බලනවා. */
export async function assertImage(input: Buffer): Promise<void> {
  const meta = await sharp(input).metadata();
  if (!meta.format || !["jpeg", "png", "webp", "heif", "avif", "gif"].includes(meta.format)) {
    throw new Error("Unsupported image format");
  }
}

/** Profile එකේ avatar_url එක — හැමතැනම පාවිච්චි වෙන්නේ මේ URL එක. */
export function avatarUrlFor(userId: string): string {
  return `/api/avatar/${userId}?v=${Date.now()}`;
}
