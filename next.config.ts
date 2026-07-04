import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // Barrel-optimize the icon and primitive packages so each route's chunk only
    // carries the exports it references. Neither is in Next's default optimize list.
    optimizePackageImports: ["@remixicon/react", "radix-ui"],
    ...(isDevelopment ? { instantNavigationDevToolsToggle: true } : {}),
  },
  logging: {
    // Forward browser warnings and errors to the dev terminal so the AI can read
    // client-side failures without opening the browser console.
    browserToTerminal: "warn",
    serverFunctions: false,
    incomingRequests: false,
  },
};

export default nextConfig;
