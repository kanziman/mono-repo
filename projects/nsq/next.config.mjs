import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default nextConfig;
