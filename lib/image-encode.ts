// lib/image-encode.ts
// SERVER: photos ගබඩා කරන්නේ AVIF format එකෙන් — එකම quality එකට WebP වලට වඩා ~30-50% පොඩියි, JPEG වලට වඩා ~50%+ පොඩියි.
// (Chrome, Edge, Firefox, Safari 16+ හැම එකකම පේනවා)
import sharp from "sharp";

export const IMAGE_EXT = "avif";
export const IMAGE_TYPE = "image/avif";

/** Photo එක හරවලා (EXIF rotate), ලොකු නම් පොඩි කරලා, AVIF එකට හකුළනවා */
export function encodeCompact(input: Buffer, maxSize = 1280, quality = 52) {
  return sharp(input)
    .rotate()
    .resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true })
    .avif({ quality, effort: 4, chromaSubsampling: "4:2:0" })
    .toBuffer();
}
