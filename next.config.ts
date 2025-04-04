import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // If client-side (browser), provide fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,         // Edge TTS tries to use fs
        net: false,        // Might be used by ws
        tls: false,        // Might be used by ws
        dns: false,        // Might be used by internal libraries
        child_process: false,
        stream: false,     // Some libraries use stream
        http: false,
        https: false,
        zlib: false,
        path: false,
        crypto: false,
        os: false,
        ws: false
      };
    }
    return config;
  },
  images: {
    domains: ['cdn.readwordly.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.readwordly.com',
        port: '',
        pathname: '/**',
      },
    ],
  }
};

export default nextConfig;
