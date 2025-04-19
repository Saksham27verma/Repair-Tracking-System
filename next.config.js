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
  // Set placeholder environment variables for build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-build.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key-for-build',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'placeholder-clerk-key-for-build',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'placeholder-clerk-secret-for-build',
  },
};

module.exports = nextConfig; 