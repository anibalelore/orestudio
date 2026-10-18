# Telegram Client Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el recorrido mínimo seguro y durable para dirigir ORE Studio por Telegram, operar clientes/proyectos aislados y guardar entregables versionados en Drive.

**Architecture:** Añadir una aplicación Next.js TypeScript en `apps/control-plane`; Supabase Postgres y Queues sostienen el estado y trabajo durable, mientras adaptadores aislados conectan Telegram, Drive e IA. El pipeline Python existente sigue siendo el motor creativo y se consume mediante un contrato versionado, de modo que panel y Telegram reflejen el mismo estado.

**Tech Stack:** Next.js + TypeScript, Supabase/Postgres/Queues, Telegram Bot API, Google Drive API, Vitest, Playwright, Python/unittest para compatibilidad del pipeline.

**Spec:** `docs/superpowers/specs/2026-10-17-telegram-client-operations-design.md`

## Global Constraints

- Solo el ID numérico de Telegram de Aníbal y su chat privado pueden dirigir la agencia.
- No añadir WhatsApp, autoservicio, suscripciones ni publicación/facturación automática.
- El webhook registra y encola; ningún temporizador en memoria ni promesa sin esperar sostiene trabajo.
- Drive es fuente de archivos; Supabase es fuente de estados, permisos y decisiones.
- Toda operación es idempotente, aislada por organización/cliente/proyecto y auditable.
- Pausa, autorización, presupuesto y versión se comprueban inmediatamente antes de un efecto externo.
- Credenciales solo en variables protegidas; `.env.example` contiene nombres, nunca valores.
- Versiones de dependencias se determinan con el registro oficial al implementar y quedan fijadas en lockfile.

## Review Focus

- Updates, callbacks y cron duplicados deben producir una sola acción lógica.
- Nombres de clientes ambiguos deben pedir selección y nunca heredar contexto por accidente.
- Reservas vencidas y fallos parciales de Drive deben recuperarse sin duplicar carpetas o archivos.
- Botones antiguos, consumidos o de otra versión deben rechazarse sin cambiar estado.
- Pausa o presupuesto agotado entre dos pasos debe impedir el siguiente efecto externo.

---

### Task 1: Scaffold del control plane y configuración validada

**Files:**
- Create: `apps/control-plane/package.json`
- Create: `apps/control-plane/next.config.ts`
- Create: `apps/control-plane/tsconfig.json`
- Create: `apps/control-plane/src/config.ts`
- Create: `apps/control-plane/.env.example`
- Test: `apps/control-plane/src/config.test.ts`

**Interfaces:**
- Produces: `loadConfig(env: NodeJS.ProcessEnv): RuntimeConfig`; `RuntimeConfig` expone URLs, secretos, owner ID, root Drive ID, límites y feature flags tipados.

- [ ] Escribir pruebas fallidas para variables obligatorias, IDs numéricos, secretos ausentes y modo local con adaptadores fake.
- [ ] Ejecutar `npm test -- src/config.test.ts` y confirmar fallos por módulo inexistente.
- [ ] Inicializar Next.js/TypeScript sin contenido demo y fijar dependencias/lockfile verificadas en npm.
- [ ] Implementar `loadConfig` sin registrar secretos y con límites configurables.
- [ ] Ejecutar pruebas y `npm run typecheck`; esperar PASS.
- [ ] Commit: `chore: scaffold ORE control plane`.

### Task 2: Esquema Supabase, aislamiento y contratos de repositorio

**Files:**
- Create: `supabase/migrations/202610170001_control_plane.sql`
- Create: `apps/control-plane/src/domain/types.ts`
- Create: `apps/control-plane/src/data/repositories.ts`
- Create: `apps/control-plane/src/data/memory-repositories.ts`
- Test: `apps/control-plane/src/data/repositories.test.ts`

**Interfaces:**
- Produces: `Repositories` con operaciones scoped para clientes, proyectos, contexto, tareas, pasos, artefactos/versiones, aprobaciones, autorizaciones, tokens, notificaciones, costos y auditoría.
- Consumes: `RuntimeConfig` de Task 1.

- [ ] Escribir pruebas fallidas para IDs estables, alias duplicados, separación entre clientes, conservación de perfil al añadir proyecto y auditoría append-only.
- [ ] Añadir pruebas que rechacen lecturas/escrituras sin `organizationId` y referencias cruzadas entre clientes.
- [ ] Ejecutar pruebas y confirmar fallos por contratos ausentes.
- [ ] Crear migración versionada con claves externas, índices, constraints de unicidad, RLS defensiva y timestamps.
- [ ] Implementar tipos y repositorio en memoria conforme al contrato; no añadir aún cliente Supabase.
- [ ] Ejecutar pruebas, typecheck y revisión SQL local; esperar PASS.
- [ ] Commit: `feat: add tenant-scoped operational schema`.

### Task 3: Autorización de Telegram, deduplicación e intenciones

**Files:**
- Create: `apps/control-plane/src/integrations/telegram/client.ts`
- Create: `apps/control-plane/src/integrations/telegram/update.ts`
- Create: `apps/control-plane/src/domain/intents.ts`
- Create: `apps/control-plane/src/app/api/telegram/webhook/route.ts`
- Test: `apps/control-plane/src/integrations/telegram/update.test.ts`
- Test: `apps/control-plane/src/app/api/telegram/webhook/route.test.ts`

**Interfaces:**
- Produces: `verifyTelegramRequest(request, config): AuthorizedUpdate`; `interpretUpdate(update, context): Intent`; `ingestUpdate` devuelve confirmación con cliente/proyecto/acción/estado.
- Consumes: `Repositories`, `RuntimeConfig`.

- [ ] Escribir pruebas fallidas para secreto inválido, usuario ajeno, chat no privado, update repetido y documento con instrucciones de elevación.
- [ ] Añadir pruebas para lenguaje natural y accesos rápidos: crear/elegir cliente, proyecto, encargo, avances, entrega, preguntas, aprobar, cambiar, pausar y reanudar.
- [ ] Añadir prueba de nombre duplicado que retorna opciones sin mutar contexto.
- [ ] Ejecutar pruebas y confirmar fallos esperados.
- [ ] Implementar verificación, deduplicación y parser determinista inicial; intenciones ambiguas crean `question`, no efectos.
- [ ] Implementar webhook que persiste `received`/`queued` antes de responder y nunca declara trabajo terminado.
- [ ] Ejecutar pruebas y typecheck; esperar PASS.
- [ ] Commit: `feat: ingest authorized Telegram directions`.

### Task 4: Clientes, proyectos y contexto conversacional

**Files:**
- Create: `apps/control-plane/src/domain/client-operations.ts`
- Create: `apps/control-plane/src/domain/context.ts`
- Test: `apps/control-plane/src/domain/client-operations.test.ts`
- Test: `apps/control-plane/src/domain/context.test.ts`

**Interfaces:**
- Produces: `createClient`, `createProject`, `selectContext`, `resolveExplicitOrActiveContext`; cada función recibe `Scope` y devuelve `OperationResult` auditable.
- Consumes: `Repositories`, `Intent`.

- [ ] Escribir pruebas fallidas del flujo detectar→duplicados→faltantes→registro→vínculo pendiente→confirmación.
- [ ] Probar que crear proyecto eQatu reutiliza el cliente y perfil, y que referencia explícita prevalece sobre contexto activo.
- [ ] Probar que archivos adjuntos jamás eligen cliente por nombre.
- [ ] Implementar operaciones sin exigir brief completo para estructuras vacías.
- [ ] Ejecutar pruebas y typecheck; esperar PASS.
- [ ] Commit: `feat: manage client and project context`.

### Task 5: Cola durable, leases, reintentos y presupuesto

**Files:**
- Create: `apps/control-plane/src/queue/contracts.ts`
- Create: `apps/control-plane/src/queue/memory-queue.ts`
- Create: `apps/control-plane/src/queue/worker.ts`
- Create: `apps/control-plane/src/app/api/internal/worker/route.ts`
- Create: `apps/control-plane/vercel.json`
- Test: `apps/control-plane/src/queue/worker.test.ts`

**Interfaces:**
- Produces: `QueuePort.enqueue/claim/ack/retry/fail/recoverExpired`; `runWorker({maxJobs, deadlineMs})`; handler registry por `task_step.kind`.
- Consumes: tareas/pasos de Task 2 y configuración de Task 1.

- [ ] Escribir pruebas fallidas para cron duplicado, límite de concurrencia, lease vencido, backoff, máximo de intentos y recuperación desde checkpoint.
- [ ] Añadir prueba de presupuesto agotado que pausa solo el trabajo afectado y crea notificación.
- [ ] Ejecutar pruebas y confirmar fallos.
- [ ] Implementar cola en memoria y worker acotado con lock e idempotency key.
- [ ] Añadir endpoint interno protegido y cron conservador configurable; documentar que la frecuencia depende del plan Vercel real.
- [ ] Ejecutar pruebas y typecheck; esperar PASS.
- [ ] Commit: `feat: add durable step worker contracts`.

### Task 6: Adaptador Supabase y consumidor de Queues

**Files:**
- Create: `apps/control-plane/src/data/supabase-repositories.ts`
- Create: `apps/control-plane/src/queue/supabase-queue.ts`
- Create: `supabase/tests/control_plane.sql`
- Test: `apps/control-plane/src/data/supabase-repositories.contract.test.ts`

**Interfaces:**
- Produces: implementaciones de `Repositories` y `QueuePort` seleccionadas por configuración.
- Consumes: contratos de Tasks 2 y 5.

- [ ] Crear suite contractual que ejecute los mismos casos contra memoria y, si hay URL local, Supabase.
- [ ] Ejecutar contra memoria y confirmar que el adaptador Supabase falta.
- [ ] Implementar consultas scoped, transacciones/RPC para reclamo, recuperación y deduplicación.
- [ ] Añadir prueba SQL de constraints y RLS; omitir con estado explícito si Supabase local no está disponible.
- [ ] Ejecutar suite contractual; esperar PASS local y reportar por separado integración real.
- [ ] Commit: `feat: persist operations with Supabase queues`.

### Task 7: Drive idempotente y estructura de trabajo

**Files:**
- Create: `apps/control-plane/src/integrations/drive/port.ts`
- Create: `apps/control-plane/src/integrations/drive/google-drive.ts`
- Create: `apps/control-plane/src/integrations/drive/memory-drive.ts`
- Create: `apps/control-plane/src/domain/drive-structure.ts`
- Test: `apps/control-plane/src/domain/drive-structure.test.ts`

**Interfaces:**
- Produces: `DrivePort.findByAppKey/createFolder/createFile/createShortcut/getVerifiedLink`; `ensureClientStructure`; `ensureProjectStructure`; `saveArtifactVersion`.
- Consumes: repositorios y contexto de cliente/proyecto.

- [ ] Escribir pruebas fallidas para estructura exacta, reintento tras respuesta incierta, vínculo de carpeta existente, permisos insuficientes y nombres versionados sin “final”.
- [ ] Añadir prueba de fallo parcial que deja estado pendiente y concilia antes de crear otra carpeta.
- [ ] Ejecutar pruebas y confirmar fallos.
- [ ] Implementar fake y lógica de conciliación por ID/appProperties; luego adaptador Drive con alcance mínimo configurable.
- [ ] Implementar shortcuts/referencias para aprobados sin duplicar archivos.
- [ ] Ejecutar pruebas y typecheck; esperar PASS.
- [ ] Commit: `feat: organize versioned work in Drive`.

### Task 8: Bridge del equipo ORE, archivos y voz

**Files:**
- Create: `apps/control-plane/src/agents/runner.ts`
- Create: `apps/control-plane/src/agents/python-runner.ts`
- Create: `apps/control-plane/src/integrations/ai/port.ts`
- Create: `apps/control-plane/src/integrations/transcription/port.ts`
- Modify: `ore-studio/scripts/run_agency.py`
- Modify: `ore-studio/agents/pipeline.py`
- Test: `apps/control-plane/src/agents/runner.test.ts`
- Test: `tests/test_agency_flow.py`

**Interfaces:**
- Produces: `AgentRunner.plan/executeStep`; contrato JSON versionado para invocar pipeline por cliente/proyecto/perfil y devolver artefactos sin publicar.
- Consumes: task steps, perfil/versiones, `DrivePort`, proveedor IA/transcripción configurado.

- [ ] Escribir pruebas fallidas de recuperación de perfil correcto, estudio por red antes de guion, aislamiento Aníbal/eQatu y capacidad no configurada.
- [ ] Añadir pruebas para documento/imagen/voz con referencia conservada, límite de tamaño y alternativa Drive.
- [ ] Ejecutar suites TS/Python y confirmar fallos.
- [ ] Implementar contrato JSON y adaptadores; dividir modelos lentos en jobs consultables cuando el proveedor lo permita.
- [ ] Guardar cada artefacto/version con brief y perfil usados; nunca adoptar la voz del referente.
- [ ] Ejecutar suites y typecheck; esperar PASS.
- [ ] Commit: `feat: bridge durable jobs to ORE agents`.

### Task 9: Aprobaciones, botones opacos, pausa y efectos externos

**Files:**
- Create: `apps/control-plane/src/domain/approvals.ts`
- Create: `apps/control-plane/src/domain/action-tokens.ts`
- Create: `apps/control-plane/src/domain/effects.ts`
- Test: `apps/control-plane/src/domain/approvals.test.ts`
- Test: `apps/control-plane/src/domain/effects.test.ts`

**Interfaces:**
- Produces: `issueActionToken`, `consumeActionToken`, `approveVersion`, `requestChanges`, `pauseScope`, `resumeScope`, `authorizeEffect`, `executeEffectOnce`.
- Consumes: repositorios, Telegram callbacks, artefactos/versiones y queue.

- [ ] Escribir pruebas fallidas para token opaco expirado/repetido/ajeno, aprobación ambigua, versión cambiada y autorización recurrente acotada.
- [ ] Añadir pruebas de pausa global/proyecto justo antes del efecto y efecto externo repetido con conciliación.
- [ ] Ejecutar pruebas y confirmar fallos.
- [ ] Implementar tokens de un solo uso y gates transaccionales; no implementar publicación, cobro ni mensajes comerciales reales.
- [ ] Ejecutar pruebas y typecheck; esperar PASS.
- [ ] Commit: `feat: gate approvals pauses and external effects`.

### Task 10: Notificaciones, resumen y panel compartido

**Files:**
- Create: `apps/control-plane/src/domain/notifications.ts`
- Create: `apps/control-plane/src/app/page.tsx`
- Create: `apps/control-plane/src/app/clients/[clientId]/page.tsx`
- Create: `apps/control-plane/src/app/projects/[projectId]/page.tsx`
- Test: `apps/control-plane/src/domain/notifications.test.ts`
- Test: `apps/control-plane/e2e/control-plane.spec.ts`

**Interfaces:**
- Produces: `notifyImmediate`, `buildDailyDigest`, `deliverNotificationOnce`; vistas server-rendered desde los mismos repositorios.
- Consumes: estado/auditoría/tareas/artefactos de Tasks 2–9.

- [ ] Escribir pruebas fallidas de deduplicación, fallos terminales inmediatos, agrupación rutinaria y resumen sin hora inventada.
- [ ] Añadir E2E que verifica el mismo estado/links en panel y respuesta Telegram fake.
- [ ] Ejecutar pruebas y confirmar fallos.
- [ ] Implementar notificaciones e interfaz mínima de oficina preservando nombres/agentes actuales.
- [ ] Ejecutar unitarias, Playwright y build; esperar PASS.
- [ ] Commit: `feat: expose shared operations dashboard`.

### Task 11: Fichas completas de agentes y fuentes verificadas

**Files:**
- Modify: `ore-studio/agents/personas.py`
- Create: `ore-studio/references/roles/operations-director.md`
- Create: `ore-studio/references/roles/sales.md`
- Create: `ore-studio/references/roles/onboarding.md`
- Create: `ore-studio/references/roles/project-operations.md`
- Create: `ore-studio/references/roles/cash-operations.md`
- Create: `ore-studio/references/sources/operations-personas.md`
- Test: `tests/test_agent_profiles.py`

**Interfaces:**
- Produces: fichas completas enlazadas desde `SKILL.md`; `PERSONAS` conserva reciprocidad y declara herramientas/límites.

- [ ] Investigar fuentes primarias públicas de referentes existentes y candidatos; registrar URL y afirmación verificada, dejando pendientes explícitos.
- [ ] Escribir pruebas fallidas que exijan todos los campos, dos respuestas originales, una decisión observable y conexiones recíprocas.
- [ ] Ejecutar pruebas y confirmar fallos.
- [ ] Ampliar Director antes de crear roles; crear solo responsabilidades no cubiertas sin atribuir métodos privados.
- [ ] Mantener `SKILL.md` breve y enlazar fichas/referencias.
- [ ] Ejecutar pruebas Python y validador oficial de skills; esperar PASS.
- [ ] Commit: `docs: define operational agent profiles`.

### Task 12: Recorrido de aceptación, conexión y matriz de capacidades

**Files:**
- Create: `apps/control-plane/e2e/pilot-anibal.spec.ts`
- Create: `apps/control-plane/e2e/isolation-eqatu.spec.ts`
- Create: `docs/operations/connect-integrations.md`
- Create: `docs/operations/capability-status.md`
- Modify: `README.md`
- Modify: `ore-studio/SKILL.md`

**Interfaces:**
- Consumes: todos los contratos anteriores.
- Produces: recorrido local demostrable, instrucciones sin secretos y matriz con `implementada y probada`, `implementada sin conexión real`, `pendiente/bloqueada`.

- [ ] Escribir escenarios de aceptación para los 14 criterios del spec, separando fake/local/real.
- [ ] Ejecutar recorrido Aníbal con dobles: encargo→contexto→proyecto→estudio→guion→revisión→aprobación→Drive fake→enlace.
- [ ] Ejecutar aislamiento eQatu sin activar campaña y probar deduplicación, recuperación, pausa y presupuesto.
- [ ] Añadir instrucciones de Supabase, Telegram webhook, Drive OAuth/service account/shared drive y Vercel, con variables sin valores.
- [ ] Ejecutar `npm test`, `npm run typecheck`, `npm run build`, Playwright, `python -m unittest discover -s tests -v` y validador de skill.
- [ ] Registrar resultados reales y bloqueos por credencial/plan; no marcar integraciones reales sin evidencia.
- [ ] Commit: `test: certify Telegram client operations pilot`.
