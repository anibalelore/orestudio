# OREBAL Studio: dirección por Telegram y operación por clientes

## Propósito

Añadir a OREBAL Studio un runtime operativo autohospedable que permita al owner de cada instalación dirigir la agencia desde un único bot privado de Telegram, mantener clientes y proyectos aislados, ejecutar trabajo durable por pasos y guardar entregables versionados en Google Drive. La skill y el equipo actuales siguen siendo la fuente de comportamiento creativo; Telegram y el panel son dos interfaces del mismo estado en Supabase.

## Alcance aprobado

- Un único director humano por instalación, autorizado por su ID numérico de Telegram y chat privado configurados.
- Telegram como canal principal; sin WhatsApp ni autoservicio de clientes.
- Vercel aloja Next.js, webhook, panel y consumidor acotado.
- Supabase conserva permisos, contexto, decisiones, cola, pasos, versiones y auditoría.
- Google Drive conserva archivos; se guardan IDs, no se infiere identidad por nombres.
- Aníbal Elore y eQatu son fixtures de aceptación; ninguna identidad o cliente queda preconfigurado al distribuir la skill.
- El runtime preserva la oficina visual, el pipeline, las personalidades, referentes y voz de marca actuales.
- Acciones externas, publicación, cobro, gasto o compromisos exigen autorización aplicable.

## Arquitectura

Una aplicación Next.js TypeScript se añade en `apps/control-plane`. El webhook valida secreto, usuario y chat, deduplica `update_id`, traduce texto/comandos/botones a intenciones y registra una tarea antes de responder. Supabase Postgres es la fuente canónica; una cola durable almacena trabajos y un endpoint interno protegido consume lotes pequeños mediante Vercel Cron. Cada paso escribe checkpoint, reserva con vencimiento, intento, costo y error recuperable.

Los adaptadores de Telegram, Drive, IA y transcripción quedan detrás de interfaces. Los dobles locales prueban el recorrido completo sin credenciales. Drive crea o concilia carpetas por claves idempotentes y guarda sus IDs. El pipeline creativo existente se invoca mediante un contrato de ejecución; no se reimplementan agentes en el bot.

## Modelo mínimo

Entidades: `organizations`, `owners`, `clients`, `brand_profiles`, `projects`, `campaigns`, `tasks`, `task_steps`, `conversation_contexts`, `artifacts`, `artifact_versions`, `approvals`, `questions`, `integrations`, `jobs`, `job_attempts`, `audit_events`, `action_tokens`, `authorizations`, `notifications` y `cost_entries`.

Todo registro operativo incluye `organization_id`; lo que pertenezca a trabajo incluye además `client_id` y, cuando exista, `project_id`. Las versiones de artefacto referencian la versión de brief y perfil usada. Las claves únicas cubren update de Telegram, acción lógica, carpeta Drive, token de botón y efecto externo.

## Estados y seguridad

Estados visibles: `received`, `queued`, `running`, `saved`, `ready_for_review`, `delivered`, `paused`, `failed_needs_attention`. Una respuesta HTTP no equivale a éxito del trabajo.

El webhook exige `X-Telegram-Bot-Api-Secret-Token`, ID numérico autorizado y chat privado. Los callbacks usan identificadores opacos, expiración, consumo único y validación de usuario/proyecto/versión/estado. El contenido adjunto nunca concede permisos. La pausa global y por proyecto se comprueba al reservar y antes de cada efecto externo.

## Drive

Cada cliente usa una carpeta identificada por ID con: `00_Perfil_y_Marca`, `01_Administracion`, `02_Recursos_Originales`, `03_Proyectos`, `04_Entregas_y_Publicaciones`, `05_Reportes`, `99_Archivo`. Cada proyecto usa: `00_Brief`, `01_Investigacion`, `02_Borradores`, `03_Revision`, `04_Aprobados`, `05_Resultados`. Los aprobados se referencian mediante shortcut cuando corresponda; no se duplican silenciosamente.

## Operación durable

El webhook solo registra y encola. El consumidor reclama trabajos con reserva vencible, límite de concurrencia y espera creciente; recupera reservas abandonadas y tras agotar intentos marca intervención. Cada efecto externo usa una clave idempotente y conciliación antes de repetirse. El consumidor puede despertar por Vercel Cron protegido; la frecuencia final depende del plan real configurado.

## Personalidades afectadas

Se amplían fichas del Director y responsables existentes antes de crear duplicados. Si faltan funciones realmente distintas, se añaden Comercial, Incorporación, Operaciones y Cobros con tres capas: núcleo Sabrina, criterio especialista documentado y personalidad propia. La voz final siempre pertenece a la marca. Cada ficha incluye misión, fuentes, principios, tono, prioridades, diagnóstico, errores, desacuerdos, límites, herramientas, entradas, entregables, terminado, dos respuestas originales y una decisión observable.

## Evidencia y límites

Las pruebas con dobles cubren deduplicación, autorización, aislamiento, recuperación, idempotencia Drive, aprobaciones, pausa, presupuesto y estado compartido. Las pruebas reales de Telegram, Drive, Supabase y Vercel quedan separadas y solo se declaran cuando existen credenciales, proyecto y plan. No se publican contenidos ni se efectúan gastos como prueba.

## Fuentes técnicas verificadas

- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram bot features: https://core.telegram.org/bots/features
- Vercel Function limits: https://vercel.com/docs/functions/limitations
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Supabase Queues: https://supabase.com/docs/guides/queues
- Google Drive API: https://developers.google.com/workspace/drive/api/guides/about-sdk
- Google Drive scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth

Los límites numéricos y la frecuencia se leen del plan contratado durante el despliegue; no se codifican como promesas universales.
