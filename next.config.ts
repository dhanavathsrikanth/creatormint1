import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Google profile photos (OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Generic fallback
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

};

export default nextConfig;
