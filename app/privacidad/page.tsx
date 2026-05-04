import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad · Agendify",
  description:
    "Cómo Agendify recolecta, usa y protege los datos personales de profesionales y pacientes.",
};

const LAST_UPDATED = "4 de mayo de 2026";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16 text-text-primary">
      <Link
        href="/login"
        className="text-sm text-primary hover:underline"
      >
        ← Volver
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Última actualización: {LAST_UPDATED}
      </p>

      <Section title="1. Quiénes somos">
        <p>
          Agendify (en adelante, &ldquo;Agendify&rdquo; o &ldquo;nosotros&rdquo;)
          es un servicio prestado en la República Argentina.
        </p>
        <p>
          Esta política describe qué datos personales recolectamos, con qué
          finalidad, cómo los protegemos y qué derechos tenés sobre ellos, en
          cumplimiento de la <strong>Ley 25.326 de Protección de Datos
          Personales</strong> y demás normativa argentina aplicable.
        </p>
      </Section>

      <Section title="2. Roles y responsabilidades">
        <p>
          Agendify funciona como herramienta para que profesionales de la
          salud gestionen sus turnos, pacientes y cobros. Distinguimos dos
          roles a los efectos del tratamiento de datos:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Profesional:</strong> es el <em>responsable del tratamiento</em> de
            los datos de sus pacientes. Decide qué datos cargar y con qué
            finalidad.
          </li>
          <li>
            <strong>Agendify:</strong> es el <em>encargado del tratamiento</em> de los
            datos de pacientes (los procesa por cuenta del profesional) y el
            responsable del tratamiento de los datos del propio profesional
            (cuenta, suscripción, soporte).
          </li>
        </ul>
      </Section>

      <Section title="3. Qué datos recolectamos">
        <h3 className="mt-4 text-base font-semibold">3.1 Datos del profesional</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Nombre, email y foto de perfil (provistos por Google al iniciar sesión)</li>
          <li>Especialidad, biografía, teléfono, slug público</li>
          <li>Configuración del servicio: precio de sesión, duración, disponibilidad horaria</li>
          <li>Datos de cobro: alias/CBU bancario o identificadores de Mercado Pago</li>
          <li>Datos técnicos: dirección IP, navegador, eventos de uso de la plataforma</li>
        </ul>

        <h3 className="mt-6 text-base font-semibold">3.2 Datos de pacientes</h3>
        <p>
          El profesional carga, o recibe a través del enlace público de
          reserva, los siguientes datos de sus pacientes:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Nombre y apellido</li>
          <li>Teléfono</li>
          <li>Email (opcional)</li>
          <li>Notas clínicas o de seguimiento ingresadas por el profesional</li>
          <li>Comprobantes de transferencia o identificadores de pago</li>
          <li>Historial de turnos y estados (confirmado, cancelado, completado, etc.)</li>
        </ul>
        <p>
          Las notas clínicas, junto con la información sobre tratamientos o
          consultas, constituyen <strong>datos sensibles</strong> en los términos
          del art. 7 de la Ley 25.326 y reciben un tratamiento reforzado.
        </p>
      </Section>

      <Section title="4. Para qué usamos los datos">
        <ul className="list-disc space-y-2 pl-6">
          <li>Crear y mantener la cuenta del profesional</li>
          <li>Procesar reservas, recordatorios y cobros de turnos</li>
          <li>Enviar emails transaccionales (confirmaciones, recordatorios, notificaciones)</li>
          <li>Procesar pagos a través de proveedores externos</li>
          <li>Soporte técnico</li>
          <li>Mejorar el producto en base a métricas agregadas y anónimas</li>
          <li>Cumplir obligaciones legales, contables y fiscales</li>
        </ul>
      </Section>

      <Section title="5. Base legal">
        <p>El tratamiento se basa, según el caso, en:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Consentimiento libre, expreso e informado</strong> del titular
            (profesional al registrarse; paciente al reservar a través del link
            público).
          </li>
          <li>
            <strong>Ejecución de un contrato</strong> del que el titular es parte
            (suscripción al servicio).
          </li>
          <li>
            <strong>Cumplimiento de obligaciones legales</strong> (facturación,
            requerimientos judiciales).
          </li>
          <li>
            <strong>Interés legítimo</strong> en la seguridad y mejora del servicio,
            cuando no afecte derechos del titular.
          </li>
        </ul>
      </Section>

      <Section title="6. Con quién compartimos los datos">
        <p>
          Trabajamos con proveedores que nos prestan servicios necesarios para
          operar la plataforma. Cada uno accede solo a los datos estrictamente
          necesarios y bajo acuerdos de confidencialidad y tratamiento de datos.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Google LLC</strong> — autenticación (OAuth)</li>
          <li><strong>Vercel Inc.</strong> — hosting y CDN</li>
          <li><strong>Resend</strong> — envío de emails transaccionales</li>
          <li><strong>Mercado Pago S.R.L.</strong> — procesamiento de pagos</li>
          <li><strong>Twilio Inc.</strong> — envío de mensajes (cuando aplica)</li>
          <li><strong>Proveedor de base de datos PostgreSQL</strong> — almacenamiento</li>
        </ul>
        <p>
          Nunca vendemos ni cedemos datos a terceros con fines comerciales o
          publicitarios.
        </p>
      </Section>

      <Section title="7. Transferencias internacionales">
        <p>
          Algunos de nuestros proveedores tienen servidores fuera de la
          República Argentina (principalmente en Estados Unidos y la Unión
          Europea). En esos casos, exigimos a cada proveedor garantías
          contractuales y técnicas de protección equivalentes a las requeridas
          por la legislación argentina.
        </p>
      </Section>

      <Section title="8. Cuánto tiempo guardamos los datos">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Datos de cuenta del profesional:</strong> mientras la cuenta
            esté activa y hasta 5 años después de su baja, por motivos
            contables, fiscales y de eventuales reclamos.
          </li>
          <li>
            <strong>Datos de pacientes:</strong> mientras el profesional los
            mantenga en su cuenta. Si el profesional da de baja la cuenta, los
            datos se eliminan o anonimizan dentro de los 30 días, salvo que
            exista obligación legal de conservarlos por más tiempo.
          </li>
          <li>
            <strong>Logs técnicos:</strong> hasta 12 meses.
          </li>
        </ul>
      </Section>

      <Section title="9. Cómo protegemos los datos">
        <p>Aplicamos medidas técnicas y organizativas razonables, incluyendo:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Cifrado en tránsito (HTTPS/TLS) en toda la plataforma</li>
          <li>Cifrado en reposo en la base de datos</li>
          <li>Autenticación con OAuth de Google (sin contraseñas en nuestros servidores)</li>
          <li>Acceso restringido a datos solo al equipo autorizado</li>
          <li>Backups periódicos</li>
          <li>Registro de eventos de seguridad relevantes</li>
        </ul>
        <p>
          Ningún sistema es invulnerable. Si tomás conocimiento de un incidente
          de seguridad, escribinos cuanto antes a la dirección de contacto.
        </p>
      </Section>

      <Section title="10. Tus derechos (Habeas Data)">
        <p>
          Como titular de datos personales, tenés derecho a:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Acceso:</strong> saber qué datos tuyos tenemos</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos</li>
          <li><strong>Supresión:</strong> pedir la eliminación de tus datos</li>
          <li><strong>Oposición:</strong> oponerte a ciertos tratamientos</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
        </ul>
        <p>
          Para ejercer estos derechos, escribí a{" "}
          <a
            href="mailto:legal@agendify.com.ar"
            className="text-primary hover:underline"
          >
            legal@agendify.com.ar
          </a>
          . Te responderemos dentro de los plazos legales (10 días corridos para
          acceso, 5 días hábiles para rectificación o supresión).
        </p>
        <p>
          También tenés derecho a presentar reclamos ante la{" "}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>,
          autoridad de control en Argentina:{" "}
          <a
            href="https://www.argentina.gob.ar/aaip"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:underline"
          >
            argentina.gob.ar/aaip
          </a>
          .
        </p>
      </Section>

      <Section title="11. Cookies y tecnologías similares">
        <p>
          Usamos cookies estrictamente necesarias para mantener la sesión y la
          seguridad de la plataforma. No usamos cookies de publicidad ni de
          terceros con fines de tracking.
        </p>
      </Section>

      <Section title="12. Cambios a esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios en el servicio
          o en la legislación. Si los cambios son sustanciales, te lo
          notificaremos por email o dentro de la plataforma con al menos
          15 días de anticipación. La fecha de &ldquo;última actualización&rdquo;
          al inicio refleja la versión vigente.
        </p>
      </Section>

      <Section title="13. Contacto">
        <p>
          Para consultas sobre privacidad, escribí a{" "}
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
        <Link href="/terminos" className="text-primary hover:underline">
          Ver Términos de Uso →
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
