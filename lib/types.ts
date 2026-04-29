export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"            // paciente no asistio (profesional lo marco)
  | "pending_transfer";  // esperando verificación manual del profesional

export type PaymentMethod = "mercadopago" | "transferencia";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: Date;
  durationMin: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  depositAmount?: number;
  totalAmount?: number;
  notes?: string;
  transferProofRef?: string;
  transferExpiresAt?: Date;
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
  paymentMethod?: PaymentMethod | null;
  depositAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  transferProofRef?: string | null;
  transferExpiresAt?: string | null; // ISO string
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
  transferAlias?: string | null;
  mpSurchargePercent?: number;
  phone?: string | null;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
}

export interface BookingFormData {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes?: string;
}

export type BookingStep =
  | "select-date"
  | "select-time"
  | "fill-form"
  | "payment"
  | "confirmed";
