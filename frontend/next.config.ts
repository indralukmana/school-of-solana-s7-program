import type { NextConfig } from 'next'

function buildCsp(): string {
  const isDev = process.env.NODE_ENV === 'development'

  const connectSrc = [
    "'self'",
    'https://*.solana.com',
    'wss://*.solana.com',
    'https://*.helius-rpc.com',
    'https://plan-vault-api.indralukmana.workers.dev',
    ...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
  ].join(' ')

  const styleSrc = ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'].join(' ')

  const fontSrc = ["'self'", 'https://fonts.gstatic.com'].join(' ')

  return [
    "default-src 'self'",
    `connect-src ${connectSrc}`,
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    `style-src ${styleSrc}`,
    "img-src 'self' data: https:",
    `font-src ${fontSrc}`,
    "frame-src 'self' https://*.walletconnect.com",
  ].join('; ')
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: buildCsp() },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
