// Logica central de estados "efectivos" de turnos.
//
// Diferencia entre status almacenado y status efectivo:
//   - DB guarda lo que el profesional/sistema marco explicitamente.
//   - El estado EFECTIVO se calcula al vuelo usando la fecha del turno y la
//     duracion para auto-completar turnos confirmados que ya pasaron.
//
// Esto evita depender de un cron de alta frecuencia (Vercel Hobby = 1/dia)
// para que los turnos pasen automaticamente a "completado" en la UI.

import type { Appointment, SerializedAppointment, AppointmentStatus } from "@/lib/types";

// 48 horas despues del fin de la sesion, si el profesional no marco
// asistio/no-vino, asumimos optimistamente que asistio.
const REVIEW_WINDOW_MS = 48 * 60 * 60 * 1000;

export type EffectiveStatus =
  | AppointmentStatus
  | "awaiting_review"; // confirmado, ya paso el horario, falta marcar asistencia

interface AppointmentLike {
  date: Date | string;
  durationMin: number;
  status: AppointmentStatus;
}

function endOfSession(appointment: AppointmentLike): Date {
  const d = appointment.date instanceof Date ? appointment.date : new Date(appointment.date);
  return new Date(d.getTime() + appointment.durationMin * 60 * 1000);
}

export function getEffectiveStatus(
  appointment: AppointmentLike,
  now: Date = new Date()
): EffectiveStatus {
  // Estados terminales: respetar lo guardado
  if (
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "no_show" ||
    appointment.status === "pending_transfer" ||
    appointment.status === "pending"
  ) {
    return appointment.status;
  }

  // confirmed: depende de si ya paso la sesion y cuanto
  if (appointment.status === "confirmed") {
    const end = endOfSession(appointment);
    if (now.getTime() < end.getTime()) return "confirmed";
    if (now.getTime() < end.getTime() + REVIEW_WINDOW_MS) return "awaiting_review";
    return "completed"; // > 48hs sin marcar = optimista
  }

  return appointment.status;
}

export function isPastSession(
  appointment: AppointmentLike,
  now: Date = new Date()
): boolean {
  return now.getTime() >= endOfSession(appointment).getTime();
}

/**
 * El profesional puede cancelar un turno solamente si esta en el futuro y
 * todavia no fue marcado como completado o no-show. Cancelar turnos pasados
 * o terminales no tiene sentido y rompe metricas.
 */
export function canCancel(
  appointment: AppointmentLike,
  now: Date = new Date()
): boolean {
  if (
    appointment.status === "completed" ||
    appointment.status === "no_show" ||
    appointment.status === "cancelled"
  ) {
    return false;
  }
  return !isPastSession(appointment, now);
}

/**
 * Cuanto plata cuenta este turno para el ingreso del profesional segun el
 * estado efectivo:
 *   - completed / awaiting_review: total de la sesion (asumiendo asistencia)
 *   - no_show: solo la sena (lo unico que efectivamente cobro)
 *   - resto: 0 (no se contabiliza hasta que termine)
 */
export function incomeForAppointment(
  appointment: Appointment | SerializedAppointment,
  now: Date = new Date()
): number {
  const effective = getEffectiveStatus(
    {
      date: appointment.date,
      durationMin: appointment.durationMin,
      status: appointment.status,
    },
    now
  );

  if (effective === "completed" || effective === "awaiting_review") {
    return appointment.totalAmount ?? 0;
  }
  if (effective === "no_show") {
    return appointment.depositAmount ?? 0;
  }
  return 0;
}
