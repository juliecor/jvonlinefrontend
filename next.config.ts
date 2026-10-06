import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The old landing path from fhiglobal.ae/johndorf, so forwarded links still land.
      // (/johndorf/dashboard is now the realty's own dashboard, so the old map link isn't redirected.)
      { source: "/johndorf/home", destination: "/johndorf", permanent: true },
    ];
  },
};

export default nextConfig;
