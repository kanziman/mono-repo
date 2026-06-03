import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/design-system'],
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default nextConfig;
