import type { NextConfig } from "next";
const withPWA = require("next-pwa");

// Configure PWA
const pwaConfig = withPWA({
  dest: "public", // service worker will be generated here
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // disable in dev mode
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default pwaConfig(nextConfig);
