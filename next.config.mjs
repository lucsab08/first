/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  // The mobile (Expo) project lives in /mobile and has its own toolchain.
  // Next only compiles files it imports, so /mobile is naturally outside the
  // graph. The /mobile path is also excluded from tsconfig.json's typecheck.
};

export default nextConfig;
