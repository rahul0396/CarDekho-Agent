import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cardekho.com" },
      { protocol: "https", hostname: "**.cars24.com" },
      { protocol: "https", hostname: "**.spinny.com" },
      { protocol: "https", hostname: "**.carwale.com" },
      { protocol: "https", hostname: "**.zigwheels.com" },
    ],
  },
};

export default nextConfig;
