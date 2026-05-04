// Genera N codigos beta con duracion configurable y los imprime al stdout
// para copiar/mandar manualmente (WhatsApp, mail, etc.).
//
// Uso:
//   npx tsx scripts/generate-beta-codes.ts --count 10 --days 90 --notes "campania ig mayo"
//
// Defaults: count=5, days=90, sin notes.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import crypto from "crypto";

interface Args {
  count: number;
  days: number;
  notes: string | null;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { count: 5, days: 90, notes: null };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--count") out.count = Number(argv[++i]);
    else if (arg === "--days") out.days = Number(argv[++i]);
    else if (arg === "--notes") out.notes = argv[++i];
  }

  if (!Number.isFinite(out.count) || out.count <= 0) {
    throw new Error("--count debe ser un entero positivo");
  }
  if (!Number.isFinite(out.days) || out.days <= 0) {
    throw new Error("--days debe ser un entero positivo");
  }
  return out;
}

// Codigo legible: "AGND-XXXX" donde XXXX evita caracteres ambiguos (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = crypto.randomBytes(4);
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `AGND-${suffix}`;
}

async function main() {
  const args = parseArgs();
  const { db } = await import("../lib/db");

  const created: string[] = [];
  for (let i = 0; i < args.count; i++) {
    // Reintentar hasta encontrar uno unico (chocar contra un duplicado es
    // raro con 31^4 ~= 900k combinaciones pero por las dudas).
    let attempts = 0;
    while (attempts < 5) {
      const code = generateCode();
      try {
        await db.betaCode.create({
          data: {
            code,
            validForDays: args.days,
            notes: args.notes,
          },
        });
        created.push(code);
        break;
      } catch (err: unknown) {
        const isUnique =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: string }).code === "P2002";
        if (!isUnique) throw err;
        attempts++;
      }
    }
  }

  console.log(`\nGenerados ${created.length} codigos (${args.days} dias):\n`);
  for (const c of created) console.log(`  ${c}`);
  console.log();

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
