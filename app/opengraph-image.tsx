// app/opengraph-image.tsx → Facebook / WhatsApp / Google වල link එක share කළාම පේන පින්තූරය (1200×630)
// (Sinhala font එකක් නැති නිසා English අකුරු විතරයි)
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Hadamithuru (hadamithuru.lk) – Sri Lanka Marriage Proposals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // 💗 update-48: Logo එක (public/logo.svg) — සුදු card එකක් ඇතුළේ
  const logo = await readFile(join(process.cwd(), "public", "logo.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #D61F55 0%, #B5123F 60%, #330B18 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", padding: "18px 30px", borderRadius: 28, background: "white" }}>
            <img src={logoSrc} width={365} height={90} alt="" />
          </div>
          <div style={{ fontSize: 34, opacity: 0.9, display: "flex" }}>hadamithuru.lk</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 24, display: "flex" }}>Sri Lanka Marriage Proposals</div>
        <div style={{ fontSize: 34, marginTop: 28, opacity: 0.9, display: "flex" }}>Verified profiles · Private photos · Horoscope matching</div>
        <div style={{ fontSize: 28, marginTop: 48, padding: "14px 28px", borderRadius: 999, background: "rgba(255,255,255,0.15)", alignSelf: "flex-start", display: "flex" }}>Safe · Private · Made for Sri Lankan families</div>
      </div>
    ),
    size,
  );
}
