/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "@remotion/bundler",
      "@remotion/renderer",
      "@rspack/binding",
      "@rspack/core",
      "esbuild",
    ],
    outputFileTracingExcludes: {
      "*": [
        "./node_modules/@remotion/**",
        "./node_modules/@rspack/**",
        "./node_modules/esbuild/**",
      ],
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "@remotion/bundler",
        "@remotion/renderer",
        "esbuild",
      ];
    }
    return config;
  },
};

export default nextConfig;
