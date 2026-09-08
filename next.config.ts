import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep @react-pdf/renderer out of the bundler; it runs in the Node runtime
  // (used by the invoice PDF route). Prevents Netlify bundling issues.
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
