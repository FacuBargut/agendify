import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date in Argentine Spanish (e.g. "miércoles 9 de abril de 2025") */
export function formatDate(date: Date | string, pattern: string = "EEEE d 'de' MMMM 'de' yyyy") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: es });
}

/** Format a number as Argentine pesos (e.g. "$15.000") */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
