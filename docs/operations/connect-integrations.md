# Instalar y conectar OREBAL Studio

OREBAL Studio es autohospedable. Cada instalación representa una organización y su owner configura sus propios IDs, credenciales, base de datos y carpeta. Los nombres usados en pruebas son ejemplos, no cuentas preconfiguradas.

## 1. Requisitos

- Node.js compatible con Next.js 16 y Python 3.11 o posterior.
- Un bot privado de Telegram, un proyecto Supabase y, si se desean archivos reales, Google Drive API.
- Un despliegue Vercel (o servidor compatible) cuyo directorio raíz sea `apps/control-plane`.

Instala dependencias con `npm ci` dentro de `apps/control-plane` y copia `.env.example` a `.env.local`. Nunca confirmes el archivo con valores reales.

## 2. Identidad de la instalación

Configura `OREBAL_ORGANIZATION_ID` con una clave estable propia. `TELEGRAM_OWNER_ID` es el ID numérico del owner y `TELEGRAM_PRIVATE_CHAT_ID` el chat privado permitido. No uses nombres de usuario como control de acceso.

Genera secretos independientes para `TELEGRAM_WEBHOOK_SECRET` e `INTERNAL_WORKER_SECRET`. Mantén `OREBAL_ADAPTER_MODE=fake` para las pruebas locales. El modo `real` está reservado hasta completar el wiring del runtime y certificar los adaptadores indicados como pendientes en la matriz de capacidades.

## 3. Supabase

1. Crea un proyecto por instalación o aplica una política de aislamiento equivalente.
2. Ejecuta en orden los archivos de `supabase/migrations/`.
3. Configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor.
4. Verifica RLS, organización activa, deduplicación y reclamo de cola con una cuenta de prueba antes de aceptar encargos.

La service-role key jamás debe llegar al navegador. El panel y el worker deben leer por adaptadores del servidor.

## 4. Telegram

1. Crea el bot con BotFather y conserva su token en el gestor de secretos del host.
2. Publica `POST /api/telegram/webhook` y registra esa URL mediante `setWebhook`.
3. Al registrar el webhook, usa como `secret_token` exactamente el valor de `TELEGRAM_WEBHOOK_SECRET`.
4. Envía un mensaje desde el chat privado configurado y confirma que un usuario o chat diferente recibe rechazo.

El endpoint valida secreto, owner numérico y chat privado antes de procesar o encolar. Los callbacks contienen tokens opacos, no permisos ni IDs confiables enviados por el cliente.

## 5. Google Drive

Configura `DRIVE_ROOT_FOLDER_ID` con una carpeta dedicada. Autoriza una cuenta de servicio o OAuth según la política de tu organización y comparte la carpeta con esa identidad. En Shared Drives, concede el rol mínimo que permita crear carpetas, archivos y shortcuts. Guarda credenciales únicamente en secretos del servidor.

Ejecuta primero una prueba que cree y vuelva a conciliar la misma estructura. La segunda ejecución debe reutilizar IDs, no duplicar carpetas.

## 6. Vercel o servidor propio

Cuando el wiring real esté certificado, en Vercel selecciona `apps/control-plane` como **Root Directory**, carga las variables y despliega. Protege `GET /api/internal/worker` con `INTERNAL_WORKER_SECRET`; `vercel.json` programa un despertar diario conservador. Ajusta frecuencia, duración, concurrencia y presupuesto a los límites reales de tu plan.

En otro servidor, ejecuta el mismo endpoint mediante un scheduler autenticado. Una respuesta del webhook solo confirma recepción; revisa el estado durable del trabajo.

## 7. Certificación de una instalación

```bash
cd apps/control-plane
npm test
npm run typecheck
npm run build
cd ../..
python -m unittest discover -s tests -v
```

Después prueba Telegram, Supabase, Drive y el despliegue con credenciales no productivas. Registra por separado qué fue probado con dobles y qué fue conectado de verdad; no publiques ni gastes dinero como parte de la certificación.
