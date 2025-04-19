/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking during production build (use with caution)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Optional: Also disable ESLint during builds for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Other Next.js config options
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 