# CRM Inmobiliario

CRM para la gestión de leads inmobiliarios con auto-asignación por zona, chat en tiempo real y dashboard inteligente. Los leads llegan desde WhatsApp mediante un bot en n8n, se puntúan y asignan automáticamente a vendedores disponibles.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Base de datos:** PostgreSQL 16
- **Tiempo real:** Socket.IO
- **Deploy:** Frontend en Vercel, Backend en Railway

## URLs en producción

| Servicio | URL |
|---|---|
| Frontend | https://client-tau-six-82.vercel.app |
| Backend API | https://backend-production-9eab.up.railway.app |

## Credenciales demo

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@inmo.com | admin123 |
| Vendor | carlos@inmo.com | vendedor123 |
| Vendor | ana@inmo.com | vendedor123 |
| Vendor | luis@inmo.com | vendedor123 |

## Inicio rápido (desarrollo local)

```bash
# 1. PostgreSQL con Docker
docker run -d --name crm-pg \
  -e POSTGRES_USER=crm \
  -e POSTGRES_PASSWORD=crm123 \
  -e POSTGRES_DB=crm_inmobiliario \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Instalar dependencias
npm install

# 3. Migrar DB y seed
cd server
cp .env.example .env  # si existe
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 4. Servidor (puerto 3001)
npm run dev

# 5. Cliente (puerto 5173) — otra terminal
cd ../client
npm run dev
```

## Webhooks para n8n

### 1. Recibir un lead nuevo

**POST** `/api/webhook/n8n/lead`

```json
{
  "telefono": "595981123456",
  "nombre": "Juan Pérez",
  "mensaje": "Hola, quiero info sobre lotes en Capiatá",
  "ciudad": "Capiata",
  "nombre_fraccion": "Los Alpes",
  "quiere_asesor": true,
  "quiere_visita": false,
  "quiere_reserva": false,
  "presupuesto_cuota": "500000",
  "intent": "consultar_financiacion",
  "proposito": "inversion"
}
```

El CRM **auto-puntúa** (score 0–100), **asigna vendedor** por ciudad (si está disponible), y emite eventos por Socket.IO.

### 2. Guardar interacciones (mensajes del bot)

**POST** `/api/webhook/n8n/interaction`

```json
{
  "telefono": "595981123456",
  "mensaje": "¡Claro! Tenemos lotes desde ₲300.000/mes",
  "role": "BOT",
  "intent": "consultar_financiacion"
}
```

### Flujo típico en n8n

```
[WhatsApp Webhook] → [Meta: Message Received]
         ↓
[Code: Extraer datos del msg]
         ↓
[HTTP Request: POST /api/webhook/n8n/lead]  ← primer msg del contacto
         ↓
[HTTP Request: POST /api/webhook/n8n/interaction]  ← cada respuesta del bot
```

### Campos que mapea el CRM

| Campo en n8n | Campo en CRM | Efecto |
|---|---|---|
| `telefono` | phone | **Requerido**. Clave única |
| `nombre` | name | Nombre del lead |
| `mensaje` | interaction | Se guarda como rol `USER` |
| `ciudad` | ciudad | Determina zona + vendedor |
| `nombre_fraccion` | nombreFraccion | +15 puntos al score |
| `quiere_asesor` | quiereAsesor | +30 puntos, prioridad ALTA |
| `quiere_visita` | quiereVisita | +25 puntos al score |
| `quiere_reserva` | quiereReserva | +40 puntos, prioridad URGENTE |
| `presupuesto_cuota` | presupuestoCuota | +10 puntos al score |
| `intent` | intent, ultimoEstado | Define stage (CONSULTO_CUOTAS, QUIERE_VISITA, etc.) |
| `proposito` | proposito | +5 puntos al score |

### Mapa de zonas → vendedores

| Ciudad | Vendedor | Zona |
|---|---|---|
| Capiatá, Altos, Yaguarón, Piribebuy, Eusebio Ayala, Arroyos y Esteros | Carlos | CENTRAL |
| Encarnación, Fram, Tomás Romero Pereira | Ana | ITAPUA |
| Coronel Oviedo, Caaguazú, Minga Guazú | Luis | CAAGUAZU |
| Otras | sin asignar | GENERAL |

### Probar los webhooks con curl

```bash
# Crear lead
curl -X POST https://backend-production-9eab.up.railway.app/api/webhook/n8n/lead \
  -H 'Content-Type: application/json' \
  -d '{"telefono":"595981123456","nombre":"Test","ciudad":"Capiata","quiere_asesor":true}'

# Guardar interacción
curl -X POST https://backend-production-9eab.up.railway.app/api/webhook/n8n/interaction \
  -H 'Content-Type: application/json' \
  -d '{"telefono":"595981123456","mensaje":"Hola, ¿cómo estás?","role":"BOT"}'
```
