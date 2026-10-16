import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev assets must load when the phone or browser uses an IP, not only localhost.
  allowedDevOrigins: ["127.0.0.1", "*.*.*.*", "*.local"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
