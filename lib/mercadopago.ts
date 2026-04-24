import { MercadoPagoConfig, Preference } from "mercadopago";

// El token se valida en cada route handler antes de usarse,
// pero inicializamos el cliente igual para que Preference esté listo.
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "MISSING_TOKEN",
});

export const mp = new Preference(client);

export function calculateDeposit(
  totalAmount: number,
  depositPercent: number
): number {
  return Math.round(totalAmount * (depositPercent / 100));
}
