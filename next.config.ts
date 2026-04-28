import withPWA from "next-pwa";
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
    ];
  },
};

export default withPWA({
  dest: "public",
  // En App Router next-pwa NO auto-registra (inyecta en main.js, no main-app.js).
  // Lo registramos manualmente desde components/providers/PushProvider.tsx.
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "agendify-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
  ],
})(nextConfig);
