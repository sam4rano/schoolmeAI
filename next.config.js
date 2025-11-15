/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    instrumentationHook: true, // Enable instrumentation hook for cron jobs
  },
  images: {
    domains: [],
    remotePatterns: [],
  },
}

module.exports = nextConfig


