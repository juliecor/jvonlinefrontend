import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only "N" badge would sit on the dashboard sidebar's account card.
  devIndicators: { position: "bottom-right" },
  async redirects() {
    return [
      // jvconline.ph is Johndorf's site: the landing is at /. These keep the old addresses working.
      { source: "/johndorf", destination: "/", permanent: true },
      { source: "/johndorf/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
