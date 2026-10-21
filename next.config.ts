import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Verification documents can be up to 5 MB, plus multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
