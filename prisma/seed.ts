import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes } from "date-fns";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Crear profesional de prueba
  const professional = await db.professional.upsert({
    where: { slug: "dra-garcia" },
    update: {},
    create: {
      name: "Dra. María García",
      email: "maria.garcia@agendify.com.ar",
      slug: "dra-garcia",
      specialty: "psychology",
      bio: "Especialista en terapia cognitivo-conductual con 8 años de experiencia. Atención de adultos y adolescentes.",
      phone: "3411234567",
      sessionPrice: 18000,
      depositPercent: 30,
      sessionDuration: 50,
      plan: "pro",
    },
  });

  console.log("Profesional creado:", professional.slug);

  // Crear disponibilidad (Lunes a Viernes)
  const days = [1, 2, 3, 4, 5];
  for (const day of days) {
    await db.availability.upsert({
      where: {
        professionalId_dayOfWeek: {
          professionalId: professional.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        professionalId: professional.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: 50,
      },
    });
  }

  // Sábado con horario reducido
  await db.availability.upsert({
    where: {
      professionalId_dayOfWeek: {
        professionalId: professional.id,
        dayOfWeek: 6,
      },
    },
    update: {},
    create: {
      professionalId: professional.id,
      dayOfWeek: 6,
      startTime: "09:00",
      endTime: "12:00",
      slotDuration: 50,
    },
  });

  console.log("Disponibilidad creada: Lun-Vie 09-18, Sáb 09-12");

  // Crear pacientes de prueba
  const patientsData = [
    { name: "Valentina Rodríguez", phone: "3411111111" },
    { name: "Martín Suárez", phone: "3412222222" },
    { name: "Lucía Fernández", phone: "3413333333" },
    { name: "Diego Pereyra", phone: "3414444444" },
    { name: "Camila López", phone: "3415555555" },
  ];

  const patients = [];
  for (const p of patientsData) {
    const patient = await db.patient.upsert({
      where: {
        professionalId_phone: {
          professionalId: professional.id,
          phone: p.phone,
        },
      },
      update: {},
      create: {
        professionalId: professional.id,
        name: p.name,
        phone: p.phone,
        status: "active",
      },
    });
    patients.push(patient);
  }

  console.log("Pacientes creados:", patients.length);

  // Borrar turnos previos del seed para evitar duplicados
  await db.appointment.deleteMany({
    where: { professionalId: professional.id },
  });

  // Crear turnos para hoy y mañana
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const appointmentsData = [
    {
      date: setMinutes(setHours(today, 9), 0),
      patient: patients[0],
      status: "confirmed",
      paymentStatus: "paid",
      totalAmount: 18000,
      depositAmount: 5400,
    },
    {
      date: setMinutes(setHours(today, 10), 0),
      patient: patients[1],
      status: "confirmed",
      paymentStatus: "deposit_paid",
      totalAmount: 18000,
      depositAmount: 5400,
    },
    {
      date: setMinutes(setHours(today, 11), 0),
      patient: patients[2],
      status: "pending",
      paymentStatus: "unpaid",
      totalAmount: 18000,
      depositAmount: 5400,
    },
    {
      date: setMinutes(setHours(today, 14), 0),
      patient: patients[3],
      status: "confirmed",
      paymentStatus: "deposit_paid",
      totalAmount: 18000,
      depositAmount: 5400,
    },
    {
      date: setMinutes(setHours(today, 15), 0),
      patient: patients[4],
      status: "cancelled",
      paymentStatus: "unpaid",
      totalAmount: 18000,
      depositAmount: 5400,
    },
    {
      date: setMinutes(setHours(tomorrow, 9), 0),
      patient: patients[0],
      status: "confirmed",
      paymentStatus: "deposit_paid",
      totalAmount: 18000,
      depositAmount: 5400,
    },
  ];

  for (const a of appointmentsData) {
    await db.appointment.create({
      data: {
        professionalId: professional.id,
        patientId: a.patient.id,
        patientName: a.patient.name,
        patientPhone: a.patient.phone,
        date: a.date,
        durationMin: 50,
        status: a.status,
        paymentStatus: a.paymentStatus,
        totalAmount: a.totalAmount,
        depositAmount: a.depositAmount,
      },
    });
  }

  console.log("Turnos creados:", appointmentsData.length);
  console.log("Seed completado ✅");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
