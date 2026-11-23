import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirects run before src/proxy.ts, so these work while the gate is up.
  async redirects() {
    return [
      { source: "/snook-prediction", destination: "/snook", permanent: false },
      { source: "/snook-forecast", destination: "/snook", permanent: false },
    ];
  },
  // Belt and braces with the page's noindex meta: also covers the API and manifest.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/snook", headers: noindex },
      { source: "/snook/:path*", headers: noindex },
      { source: "/api/snook/:path*", headers: noindex },
      { source: "/api/snook", headers: noindex },
    ];
  },
};

export default nextConfig;
