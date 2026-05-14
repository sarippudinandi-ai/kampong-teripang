/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint tidak menghentikan build di production
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
