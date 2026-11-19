/** @type {import("next").NextConfig} */
const nextConfig = {
  // This app is copied to a temp dir and must not pick up any outer lockfile.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
