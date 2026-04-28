"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, Clock, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Agenda",    href: "/agenda",    icon: CalendarDays },
  { label: "Pacientes", href: "/pacientes", icon: Users },
  { label: "Turnos",    href: "/turnos",    icon: Clock },
  { label: "Perfil",    href: "/perfil",    icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  // optimistic: muestra el tab activo antes de que Next.js actualice pathname
  const [pending, setPending] = useState<string | null>(null);
  // para el micro-rebote al tocar
  const [tapped, setTapped] = useState<string | null>(null);

  // Una vez que el pathname real cambia, limpiamos el estado pending
  useEffect(() => {
    setPending(null);
  }, [pathname]);

  const activeHref = pending ?? pathname;

  function handleTap(href: string, e: React.MouseEvent) {
    if (activeHref.startsWith(href)) {
      e.preventDefault(); // ya estamos en esta ruta — evitar nav redundante
      return;
    }
    setPending(href);
    setTapped(href);
    setTimeout(() => setTapped(null), 200);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex h-14">
        {navItems.map((item) => {
          const isActive = activeHref.startsWith(item.href);
          const isTapped = tapped === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              {/* Link con prefetch en background — navegacion instantanea
                  cuando ya esta el RSC payload en cache. router.push no
                  prefetcha, por eso el bottom nav se sentia lento. */}
              <Link
                href={item.href}
                prefetch
                onClick={(e) => handleTap(item.href, e)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-full w-full gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-text-secondary"
                )}
              >
                {/* Indicador superior */}
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}

                {/* Ícono con micro-bounce al tocar */}
                <span className={cn(isTapped && "nav-tap")}>
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className={cn(isActive && "fill-primary/20")}
                  />
                </span>

                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
