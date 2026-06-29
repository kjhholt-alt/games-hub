import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. There are sibling lockfiles under Projects/, and
  // without this Next infers the parent dir as root — which breaks file
  // tracing on Vercel (the "outputFileTracingRoot lambda trap").
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // Deadlock hero icons are served from the open deadlock-api asset CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets-bucket.deadlock-api.com",
      },
    ],
  },
};

export default nextConfig;
