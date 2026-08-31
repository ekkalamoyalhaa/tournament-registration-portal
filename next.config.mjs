/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // large files go direct-to-R2, never through Server Actions
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME || 'assets.example.com',
      },
    ],
  },
};

export default nextConfig;
