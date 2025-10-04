/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Privacy-focused settings for research application
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  reactStrictMode: true,
}

// Disable Next.js telemetry for research environment
process.env.NEXT_TELEMETRY_DISABLED = '1'

export default nextConfig
