# OREBAL Studio Phase 1 Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar una plataforma OREBAL operativa con bootstrap seguro, Auth/RLS, cola y worker reales, UI administrativa, integraciones verificadas y certificación de dos pilotos aislados.

**Architecture:** Next.js en Vercel resuelve UI y APIs breves; Supabase Auth/Postgres/PGMQ conserva identidad y estado; un worker externo ejecuta Python y proveedores. Todas las mutaciones derivan tenant desde sesión/membresía y producen auditoría/eventos transaccionales.

**Tech Stack:** Next.js 16, React 19, TypeScript 7, Supabase Auth/Postgres/RLS/PGMQ/Realtime, Zod, Vitest, Python 3.11+, Google Drive API, Telegram Bot API, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-18-orebal-phase1-platform-design.md`

## Global Constraints

- No renombrar OREBAL Studio ni reemplazar el registro/pipeline de 21 agentes.
- Vercel solo aloja UI, sesión y APIs cortas; Python/IA/multimedia larga corre en worker externo.
- `organization_id` siempre deriva de sesión/membresía verificada, nunca del navegador.
- Service-role, tokens y secretos nunca llegan al navegador, payloads de evento o logs.
- Publicar, cobrar, gastar o enviar se niega por defecto y exige autorización exacta de un solo uso.
- No sembrar Aníbal/eQatu; ambos se crean manualmente y permanecen aislados.
- No usar mocks en producción ni declarar una integración activa sin prueba real registrada.
- Migraciones incrementales; no borrar tablas o IDs existentes.

## Review Focus

- Dos requests concurrentes intentan reclamar `/setup`: exactamente uno obtiene Owner y el otro falla sin estado parcial (Task 3).
- Un miembro usa IDs válidos de otra organización/cliente: API, RLS y worker rechazan sin filtrar existencia (Tasks 4, 6 y 10).
- Un worker muere después del efecto externo pero antes del ack: conciliación evita repetir el efecto y la tarea se recupera (Task 7).
- Una credencial expira o se revoca durante onboarding/trabajo: estado pasa a error verificable sin exponer token ni fingir conexión (Tasks 8 y 14).
- Realtime se desconecta o entrega eventos fuera de orden: UI reconstruye estado por sequence y polling sin actividad ficticia (Task 13).

---

### Task 1: Auditoría ejecutable y configuración de entornos

**Files:**
- Create: `apps/control-plane/src/runtime/capability-audit.ts`
- Create: `apps/control-plane/src/runtime/capability-audit.test.ts`
- Modify: `apps/control-plane/src/config.ts`
- Modify: `apps/control-plane/.env.example`
- Create: `docs/operations/phase1-environments.md`

**Interfaces:**
- Produces: `auditRuntime(config: RuntimeConfig): CapabilityReport`; configuración separada `public`, `server`, `worker`.

- [ ] Escribir pruebas fallidas para secretos ausentes, modo producción con fake, campos públicos sin secretos y reporte honesto `missing/configured/verified/error`.
- [ ] Ejecutar `npm test -- capability-audit`; esperar FAIL por módulo ausente.
- [ ] Implementar schemas Zod separados y `auditRuntime`; prohibir fake en producción.
- [ ] Documentar dev/staging/prod, responsables de secretos y bloqueos actuales.
- [ ] Ejecutar test, typecheck y build; esperar PASS.
- [ ] Commit: `chore: audit phase1 runtime capabilities`.

### Task 2: Migración de membresías, instalación y eventos

**Files:**
- Create: `supabase/migrations/202610180001_phase1_identity_events.sql`
- Create: `supabase/tests/phase1_identity_events.sql`
- Modify: `apps/control-plane/src/domain/types.ts`

**Interfaces:**
- Produces: tablas `organization_members`, `installation_claims`, `installation_settings`, `user_invitations`, `provider_connections`, `agent_configurations`, `agent_runs`, `agent_events`, `conversation_messages`, `outbox_events`; Owner sin Telegram obligatorio.

- [ ] Escribir prueba SQL fallida para constraints, unicidad, FKs tenant-safe, payload sin claves prohibidas y eventos append-only.
- [ ] Ejecutar en Supabase local; esperar objetos ausentes o registrar bloqueo si Docker no existe.
- [ ] Implementar migración incremental, índices y rollback documentado sin borrar IDs.
- [ ] Añadir tipos TypeScript de filas/estados/eventos.
- [ ] Ejecutar pruebas SQL y `npm run typecheck`; esperar PASS.
- [ ] Commit: `feat: add phase1 identity and event schema`.

### Task 3: Bootstrap atómico del primer Owner

**Files:**
- Create: `apps/control-plane/src/setup/bootstrap.ts`
- Create: `apps/control-plane/src/setup/bootstrap.test.ts`
- Create: `apps/control-plane/src/app/api/setup/claim/route.ts`
- Create: `supabase/migrations/202610180002_claim_installation.sql`

**Interfaces:**
- Produces: `claimInstallation(input, actor): Promise<ClaimResult>` y RPC `ore_claim_installation(token_hash, auth_user_id, organization)`.

- [ ] Escribir pruebas fallidas para token inválido/expirado/repetido, dos claims concurrentes, usuario no verificado y auditoría sin token.
- [ ] Ejecutar tests; esperar FAIL.
- [ ] Implementar hash server-side, comparación constante y transacción que crea una sola organización/membresía Owner.
- [ ] Cerrar `/setup` tras claim y devolver errores indistinguibles para token inválido/consumido.
- [ ] Ejecutar unitarias y test concurrente Supabase; esperar un éxito exacto.
- [ ] Commit: `feat: claim installation with one-time bootstrap`.

### Task 4: Sesión, roles y autorización central

**Files:**
- Create: `apps/control-plane/src/auth/session.ts`
- Create: `apps/control-plane/src/auth/authorize.ts`
- Create: `apps/control-plane/src/auth/authorize.test.ts`
- Create: `apps/control-plane/src/middleware.ts`
- Create: `supabase/migrations/202610180003_phase1_rls.sql`

**Interfaces:**
- Produces: `requireSession()`, `requireMembership(role[])`, `authorizeResource(action, resource)` y helper RLS `ore_current_organizations()`.

- [ ] Escribir pruebas fallidas por ruta anónima, rol insuficiente, tenant ajeno, recurso cross-client, sesión revocada y MFA faltante para Owner sensible.
- [ ] Implementar clientes Supabase browser/server/admin separados y middleware de rutas privadas.
- [ ] Implementar permisos Owner/Admin/Manager/Editor/Viewer en API y RLS con grants mínimos.
- [ ] Ejecutar unitarias y matrices RLS con dos organizaciones; esperar todos los accesos ajenos rechazados.
- [ ] Commit: `feat: enforce authenticated tenant roles`.

### Task 5: Login, seguridad de cuenta e invitaciones

**Files:**
- Create: `apps/control-plane/src/app/(auth)/login/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/account/security/page.tsx`
- Create: `apps/control-plane/src/account/invitations.ts`
- Test: `apps/control-plane/e2e/auth-security.spec.ts`

**Interfaces:**
- Consumes: Task 4.
- Produces: login/recuperación, MFA TOTP y `inviteMember(email, role, ttl)` de uso único.

- [ ] Escribir E2E fallido para login, verificación, MFA, recuperación, invitación expirada/repetida y cierre de sesión.
- [ ] Implementar UI accesible y acciones server-side; nunca enumerar cuentas.
- [ ] Ejecutar Vitest, Playwright y axe; esperar PASS.
- [ ] Commit: `feat: add owner account security`.

### Task 6: Repositorios Supabase reales y DTO validados

**Files:**
- Create: `apps/control-plane/src/data/mappers.ts`
- Modify: `apps/control-plane/src/data/supabase-repositories.ts`
- Modify: `apps/control-plane/src/data/supabase-repositories.contract.test.ts`

**Interfaces:**
- Produces: mappers Zod `rowToDomain/domainToRow`; `Repositories` equivalente a memoria pero scoped por membresía.

- [ ] Extender contrato con nulls, enums, timestamps, alias escapados, cross-tenant/cross-client y concurrencia de versión.
- [ ] Ejecutar contra Supabase local; esperar FAIL del prototipo.
- [ ] Implementar mappers explícitos y operaciones/RPC transaccionales; no propagar input por spread a SQL.
- [ ] Ejecutar el mismo contrato contra memoria y Supabase; esperar PASS.
- [ ] Commit: `feat: harden Supabase repositories`.

### Task 7: Cola PGMQ completa e idempotencia

**Files:**
- Create: `supabase/migrations/202610180004_queue_rpcs.sql`
- Modify: `apps/control-plane/src/queue/supabase-queue.ts`
- Create: `apps/control-plane/src/queue/supabase-queue.integration.test.ts`

**Interfaces:**
- Produces: ocho RPC `ore_*_job`, lease token, dead-letter y reconciliación por effect key.

- [ ] Escribir integración fallida para dedupe, claims concurrentes, lease expirado, backoff, max attempts, tenant ajeno y crash después del efecto antes del ack.
- [ ] Implementar funciones SECURITY DEFINER con `search_path` fijo, checks de membresía/worker y grants mínimos.
- [ ] Actualizar adaptador para DTO, lease token y errores tipados.
- [ ] Ejecutar prueba concurrente; esperar un solo claim/efecto.
- [ ] Commit: `feat: implement durable tenant queue rpcs`.

### Task 8: Almacén seguro y verificación de proveedores

**Files:**
- Create: `apps/control-plane/src/integrations/provider-connections.ts`
- Create: `apps/control-plane/src/integrations/provider-connections.test.ts`
- Create: `apps/control-plane/src/secrets/port.ts`
- Create: `apps/control-plane/src/secrets/vercel-or-worker-store.ts`

**Interfaces:**
- Produces: `SecretStore.put/rotate/delete`, `verifyConnection(provider)` y estado público sin valor secreto.

- [ ] Escribir pruebas fallidas para token en respuesta/log/evento, scope insuficiente, expiración/revocación, rotación y desconexión.
- [ ] Implementar referencias cifradas/secret manager; `integrations` conserva solo estado no secreto.
- [ ] Ejecutar tests con redactor de logs; esperar cero coincidencias de secretos.
- [ ] Commit: `feat: manage verifiable provider connections`.

### Task 9: Worker externo y protocolo de ejecución

**Files:**
- Create: `worker/package.json`
- Create: `worker/src/main.ts`
- Create: `worker/src/runner.ts`
- Create: `worker/src/health.ts`
- Create: `worker/src/runner.test.ts`
- Modify: `apps/control-plane/src/agents/python-runner.ts`

**Interfaces:**
- Produces: worker persistente `claim → checkpoint → Python contract v1 → artifacts/events/cost → ack`; `/healthz` y shutdown seguro.

- [ ] Escribir pruebas fallidas para heartbeat, shutdown durante paso, subprocess timeout, cancelación/pausa, presupuesto y crash recuperable.
- [ ] Implementar consumidor con concurrencia acotada y proceso Python fuera de Vercel.
- [ ] Registrar costo estimado/observado y eventos transaccionales sin stdout sensible.
- [ ] Ejecutar contrato Node/Python y recuperación; esperar PASS.
- [ ] Commit: `feat: run agents in persistent worker`.

### Task 10: Runtime real de webhook y wake endpoint

**Files:**
- Modify: `apps/control-plane/src/app/api/telegram/webhook/route.ts`
- Modify: `apps/control-plane/src/app/api/internal/worker/route.ts`
- Create: `apps/control-plane/src/runtime/container.ts`
- Test: `apps/control-plane/src/runtime/container.test.ts`

**Interfaces:**
- Consumes: Tasks 4, 6, 7 y 9.
- Produces: dependencias lazy server-only; webhook crea tarea y wake solo señala al worker.

- [ ] Escribir tests fallidos para config ausente, secreto/owner/chat inválido, replay, tenant derivado incorrecto y wake anónimo.
- [ ] Implementar container real sin fallback fake en producción; eliminar `503` únicamente cuando health checks mínimos pasan.
- [ ] Ejecutar rutas contra staging y conservar `503 capability_missing` si configuración es incompleta.
- [ ] Commit: `feat: wire secure production runtime`.

### Task 11: Wizard visual de onboarding

**Files:**
- Create: `apps/control-plane/src/app/setup/page.tsx`
- Create: `apps/control-plane/src/setup/steps.ts`
- Create: `apps/control-plane/src/components/setup/*`
- Test: `apps/control-plane/e2e/setup-wizard.spec.ts`

**Interfaces:**
- Consumes: Tasks 1, 3, 5 y 8.
- Produces: wizard reanudable de 10 pasos con pruebas reales y bloqueo posterior.

- [ ] Escribir E2E fallido para progreso, refresh, doble tab claim, proveedor fallido, opcional pendiente, teclado y setup ya cerrado.
- [ ] Implementar stepper server-driven; nunca renderizar secretos guardados.
- [ ] Mostrar `not_configured/connecting/verified/error`, no estados optimistas.
- [ ] Ejecutar Playwright desktop/móvil y accesibilidad; esperar PASS.
- [ ] Commit: `feat: add secure installation wizard`.

### Task 12: Shell operativo y CRUD de clientes/proyectos

**Files:**
- Create: `apps/control-plane/src/app/(protected)/layout.tsx`
- Create: `apps/control-plane/src/app/(protected)/dashboard/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/clients/*`
- Create: `apps/control-plane/src/app/(protected)/projects/*`
- Test: `apps/control-plane/e2e/client-project-crud.spec.ts`

**Interfaces:**
- Produces: navegación accesible y CRUD real con perfiles versionados.

- [ ] Escribir E2E fallido para empty/loading/error, CRUD, alias duplicado, versión concurrente, roles y dos clientes aislados.
- [ ] Implementar componentes server-first y mutaciones autorizadas con validación Zod.
- [ ] Ejecutar E2E y verificar que no hay datos hardcodeados.
- [ ] Commit: `feat: operate clients and projects from web`.

### Task 13: Tareas, chat, agentes y estado en tiempo real

**Files:**
- Create: `apps/control-plane/src/app/(protected)/tasks/[taskId]/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/chat/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/agents/*`
- Create: `apps/control-plane/src/realtime/task-stream.ts`
- Test: `apps/control-plane/e2e/task-agent-chat.spec.ts`

**Interfaces:**
- Consumes: agent events/runs y registro `PERSONAS` mediante snapshot generado.
- Produces: timeline ordenada, chat contextual y estados derivados reales de 21 agentes.

- [ ] Escribir tests para 21 agentes, working sin run rechazado, evento duplicado/fuera de orden, desconexión Realtime y fallback polling.
- [ ] Implementar proyección por `sequence`, cursor reanudable y estado no ficticio.
- [ ] Ejecutar E2E simulando reconexión; esperar estado idéntico al servidor.
- [ ] Commit: `feat: show real agent work and conversations`.

### Task 14: Drive, IA y Telegram verificables

**Files:**
- Modify: `apps/control-plane/src/integrations/drive/google-drive.ts`
- Modify: `apps/control-plane/src/integrations/telegram/client.ts`
- Create: `apps/control-plane/src/integrations/ai/providers.ts`
- Create: `apps/control-plane/src/app/(protected)/integrations/page.tsx`
- Test: `apps/control-plane/e2e/integrations.spec.ts`

**Interfaces:**
- Produces: connect/test/disconnect; challenge Telegram; Drive probe idempotente; IA low-cost probe.

- [ ] Escribir contratos para scope insuficiente, Shared Drive, token revocado, Telegram username ignorado, challenge replay y proveedor IA sin presupuesto.
- [ ] Implementar OAuth/cuenta de servicio server-side y pruebas de conexión con cleanup conciliado.
- [ ] Ejecutar dobles siempre y staging solo con flags/credenciales; registrar evidencia por proveedor.
- [ ] Commit: `feat: verify external integrations`.

### Task 15: Inbox, aprobaciones, archivos y calendario

**Files:**
- Create: `apps/control-plane/src/app/(protected)/inbox/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/files/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/calendar/page.tsx`
- Test: `apps/control-plane/e2e/approval-files-calendar.spec.ts`

**Interfaces:**
- Consumes: aprobaciones/tokens/effects/Drive.
- Produces: aprobar/rechazar/pausar/reanudar; enlaces verificados; publicación manual/real diferenciada.

- [ ] Escribir E2E para token viejo/repetido/ajeno, versión cambiada, pausa justo antes del efecto, link roto y calendario sin publicación confirmada.
- [ ] Implementar inbox unificado y acciones server-side revalidadas.
- [ ] Ejecutar E2E; esperar cero efectos no autorizados.
- [ ] Commit: `feat: review approvals files and calendar`.

### Task 16: Costos, auditoría, settings y observabilidad

**Files:**
- Create: `apps/control-plane/src/app/(protected)/analytics/page.tsx`
- Create: `apps/control-plane/src/app/(protected)/settings/page.tsx`
- Create: `apps/control-plane/src/observability/redaction.ts`
- Test: `apps/control-plane/e2e/observability-settings.spec.ts`

**Interfaces:**
- Produces: estimado vs observado, export audit, presupuestos, alertas y redacción central.

- [ ] Escribir tests para moneda/zona horaria, costo parcial, presupuesto excedido, PII/token en log y auditoría inmutable.
- [ ] Implementar agregaciones fechadas/con fuente, export autorizado y redactor denylist/shape-aware.
- [ ] Ejecutar tests y escaneo de fixtures; esperar cero secretos.
- [ ] Commit: `feat: expose auditable costs and settings`.

### Task 17: Certificación E2E de pilotos y release

**Files:**
- Create: `apps/control-plane/e2e/phase1-owner-journey.spec.ts`
- Create: `apps/control-plane/e2e/phase1-pilot-isolation.spec.ts`
- Create: `docs/operations/phase1-release-checklist.md`
- Modify: `docs/operations/capability-status.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: todos los contratos anteriores.
- Produces: evidencia firmada por entorno; release sin fakes.

- [ ] Ejecutar journey: claim→MFA→integraciones→cliente/proyecto→entrevista→brief→cola→worker→Drive→aprobación→auditoría.
- [ ] Crear Aníbal/eQatu manualmente y probar consultas, chat, archivos, eventos y contenido privado cross-client.
- [ ] Probar retry/crash, pausa, proveedor caído, revocación, Realtime offline y presupuesto.
- [ ] Ejecutar `npm test`, typecheck, build, Playwright, Python, SQL y skill validator; registrar comandos/commit/entorno.
- [ ] Ejecutar smoke staging/producción sin publicar ni gastar; marcar bloqueos en vez de aprobarlos.
- [ ] Commit: `release: certify OREBAL phase1 platform`.

## Self-review

- Cobertura: las 14 secciones del diseño se asignan a Tasks 1–17; Fase 2 permanece fuera.
- Interfaces: Auth/membresía precede repositorios/rutas; cola precede worker/runtime; datos reales preceden UI; integraciones preceden release.
- Riesgos: concurrencia de bootstrap, aislamiento tenant, crash después de efecto, credenciales revocadas y eventos fuera de orden están fijados en Review Focus y pruebas propietarias.
- Proporción: el plan define firmas, archivos y verificaciones sin transcribir implementaciones.

