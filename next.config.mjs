/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-markdown", "remark-gfm"],
  output: "export",
  basePath: isProd ? "/ai-system-design" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
