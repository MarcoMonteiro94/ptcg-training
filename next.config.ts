import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "r2.limitlesstcg.net",
        pathname: "/pokemon/**",
      },
      {
        protocol: "https",
        hostname: "limitlesstcg.nyc3.cdn.digitaloceanspaces.com",
        pathname: "/tpci/**",
      },
    ],
  },
};

export default nextConfig;
