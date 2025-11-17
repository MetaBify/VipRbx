import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "tr.rbxcdn.com",
      "t1.rbxcdn.com",
      "t2.rbxcdn.com",
      "t3.rbxcdn.com",
      "t4.rbxcdn.com",
      "t5.rbxcdn.com",
      "t6.rbxcdn.com",
      "t7.rbxcdn.com",
      "t8.rbxcdn.com",
      "t9.rbxcdn.com",
      "t10.rbxcdn.com",
      "cdn.affise.com",
      "i.gyazo.com",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://d3gi4w10ruedfh.cloudfront.net/public/external/:path*",
      },
    ];
  },
};

export default nextConfig;
