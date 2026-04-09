import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  console.log(`[Recordatorios] Cron ejecutado: ${now.toISOString()}`);

  let processed = 0;
  let sent = 0;
  let errors = 0;

  // TODO: Reemplazar con consulta real a DB cuando esté conectada
  // Lógica real:
  // 1. Buscar turnos con status 'confirmed' cuya fecha sea:
  //    - Entre 47h y 49h desde ahora → enviar recordatorio 48h
  //    - Entre 1h 45min y 2h 15min desde ahora → enviar recordatorio 2h
  // 2. Para cada turno encontrado:
  //    - Verificar que no se haya enviado ya (reminder48hSent / reminder2hSent)
  //    - Enviar WhatsApp via POST /api/whatsapp/send
  //    - Marcar como enviado en DB

  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  console.log(`[Recordatorios] Buscando turnos para:`);
  console.log(`  - Recordatorio 48h: turnos alrededor de ${in48h.toISOString()}`);
  console.log(`  - Recordatorio 2h: turnos alrededor de ${in2h.toISOString()}`);
  console.log(`[Recordatorios] Sin conexión a DB — simulación solamente`);

  // Simulación: sin DB, no hay turnos que procesar
  processed = 0;
  sent = 0;
  errors = 0;

  return NextResponse.json({
    processed,
    sent,
    errors,
    timestamp: now.toISOString(),
  });
}
