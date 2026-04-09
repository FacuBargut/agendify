# Como probar el pago con Mercado Pago

## 1. Obtener credenciales de prueba
- Ir a mercadopago.com.ar/developers/panel
- Credenciales > Credenciales de prueba
- Copiar Access Token (empieza con TEST-)
- Pegarlo en .env.local como MP_ACCESS_TOKEN

## 2. Tarjetas de prueba de MP
Visa aprobada:    4509 9535 6623 3704
Mastercard:       5031 7557 3453 0604
CVV: cualquier numero de 3 digitos
Vencimiento: cualquier fecha futura
Nombre: APRO (para que se apruebe automaticamente)

## 3. Probar el webhook localmente
- Instalar ngrok: brew install ngrok
- ngrok http 3000
- Copiar la URL https de ngrok
- Pegarla en NEXT_PUBLIC_APP_URL del .env.local
- Reiniciar el servidor

## 4. Flujo completo de prueba
1. Ir a localhost:3000/dra-garcia
2. Seleccionar fecha y horario
3. Completar el formulario
4. Click en "Pagar sena con Mercado Pago"
5. Usar tarjeta de prueba de arriba
6. Verificar redireccion a /dra-garcia/confirmar?status=success
7. Verificar en consola del servidor que el webhook se recibio

---

# Como probar WhatsApp con Twilio Sandbox

## Setup inicial (solo una vez)
1. Crear cuenta en twilio.com
2. Ir a: Console > Messaging > Try it out > Send a WhatsApp message
3. Escanear el QR o enviar "join [tu-palabra]" al numero +1 415 523 8886
4. Tu numero personal quedara habilitado para el sandbox

## Probar envio manual

POST http://localhost:3000/api/whatsapp/send
Content-Type: application/json

```json
{
  "type": "confirmacion",
  "patientPhone": "341XXXXXXX",
  "patientName": "Test Paciente",
  "professionalName": "Dra. Garcia",
  "date": "2025-04-20T14:00:00.000Z",
  "time": "11:00",
  "depositAmount": 5400,
  "professionalSlug": "dra-garcia"
}
```

## Usar Postman o Thunder Client (extension de VS Code)
Para probar los endpoints sin escribir codigo.

## Probar respuestas del paciente (webhook Twilio)
1. Configurar el webhook URL en Twilio Console:
   - Ir a Messaging > Settings > WhatsApp sandbox settings
   - En "When a message comes in" poner: https://[tu-ngrok].ngrok.io/api/webhooks/twilio
2. Enviar "SI" o "NO" desde tu WhatsApp al numero del sandbox
3. Verificar que recibis la respuesta automatica

## Probar recordatorios (cron)
GET http://localhost:3000/api/recordatorios

Respuesta esperada:
```json
{
  "processed": 0,
  "sent": 0,
  "errors": 0,
  "timestamp": "2025-04-09T..."
}
```

---

# Autenticacion con Google (NextAuth v5)

## 1. Crear credenciales de Google OAuth
1. Ir a https://console.cloud.google.com/apis/credentials
2. Crear un proyecto nuevo (o usar uno existente)
3. APIs & Services > Credentials > Create Credentials > OAuth Client ID
4. Application type: Web application
5. Authorized JavaScript origins: http://localhost:3000
6. Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
7. Copiar Client ID y Client Secret

## 2. Configurar .env.local
```
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
NEXTAUTH_SECRET="resultado-de-openssl-rand-base64-32"
```

Generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## 3. Flujo de prueba
1. Ir a localhost:3000/agenda (te redirige a /login)
2. Click en "Continuar con Google"
3. Seleccionar cuenta de Google
4. Se crea automaticamente el profesional en la DB
5. Redireccion a /agenda con la sesion activa
6. Verificar nombre e iniciales en el Header
7. Abrir dropdown del avatar > "Cerrar sesion"
8. Verificar redireccion a /login

## 4. Verificar profesional creado
```bash
npx prisma studio
```
Abrir tabla Professional y verificar que se creo con el email de Google.

---

# Base de datos

## Setup local
1. Instalar PostgreSQL: brew install postgresql@16
2. Crear la DB: createdb agendify
3. Configurar .env.local: DATABASE_URL="postgresql://TU_USUARIO@localhost:5432/agendify"
4. Correr migraciones: npx prisma migrate dev
5. Correr seed: npx prisma db seed
6. Verificar datos: npx prisma studio (abre en localhost:5555)

## Base de datos en Railway (produccion)
1. Entrar a railway.app
2. New Project > Add a service > Database > PostgreSQL
3. Click en la DB > Variables > DATABASE_URL
4. Copiar la URL completa
5. Agregarla como variable de entorno en Vercel:
   Settings > Environment Variables > DATABASE_URL
6. Correr migraciones contra produccion:
   DATABASE_URL=URL_DE_RAILWAY npx prisma migrate deploy
