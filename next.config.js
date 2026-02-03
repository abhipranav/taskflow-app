const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // serverActions is now stable in Next.js 14+
  },
}

module.exports = withPWA(nextConfig);
