# Claude Meta Ads — Reporte de Creativos

## Stack
- Next.js 14 con App Router
- TypeScript + Tailwind CSS
- Meta Graph API v19.0 (llamadas directas, sin SDK)
- Deploy: Vercel (frontend + API routes)

## Comandos
- `npm run dev` — servidor local en http://localhost:3000
- `npm run build` — build de producción
- `npm run lint` — lint

## Variables de entorno
Copiar `.env.example` a `.env.local` y completar:
- `META_ACCESS_TOKEN` — Long-lived user token con permisos: `ads_read`, `ads_management`
- `META_AD_ACCOUNT_IDS` — IDs separados por coma (formato: `act_XXXXXXXXX`)
- `META_APP_ID` / `META_APP_SECRET` — Credenciales de la app en Meta for Developers

## Estructura
- `lib/meta.ts` — cliente de Meta API: getAdAccounts(), getCreativeInsights()
- `lib/fatigue.ts` — lógica de alertas de fatiga creativa
- `app/api/accounts/` — endpoint que devuelve lista de cuentas
- `app/api/insights/` — endpoint que devuelve insights de creativos por cuenta y período
- `app/page.tsx` — selector de cuentas
- `app/accounts/[id]/creatives/` — reporte de creativos
- `components/CreativesTable.tsx` — tabla con ordenamiento por columna
- `components/FatigueAlerts.tsx` — alertas de fatiga

## Umbrales de fatiga (lib/fatigue.ts → THRESHOLDS)
- Frecuencia > 3
- CTR cae > 20% vs período anterior
- CPA sube > 30% vs período anterior

## Convenciones
- Siempre TypeScript strict
- Dark theme (bg-gray-950)
- Formateo de números en es-AR (punto de miles, coma decimal)
- No usar `any` salvo casos extremos documentados
- API de Meta: versión fija v19.0, cache revalidate 300s

## Deploy
1. Push a GitHub
2. Conectar repo en Vercel
3. Agregar env vars en Vercel dashboard (nunca en el repo)
