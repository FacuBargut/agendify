"use client";

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
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Pacientes", href: "/pacientes", icon: Users },
  { label: "Turnos", href: "/turnos", icon: Clock },
  { label: "Perfil", href: "/perfil", icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-background border-t border-border">
      <ul className="flex h-full">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center h-full min-w-[48px] gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-text-secondary"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  className={cn(isActive && "fill-primary/20")}
                />
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
