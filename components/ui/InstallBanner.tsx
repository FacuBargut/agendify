"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "72px",
        left: "16px",
        right: "16px",
        background: "#1A202C",
        borderRadius: "12px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "#0D6E6E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "white", fontSize: "18px", fontWeight: "700" }}>
          A
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            color: "white",
            fontSize: "13px",
            fontWeight: "500",
            margin: 0,
          }}
        >
          Instala Agendify
        </p>
        <p style={{ color: "#718096", fontSize: "12px", margin: 0 }}>
          Agregala a tu pantalla de inicio
        </p>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: "#0D6E6E",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Download size={14} />
        Instalar
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          color: "#718096",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
