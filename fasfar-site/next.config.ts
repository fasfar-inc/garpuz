import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a sub-folder of another repository, so pin the root explicitly.
  turbopack: { root: path.join(__dirname) },
  poweredByHeader: false,
};

export default nextConfig;
