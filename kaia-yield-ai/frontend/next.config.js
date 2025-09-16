/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn.example.com'],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_KAIA_RPC_URL: process.env.NEXT_PUBLIC_KAIA_RPC_URL,
    NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS: process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS,
    NEXT_PUBLIC_GAME_REWARDS_ADDRESS: process.env.NEXT_PUBLIC_GAME_REWARDS_ADDRESS,
  },
  experimental: {
    appDir: false
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.line-scdn.net https://*.line-apps.com https://liff.line.me"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;