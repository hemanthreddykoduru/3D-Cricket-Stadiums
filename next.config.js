/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/models/narendra-modi-stadium/step34-c-motera.glb',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

// Keep an open dev preview from overwriting production chunks during a build.
module.exports = (phase) => ({
  ...nextConfig,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
});
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');
