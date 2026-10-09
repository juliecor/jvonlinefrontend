import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only "N" badge would sit on the dashboard sidebar's account card.
  devIndicators: { position: "bottom-right" },
  // Photos, site plans and a realty's five accreditation documents (10 MB each) go through server actions, which allow only 1 MB by default.
  experimental: { serverActions: { bodySizeLimit: "60mb" } },
  images: {
    // Photos are resized to the size they're shown at (components/photo.tsx), only from Johndorf's photo folder on S3 and the site's own files.
    remotePatterns: [{ protocol: "https", hostname: "filipinohomes123.s3.ap-southeast-1.amazonaws.com", pathname: "/jvconline/**", search: "" }],
    qualities: [75],
  },
  async redirects() {
    return [
      // jvconline.ph is Johndorf's site: the landing is at /. These keep the old addresses working.
      { source: "/johndorf", destination: "/", permanent: true },
      { source: "/johndorf/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
