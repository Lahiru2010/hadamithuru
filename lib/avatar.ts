import sharp from 'sharp';

export function makeOriginal(input: Buffer) {
  return sharp(input)
    .rotate()
    .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
    .avif({ quality: 55, effort: 4, chromaSubsampling: '4:2:0' }) // 👈 AVIF — WebP වලට වඩා පොඩියි
    .toBuffer();
}

export async function makePublic(original: Buffer, blur: boolean) {
  if (!blur) return original;

  const tiny = await sharp(original).resize(32, 32).toBuffer();

  return sharp(tiny)
    .resize(400, 400)
    .blur(14)
    .avif({ quality: 60, effort: 4 })
    .toBuffer();
}