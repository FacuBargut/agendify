import { twiml } from "twilio";

export async function POST(request: Request) {
  const body = await request.formData();
  const from = body.get("From") as string;
  const messageBody = body.get("Body") as string;

  console.log(`[Twilio Webhook] Mensaje de ${from}: "${messageBody}"`);

  const response = new twiml.MessagingResponse();
  const text = (messageBody || "").trim().toLowerCase();

  if (text.includes("si") || text.includes("sí") || text === "1") {
    console.log(`[Twilio Webhook] Turno confirmado por paciente: ${from}`);
    // TODO: actualizar estado en DB a 'confirmed'
    response.message(
      "✅ ¡Perfecto! Tu turno está confirmado. ¡Te esperamos!"
    );
  } else if (
    text.includes("no") ||
    text === "0" ||
    text.includes("cancel")
  ) {
    console.log(`[Twilio Webhook] Turno cancelado por paciente: ${from}`);
    // TODO: actualizar estado en DB y liberar slot
    response.message(
      "❌ Entendido, tu turno fue cancelado. Si querés reservar otro podés hacerlo desde el link del profesional."
    );
  } else {
    response.message(
      "Hola! Para confirmar tu turno respondé *SI* o para cancelarlo respondé *NO*."
    );
  }

  return new Response(response.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
