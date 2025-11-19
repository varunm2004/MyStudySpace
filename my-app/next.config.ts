// Removed import of NextConfig from "next" to avoid module resolution error
const nextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    domains: [
      "maps.googleapis.com"
    ],
  },
};

export default nextConfig;
