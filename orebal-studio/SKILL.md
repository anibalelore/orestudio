---
name: orebal-studio
description: Agencia virtual de contenido, marketing y crecimiento con entrevista inicial, estudio por red social y agentes conectados.
---

# orebal-studio Skill Router

Versión distribuible: **2.0.0**.

Agencia virtual autohospedable de agentes creativos y operativos con personalidad propia, inspirados en referentes reales de cada área, que generan campañas multicanal (TikTok, Instagram, LinkedIn, YouTube, opcional Facebook). Criterio compartido inspirado en el enfoque público de **Sabrina Ramonov**.

Cada instalación pertenece a su propio owner: configura organización, Telegram, Supabase, Drive y proveedores mediante variables de entorno. Nunca asumas que nombres de pilotos, IDs o credenciales del repositorio representan al instalador. Guía: `../docs/operations/connect-integrations.md`; estado: `../docs/operations/capability-status.md`.

La fuente de verdad de personalidades, inspiraciones y conexiones es `agents/personas.py`.

## Activación
- **Sin parámetros**: inicia un proyecto nuevo con la entrevista del **Interviewer**.
- **Con `--project <ID>`**: carga el contexto de un proyecto existente.

## Flujo (todo conectado por un contexto compartido)
1. **Interviewer** — entrevista breve. **Máximo 6 preguntas iniciales, incluida la apertura**, cada una con una opción recomendada ("ok" la acepta). Si aún falta información importante, propone una profundización a la vez explicando por qué; solo la pregunta si el usuario acepta y siempre permite **avanzar**. Lo omitido se convierte en supuestos visibles. Entrega un `brief.md`, guarda `client-profile.json` para futuras campañas y pide un solo "sí".
2. **Director** — valida el brief, reparte encargos y define qué es "terminado".
3. **Strategist** y **Audience Researcher** — idea central, pilares, KPI, dolores y lenguaje del comprador.
4. **Estudio por red** — cada Platform Strategist (TikTok, Instagram, LinkedIn, YouTube, Facebook) produce su `platform-study-<red>.md` con comportamiento de la audiencia, formato, ganchos, estructura, reglas, CTA, cadencia y métricas.
5. **Writer** — escribe **un guion por red solo después de su estudio**. Si falta el estudio, no escribe.
6. **Media Scout** — busca imágenes, videos y memes relacionados con el tema, con licencia registrada.
7. **Visual Producer** — convierte cada guion en composiciones (estilo Remotion) con duración y resolución exactas.
8. **Quality Editor** — revisa cada pieza contra las reglas de su red.
9. **Social Manager** → **Community Manager** → **Growth Analyst** — calendario, respuestas y métricas.
10. **Growth Analyst** devuelve aprendizajes al **Strategist** y al **Writer** (ciclo de mejora).
11. **Operations Director** coordina **Sales**, **Onboarding**, **Project Operations** y **Cash Operations**, y devuelve decisiones al Director sin autorizar publicaciones, cobros ni gastos por sí solo. Sus fichas completas están en `references/roles/`.

Cada artefacto lleva un encabezado con el agente y sus inspiraciones, y una línea con su voz. El `checkpoint.md` lista quién entregó qué a quién.

## Cómo ejecutar
```bash
python orebal-studio/scripts/run_agency.py --project demo                 # con entrevista
python orebal-studio/scripts/run_agency.py --project demo --yes \
    --offer "Cursos de Excel" --buyer "contadores" --channel tiktok,linkedin
python orebal-studio/scripts/run_agency.py --project siguiente --yes \
    --profile output/demo/client-profile.json --channel instagram,youtube
```
En código: `Interviewer().run()` → `Pipeline("demo").run(brief, fetch_media=False)`.

## Reglas para el agente anfitrión (LLM)
- Respeta las 6 preguntas iniciales del Interviewer. Las profundizaciones posteriores se ofrecen una por una, requieren consentimiento y siempre permiten avanzar.
- Nunca escribas un guion sin leer antes el estudio de esa red.
- Cada agente habla con su voz definida en `personas.py`; no suplantes a las personas inspiradoras ni les atribuyas decisiones privadas.
- Las reglas por red son heurísticas: contrástalas con datos actuales y con las métricas del cliente.
- El pipeline genera estructura y reglas; tú redactas el texto final siguiendo las líneas `➜ Escribe:`.

## Bloqueos críticos
- Brief sin oferta o sin canales → aborta y solicita.
- Writer sin estudio de la red → aborta.
- Acción no soportada por la plataforma → marca como **pendiente**.

## Salida
```
output/<project_id>/
├─ brief.md
├─ client-profile.json          (contexto reutilizable de negocio y marca)
├─ artifacts/
│  ├─ director.md, strategist.md, audience_researcher.md
│  ├─ platform-study-<red>.md   (uno por red)
│  ├─ writer.md, media_scout.md, visual_producer.md
│  ├─ quality_editor.md, social_manager.md
│  ├─ community_manager.md, growth_analyst.md
├─ assets/                      (si fetch_media=True)
├─ checkpoint.md
└─ log.txt
```

## Parámetros
- `--project <ID>`, `--channel <lista>` (por defecto: tiktok,instagram,linkedin,youtube), `--output <dir>`, `--yes` (omite la entrevista).
- `--profile <ruta>` reutiliza el contexto de negocio; `--brand <nombre>` lo define o reemplaza.
