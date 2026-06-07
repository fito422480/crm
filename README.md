# CRM Inmobiliario

CRM para la gestión de leads inmobiliarios con auto-asignación por zona, chat en tiempo real y dashboard inteligente. Los leads llegan desde WhatsApp mediante un bot en n8n, se puntúan y asignan automáticamente a vendedores disponibles.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Base de datos:** PostgreSQL 16 (Docker)
- **Tiempo real:** Socket.IO

## Requisitos

- Node.js 20+
- Docker

## Inicio rápido

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
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts

# 4. Servidor (puerto 3001)
npm run dev

# 5. Cliente (puerto 5173) — otra terminal
cd ../client
npm run dev
```

## Credenciales demo

| Rol    | Email              | Contraseña   |
|--------|--------------------|--------------|
| Admin  | admin@inmo.com     | admin123     |
| Vendor | carlos@inmo.com    | vendedor123  |
| Vendor | ana@inmo.com       | vendedor123  |
| Vendor | luis@inmo.com      | vendedor123  |

## Webhook n8n

```
POST http://<host>:3001/api/webhook/n8n/lead
POST http://<host>:3001/api/webhook/n8n/interaction
```
