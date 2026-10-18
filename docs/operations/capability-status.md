# Estado de capacidades

Estado certificado el 18 de octubre de 2026. “Sin conexión real” significa que existe implementación y pruebas con dobles/contratos, pero faltan credenciales o infraestructura para demostrar el proveedor externo.

| Capacidad | Estado | Evidencia o bloqueo |
|---|---|---|
| Entrevista de máximo 6 preguntas iniciales, extras consentidas y perfil reutilizable | Implementada y probada | Suite Python `test_agency_flow` |
| Estudio específico por red antes del guion | Implementada y probada | Suite Python y contrato del runner |
| Personalidades y handoffs recíprocos | Implementada y probada | `test_agent_profiles` |
| Configuración por owner/organización | Implementada y probada | Validación de entorno y pruebas de autorización |
| Clientes, proyectos, contexto y aislamiento | Implementada y probada | Repositorio en memoria y aceptación de segundo cliente |
| Cola, reintento, recuperación y deduplicación | Implementada y probada con doble | MemoryQueue y worker |
| Aprobaciones, pausa y efectos idempotentes | Implementada y probada | Suites de dominio; ningún efecto real ejecutado |
| Panel compartido y resumen | Implementada y probada localmente | Tests, typecheck y build Next.js |
| Handler verificable de Telegram | Implementada y probada con doble | Valida secreto, owner, chat privado, deduplicación e intención |
| Inicialización del webhook/worker desplegado | Pendiente/bloqueada | Las rutas exportadas devuelven 503 hasta conectar dependencias reales |
| Persistencia y cola Supabase | Pendiente/bloqueada | Adaptadores prototipo; faltan RPCs de cola, mapeo real, proyecto/credenciales y prueba de migraciones |
| Google Drive | Implementada sin conexión real | Falta OAuth/service account, carpeta y prueba de permisos |
| Pipeline Python desde worker TypeScript | Implementada y probada localmente | Contrato JSON v1; proveedor IA real no configurado |
| Transcripción/IA externa | Pendiente/bloqueada | Cada instalación debe elegir proveedor, credencial y límites |
| Despliegue y cron Vercel | Pendiente/bloqueada | Requiere cuenta, proyecto y límites del plan del owner |
| Publicación, cobro o gasto reales | Pendiente/bloqueada por diseño | Requieren adaptador y autorización explícita aplicable |

Los pilotos llamados Aníbal o eQatu son fixtures históricos de aceptación; no se distribuyen como identidad, cliente ni configuración por defecto.
