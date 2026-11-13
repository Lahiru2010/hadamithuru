import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🖼️ next/image quality අගයන් (CoupleImage එකේ 70 — "unconfigured qualities" warning එක නැති වෙන්න)
  images: { qualities: [70, 75] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
