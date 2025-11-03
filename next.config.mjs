import dns from 'node:dns';

// Set DNS to prefer IPv4 before Next.js starts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if not available
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
