import { addDays, format, getDay } from "date-fns";
import type { Appointment, TimeSlot } from "@/lib/types";

function todayAt(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    patientName: "Valentina Rodríguez",
    patientPhone: "+54 341 555-1234",
    date: todayAt(9, 0),
    durationMin: 50,
    status: "confirmed",
    paymentStatus: "paid",
    totalAmount: 18000,
    depositAmount: 5400,
  },
  {
    id: "2",
    patientName: "Martín Suárez",
    patientPhone: "+54 341 555-2345",
    date: todayAt(10, 0),
    durationMin: 50,
    status: "confirmed",
    paymentStatus: "deposit_paid",
    totalAmount: 20000,
    depositAmount: 6000,
  },
  {
    id: "3",
    patientName: "Lucía Fernández",
    patientPhone: "+54 341 555-3456",
    date: todayAt(11, 0),
    durationMin: 50,
    status: "confirmed",
    paymentStatus: "paid",
    totalAmount: 18000,
    depositAmount: 5400,
  },
  {
    id: "4",
    patientName: "Diego Pereyra",
    patientPhone: "+54 341 555-4567",
    date: todayAt(14, 0),
    durationMin: 50,
    status: "pending",
    paymentStatus: "unpaid",
    totalAmount: 22000,
  },
  {
    id: "5",
    patientName: "Camila López",
    patientPhone: "+54 341 555-5678",
    date: todayAt(15, 0),
    durationMin: 50,
    status: "cancelled",
    paymentStatus: "unpaid",
    totalAmount: 15000,
  },
  {
    id: "6",
    patientName: "Sofía Gómez",
    patientPhone: "+54 341 555-6789",
    date: todayAt(17, 0),
    durationMin: 50,
    status: "confirmed",
    paymentStatus: "deposit_paid",
    totalAmount: 25000,
    depositAmount: 7500,
  },
];

// --- Public booking mock data ---

export const MOCK_PROFESSIONAL = {
  id: "1",
  name: "Dra. María García",
  slug: "dra-garcia",
  specialty: "Psicóloga Clínica",
  bio: "Especialista en terapia cognitivo-conductual con 8 años de experiencia. Atención de adultos y adolescentes.",
  sessionPrice: 18000,
  depositPercent: 30,
  sessionDurationMin: 50,
  avatarInitials: "MG",
};

const WEEKDAY_TIMES = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const SATURDAY_TIMES = ["09:00", "10:00", "11:00"];

// Deterministic "taken" slots based on day-of-month
const TAKEN_INDICES = [1, 3, 5];

function buildAvailableSlots(): Record<string, TimeSlot[]> {
  const slots: Record<string, TimeSlot[]> = {};
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const day = addDays(today, i);
    const dow = getDay(day); // 0=sun
    const key = format(day, "yyyy-MM-dd");

    if (dow === 0) continue; // no domingo

    const times = dow === 6 ? SATURDAY_TIMES : WEEKDAY_TIMES;
    const dayOfMonth = day.getDate();

    slots[key] = times.map((time, idx) => ({
      time,
      available: !TAKEN_INDICES.includes((idx + dayOfMonth) % times.length),
    }));
  }

  return slots;
}

export const MOCK_AVAILABLE_SLOTS = buildAvailableSlots();
