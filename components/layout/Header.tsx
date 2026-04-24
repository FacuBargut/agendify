"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, User, Settings, LogOut,
  CheckCircle2, Clock, XCircle, CreditCard, BellOff,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ── Tipos ─────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: "new_transfer" | "new_mp_payment" | "transfer_confirmed" | "transfer_rejected";
  title: string;
  body: string;
  read: boolean;
  appointmentId: string | null;
  createdAt: string;
}

// ── Config visual por tipo de notificación ────────────────────────

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: typeof Clock; iconBg: string; iconColor: string }
> = {
  new_transfer: {
    icon: Clock,
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-warning",
  },
  new_mp_payment: {
    icon: CreditCard,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
  },
  transfer_confirmed: {
    icon: CheckCircle2,
    iconBg: "bg-[#F0FDF4]",
    iconColor: "text-success",
  },
  transfer_rejected: {
    icon: XCircle,
    iconBg: "bg-[#FEF0EF]",
    iconColor: "text-[#E24B4A]",
  },
};

// ── Helpers ───────────────────────────────────────────────────────

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

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    return "";
  }
}

// ── Ítem individual de notificación ──────────────────────────────

function NotifItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onNavigate: (appointmentId: string) => void;
}) {
  const config = TYPE_CONFIG[notif.type];
  const Icon = config.icon;

  function handleClick() {
    if (!notif.read) onRead(notif.id);
    if (notif.appointmentId) onNavigate(notif.appointmentId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-surface",
        !notif.read && "bg-primary-light/40"
      )}
    >
      {/* Ícono */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.iconBg
        )}
      >
        <Icon size={15} className={config.iconColor} strokeWidth={1.75} />
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[13px] leading-tight",
              !notif.read
                ? "font-semibold text-text-primary"
                : "font-medium text-text-primary"
            )}
          >
            {notif.title}
          </p>
          {!notif.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-1 text-[12px] text-text-secondary leading-relaxed line-clamp-2">
          {notif.body}
        </p>
        <p className="mt-1 text-[11px] text-text-secondary/70">
          {timeAgo(notif.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ── Panel de notificaciones ───────────────────────────────────────

function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkOneRead,
  onNavigate,
}: {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onNavigate: (appointmentId: string) => void;
}) {
  return (
    <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-text-primary">
            Notificaciones
          </span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[12px] text-primary hover:underline"
          >
            Marcar todo leído
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
            <BellOff size={28} strokeWidth={1.5} className="text-border" />
            <p className="text-[13px] text-text-secondary">
              Sin notificaciones por ahora
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <NotifItem
                key={n.id}
                notif={n}
                onRead={onMarkOneRead}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Header principal ──────────────────────────────────────────────

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const name = session?.user?.name || "Profesional";
  const initials = getInitials(name);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch completo (panel abierto)
  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  // Fetch liviano para el badge (polling cada 30s)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones?unread=true");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreadCount]);

  // Al abrir el panel cargamos todo
  function handleOpenChange(open: boolean) {
    setPanelOpen(open);
    if (open) fetchAll();
  }

  // Marcar todas como leídas
  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // ignore
    }
  }

  // Navegar al turno al que hace referencia la notificación
  function handleNavigateToAppointment(appointmentId: string) {
    setPanelOpen(false);
    router.push(`/agenda?highlight=${appointmentId}`);
  }

  // Marcar una como leída
  async function handleMarkOneRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4">
      {/* Saludo */}
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary">{getGreeting()}</span>
        <span className="text-base font-medium text-text-primary">{name}</span>
      </div>

      <div className="flex items-center gap-3">

        {/* ── Campana con panel de notificaciones ── */}
        <DropdownMenu.Root open={panelOpen} onOpenChange={handleOpenChange}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface"
              aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
            >
              <Bell size={22} strokeWidth={1.5} className="text-text-secondary" />
              {/* Badge rojo con contador */}
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E24B4A] px-1 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[340px] max-w-[calc(100vw-16px)] rounded-xl border border-border bg-background shadow-xl animate-in fade-in-0 zoom-in-95"
            >
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={handleMarkAllRead}
                onMarkOneRead={handleMarkOneRead}
                onNavigate={handleNavigateToAppointment}
              />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* ── Avatar + menú usuario ── */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-[13px] font-medium text-white">{initials}</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[200px] rounded-lg border border-border bg-background p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-text-primary">{name}</p>
                <p className="text-[12px] text-text-secondary">
                  {session?.user?.email}
                </p>
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-text-primary outline-none hover:bg-surface focus:bg-surface"
                onSelect={() => router.push("/perfil")}
              >
                <User size={15} className="text-text-secondary" />
                Mi perfil
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-text-primary outline-none hover:bg-surface focus:bg-surface"
                onSelect={() => router.push("/perfil")}
              >
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
