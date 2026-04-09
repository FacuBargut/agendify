import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const mp = new Preference(client);

export function calculateDeposit(
  totalAmount: number,
  depositPercent: number
): number {
  return Math.round(totalAmount * (depositPercent / 100));
}
