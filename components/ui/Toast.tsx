"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({
  message,
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 300); // wait for fade out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible && !show) return null;

  return (
    <div
      className={cn(
        "fixed left-4 right-4 z-[60] flex items-center gap-2.5 rounded-lg bg-text-primary px-4 py-3 shadow-lg transition-all duration-300",
        "bottom-[80px]",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      )}
    >
      <CheckCircle2 size={18} strokeWidth={1.5} className="shrink-0 text-success" />
      <span className="text-[14px] text-white">{message}</span>
    </div>
  );
}
