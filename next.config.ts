import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  turbopack: {},
  async headers() {
    return [
      {
        // Le indica a Vercel que no inyecte el toolbar en ninguna ruta
        source: "/(.*)",
        headers: [{ key: "x-vercel-skip-toolbar", value: "1" }],
      },
      {
        // El SW debe revalidarse siempre — nunca servir una versión vieja
        // desde el CDN. Esto evita el bug donde Vercel cacheaba un sw.js
        // viejo con precache apuntando a chunks que ya no existían.
        source: "/sw.js",
        headers: [
          { key: "cache-control", value: "no-store, max-age=0" },
          { key: "service-worker-allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
