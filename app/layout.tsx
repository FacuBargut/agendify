import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import PushProvider from "@/components/providers/PushProvider";
import { InstallBanner } from "@/components/ui/InstallBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Agendify — Tu agenda profesional",
  description: "Plataforma de turnos para profesionales de salud",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agendify",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Agendify",
    title: "Agendify — Tu agenda profesional",
    description: "Plataforma de turnos para profesionales de salud",
  },
  icons: {
    shortcut: "/icons/icon-96x96.png",
    apple: [
      { url: "/icons/icon-152x152.png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D6E6E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="Agendify" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192x192.png"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-text-primary">
        <SessionProvider>
          <PushProvider>
            {children}
            <InstallBanner />
          </PushProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
