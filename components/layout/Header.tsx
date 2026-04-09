"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, User, Settings, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Buenos días,";
  if (hour >= 12 && hour < 19) return "Buenas tardes,";
  return "Buenas noches,";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Header() {
  const { data: session } = useSession();
  const name = session?.user?.name || "Profesional";
  const initials = getInitials(name);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary">{getGreeting()}</span>
        <span className="text-base font-medium text-text-primary">{name}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface"
          aria-label="Notificaciones"
        >
          <Bell size={22} strokeWidth={1.5} className="text-text-secondary" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-[13px] font-medium text-white">
                {initials}
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[200px] rounded-lg border border-border bg-background p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              {/* User info */}
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-text-primary">{name}</p>
                <p className="text-[12px] text-text-secondary">
                  {session?.user?.email}
                </p>
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-text-primary outline-none hover:bg-surface focus:bg-surface">
                <User size={15} className="text-text-secondary" />
                Mi perfil
              </DropdownMenu.Item>

              <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-text-primary outline-none hover:bg-surface focus:bg-surface">
                <Settings size={15} className="text-text-secondary" />
                Configuración
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[#E24B4A] outline-none hover:bg-[#FEF0EF] focus:bg-[#FEF0EF]"
                onSelect={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut size={15} />
                Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
