import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Uso · Agendify",
  description:
    "Condiciones de uso del servicio Agendify para profesionales de la salud.",
};

const LAST_UPDATED = "4 de mayo de 2026";

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16 text-text-primary">
      <Link
        href="/login"
        className="text-sm text-primary hover:underline"
      >
        ← Volver
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Términos de Uso
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Última actualización: {LAST_UPDATED}
      </p>

      <Section title="1. Aceptación">
        <p>
          Estos términos regulan el uso del servicio Agendify (en adelante,
          el &ldquo;Servicio&rdquo; o &ldquo;Agendify&rdquo;), prestado en la
          República Argentina.
        </p>
        <p>
          Al crear una cuenta o usar el Servicio, declarás haber leído y
          aceptar estos términos y la{" "}
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
          . Si no estás de acuerdo, no podés usar el Servicio.
        </p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>
          Agendify es una plataforma online que permite a profesionales de la
          salud (psicólogos, médicos, kinesiólogos y similares) gestionar:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Su agenda de turnos y disponibilidad horaria</li>
          <li>El cobro de señas mediante transferencia bancaria o Mercado Pago</li>
          <li>Una página pública de reserva para que sus pacientes agenden</li>
          <li>Recordatorios automáticos por email</li>
          <li>Una ficha básica del paciente con notas privadas</li>
        </ul>
        <p>
          El Servicio es una herramienta de gestión: no presta servicios
          médicos ni psicológicos, no diagnostica ni reemplaza el criterio
          profesional.
        </p>
      </Section>

      <Section title="3. Cuenta y registro">
        <p>
          Para usar el Servicio necesitás una cuenta, que se crea iniciando
          sesión con Google. Te comprometés a:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Brindar información verdadera, exacta y actualizada</li>
          <li>Mantener la confidencialidad de tu acceso a Google</li>
          <li>Ser responsable de toda actividad realizada desde tu cuenta</li>
          <li>
            Acreditar, si te lo requerimos, tu condición de profesional
            habilitado para ejercer (matrícula, título, etc.)
          </li>
        </ul>
        <p>
          Podemos suspender o cancelar cuentas con información falsa o que se
          usen de modo contrario a estos términos.
        </p>
      </Section>

      <Section title="4. Uso aceptable">
        <p>No podés usar el Servicio para:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Actividades ilegales o que violen derechos de terceros</li>
          <li>Cargar datos de pacientes sin su consentimiento</li>
          <li>
            Enviar comunicaciones no solicitadas (spam) a pacientes o terceros
          </li>
          <li>Intentar vulnerar la seguridad o disponibilidad del Servicio</li>
          <li>
            Ofrecer prestaciones que requieran habilitación especial sin
            contar con ella
          </li>
          <li>Hacer ingeniería inversa, copiar o revender el Servicio</li>
        </ul>
      </Section>

      <Section title="5. Responsabilidad sobre los datos de pacientes">
        <p>
          Sos el <strong>responsable del tratamiento</strong> de los datos
          personales de tus pacientes. Eso incluye:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Obtener su consentimiento informado para registrar y procesar sus
            datos
          </li>
          <li>
            Cumplir con el secreto profesional y la normativa específica de tu
            profesión (Ley 26.529 de derechos del paciente, código de ética
            colegial, etc.)
          </li>
          <li>
            Atender los pedidos de acceso, rectificación o supresión que tus
            pacientes te realicen sobre sus propios datos
          </li>
          <li>
            Resguardar la confidencialidad de las notas clínicas que cargues
            en la plataforma
          </li>
        </ul>
        <p>
          Agendify actúa como <em>encargado del tratamiento</em> y no usa los
          datos de pacientes para ninguna finalidad ajena a la prestación del
          Servicio. Para más detalle, ver la{" "}
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </Section>

      <Section title="6. Suscripción y pagos">
        <p>
          El Servicio se ofrece bajo modalidad de suscripción mensual. Durante
          la fase beta, profesionales con código de invitación pueden acceder
          gratis por el período indicado al canjear el código. Pasado ese
          período, el acceso continuará sujeto al pago de la suscripción
          vigente.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            El precio vigente y la modalidad de cobro se informan en la
            plataforma antes de activar la suscripción.
          </li>
          <li>
            Los pagos se procesan a través de Mercado Pago. Agendify no
            almacena datos completos de tarjetas de crédito.
          </li>
          <li>
            Podés cancelar la suscripción en cualquier momento. La cancelación
            tiene efecto al final del período pagado.
          </li>
          <li>
            No hay reembolsos por períodos parciales ya facturados, salvo
            obligación legal en contrario.
          </li>
          <li>
            Podemos modificar el precio con preaviso de al menos 30 días por
            email o desde la plataforma.
          </li>
        </ul>
        <p>
          Las señas y pagos que tus pacientes te realizan a través del Servicio
          son una transacción entre vos y tus pacientes. Agendify <strong>no es
          parte</strong> de esa transacción y no asume responsabilidad por
          incumplimientos, devoluciones o conflictos derivados de la prestación
          profesional.
        </p>
      </Section>

      <Section title="7. Propiedad intelectual">
        <p>
          El Servicio, su código, diseño, marca y contenidos son propiedad de
          Agendify o de sus licenciantes y están protegidos por las leyes de
          propiedad intelectual. Te otorgamos una licencia limitada,
          revocable, no exclusiva e intransferible para usar el Servicio.
        </p>
        <p>
          Los datos que cargás (perfil, pacientes, turnos, notas) siguen
          siendo de tu propiedad. Nos otorgás una licencia limitada
          únicamente para procesarlos y prestarte el Servicio.
        </p>
      </Section>

      <Section title="8. Disponibilidad y modificaciones del servicio">
        <p>
          Hacemos esfuerzos razonables para mantener el Servicio disponible,
          pero no garantizamos disponibilidad ininterrumpida. Podemos
          realizar mantenimientos programados o agregar, modificar o
          discontinuar funcionalidades.
        </p>
        <p>
          Si discontinuamos el Servicio en su totalidad, te lo avisaremos con
          al menos 60 días de anticipación y te daremos la posibilidad de
          exportar tus datos.
        </p>
      </Section>

      <Section title="9. Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley, Agendify no será
          responsable por:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Daños indirectos, lucro cesante, pérdida de oportunidad o pérdida
            de reputación
          </li>
          <li>Errores derivados de información incorrecta cargada por vos o tus pacientes</li>
          <li>
            Indisponibilidad temporal del Servicio por causas ajenas a
            nuestro control razonable (fuerza mayor, fallas de proveedores
            externos, ataques)
          </li>
          <li>Resultados clínicos o profesionales de tu actividad</li>
        </ul>
        <p>
          La responsabilidad total acumulada de Agendify por cualquier reclamo
          relacionado con el Servicio queda limitada al monto efectivamente
          pagado por vos en concepto de suscripción durante los 12 meses
          previos al hecho que da origen al reclamo.
        </p>
      </Section>

      <Section title="10. Terminación">
        <p>
          Podés dar de baja tu cuenta en cualquier momento desde el panel de
          ajustes o solicitándolo a nuestro contacto.
        </p>
        <p>
          Podemos suspender o terminar tu cuenta si incumplís estos términos,
          si detectamos uso fraudulento o si una autoridad competente nos lo
          requiere. Te notificaremos por email cuando sea posible.
        </p>
        <p>
          Al darse de baja la cuenta, tus datos y los datos de tus pacientes
          se eliminan o anonimizan dentro de los 30 días, salvo retención
          legal obligatoria.
        </p>
      </Section>

      <Section title="11. Modificaciones a estos términos">
        <p>
          Podemos actualizar estos términos. Si los cambios son sustanciales,
          te lo avisaremos por email o desde la plataforma con al menos
          15 días de anticipación. Si seguís usando el Servicio luego de la
          entrada en vigencia, se considerará que aceptaste los nuevos
          términos.
        </p>
      </Section>

      <Section title="12. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República Argentina.
          Cualquier controversia se someterá a la competencia de los
          tribunales ordinarios de la ciudad de <strong>Rosario, Provincia de
          Santa Fe</strong>, con renuncia expresa a cualquier otro fuero o
          jurisdicción.
        </p>
        <p>
          Si fueras consumidor final en los términos de la Ley 24.240, podrás
          recurrir a las autoridades de aplicación correspondientes.
        </p>
      </Section>

      <Section title="13. Contacto">
        <p>
          Para consultas sobre estos términos, escribí a{" "}
          <a
            href="mailto:legal@agendify.com.ar"
            className="text-primary hover:underline"
          >
            legal@agendify.com.ar
          </a>
          .
        </p>
      </Section>

      <div className="mt-12 border-t border-border pt-6 text-sm text-text-secondary">
        <Link href="/privacidad" className="text-primary hover:underline">
          Ver Política de Privacidad →
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 space-y-3 text-sm leading-relaxed sm:text-base">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
