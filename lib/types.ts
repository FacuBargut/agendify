export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: Date;
  durationMin: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  depositAmount?: number;
  totalAmount?: number;
  notes?: string;
}

// Serialized version for passing from server to client components
export interface SerializedAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string; // ISO string
  durationMin: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  depositAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
}

export interface Professional {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface ProfessionalPublic {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  bio?: string | null;
  sessionPrice: number;
  depositPercent: number;
  sessionDuration: number;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
}

export interface BookingFormData {
  patientName: string;
  patientPhone: string;
  notes?: string;
}

export type BookingStep =
  | "select-date"
  | "select-time"
  | "fill-form"
  | "payment"
  | "confirmed";
