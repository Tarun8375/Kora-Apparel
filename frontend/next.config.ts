import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore: Explicitly forcing server mode to bypass Next.js 16 prerender bug
  output: "server",
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
