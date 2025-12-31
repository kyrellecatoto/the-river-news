// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all external images
      },
    ],
  },
  // For Next.js 13/14 Server Actions
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig