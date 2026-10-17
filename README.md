# 🚀 ORE Studio — Tu agencia de marketing completa, en un solo comando

> **De una idea a una campaña lista para publicar en minutos.**
> Un equipo virtual de **9 especialistas con IA** que planea, escribe, diseña, revisa y optimiza tu contenido para **TikTok, YouTube, LinkedIn, Instagram** (y Facebook si lo quieres).

Sin freelancers. Sin reuniones eternas. Sin empezar desde cero. Tú pones el objetivo; tu agencia hace el resto.

---

## ✨ ¿Por qué ORE Studio?

| Antes | Con ORE Studio |
|-------|----------------|
| Semanas coordinando estrategia, copy y diseño | Una campaña completa desde un solo objetivo |
| Mensajes distintos en cada red | Una voz de marca consistente en todos los canales |
| Contratar a 9 perfiles distintos | 9 especialistas virtuales trabajando en equipo |
| Publicar "a ver qué pasa" | Decisiones guiadas por audiencia y métricas |

**Lo que recibes en cada proyecto:**
- 📋 Brief de campaña listo para aprobar
- 📁 Entregables por rol (estrategia, copy, dirección visual, calendario…)
- ✅ Checkpoints para validar cada etapa
- 🧾 Bitácora completa de lo que se decidió y por qué

---

## 🧠 El cerebro principal: Sabrina Ramonov

Detrás de los 9 agentes hay un **criterio compartido** inspirado en el enfoque público de **[Sabrina Ramonov](https://www.sabrina.dev)**: contenido con IA práctico, automatizado y orientado a resultados. Ese núcleo guía a todo el equipo, y cada agente suma su propia especialidad encima.

> ORE Studio se inspira en su enfoque público documentado. No es un producto oficial de Sabrina Ramonov ni se le atribuyen decisiones privadas.

---

## 🤖 Conoce a tu equipo

Cada agente es un experto con una misión clara, inspirado en los mejores equipos de la industria.

| # | Agente | Qué hace por ti | Inspirado en (personas) | Y también en |
|---|--------|-----------------|--------------------------|--------------|
| 1 | 🎬 **Director** | Lidera el equipo, define la visión y mantiene todo alineado | **Steve Jobs**, **Christopher Nolan**, **Lee Clow** | Directores creativos de agencias |
| 2 | 🧭 **Strategist** | Diseña la estrategia, el posicionamiento, los mensajes y los KPIs | **David Ogilvy**, **Seth Godin**, **Philip Kotler** | Planners de Wieden+Kennedy y BBDO |
| 3 | 🔍 **Audience Researcher** | Descubre quién es tu audiencia, qué quiere y qué está en tendencia | **Rand Fishkin**, **Byron Sharp**, **Clayton Christensen** (Jobs to be Done) | Equipos de Nielsen y Gartner |
| 4 | ✍️ **Writer** | Escribe copys, guiones, titulares y CTAs que enganchan | **Eugene Schwartz**, **Joanna Wiebe**, **Ann Handley** | Copywriters publicitarios |
| 5 | 🎨 **Visual Producer** | Crea motion graphics y piezas visuales, con video generado desde código | **[Remotion](https://www.remotion.dev)** | — |
| 6 | 🛡️ **Quality Editor** | Revisa, pule y asegura coherencia de marca antes de publicar | **William Zinsser**, **Maxwell Perkins**, **Marty Neumeier** | Editores de redacción y equipos de QA |
| 7 | 📅 **Social Manager** | Planea el calendario y adapta cada pieza a cada plataforma | **Gary Vaynerchuk**, **Mari Smith**, **Ann Handley** | Social media ops de marcas líderes |
| 8 | 💬 **Community Manager** | Conversa con tu audiencia y construye comunidad fiel | **Kevin Kelly** (1,000 True Fans), **Jono Bacon**, **Pat Flynn** | Community leads de Twitch y Reddit |
| 9 | 📈 **Growth Analyst** | Mide, experimenta (A/B) y te dice qué mejorar | **Neil Patel**, **Sean Ellis**, **Brian Balfour**, **Avinash Kaushik** | Equipos de Amplitude y Mixpanel |

> Son referentes de la industria que inspiran el enfoque de cada rol; no están afiliados ni respaldan ORE Studio.


> Cada rol está definido en `ore-studio/references/roles/` y su módulo en `ore-studio/agents/`.

---

## ⚡ Pruébalo en 2 minutos

```bash
# 1. Clona el proyecto
git clone https://github.com/anibalelore/orestudio.git
cd "ORE Studio"

# 2. Instala la dependencia mínima
python -m pip install -r ore-studio/requirements.txt

# 3. Valida que todo esté en orden
python ore-studio/scripts/validate_skill.py

# 4. (Opcional) Empaqueta la skill para compartirla
python ore-studio/scripts/package_skill.py ore-studio dist/ore-studio-0.1.0.zip
```

Después, dale a tu agencia un objetivo (por ejemplo: *"Lanzar mi nueva línea de café en TikTok e Instagram"*) y deja que el equipo trabaje.

---

## 🧰 Incluye

- **Flujo guiado por prompt**: del objetivo de alto nivel a un paquete de campaña completo.
- **Script de validación** (`scripts/validate_skill.py`) para asegurar la integridad de `SKILL.md`.
- **Buscador de corpus** (`scripts/search_corpus.py`) para consultar referencias rápidamente.
- **Empaquetador** (`scripts/package_skill.py`) para distribuir tu skill en un zip.

---

## 🗂️ Estructura del proyecto

```
ORE Studio/
├─ ore‑studio/
│  ├─ SKILL.md                # Definición / router de la skill
│  ├─ agents/                 # Los nueve roles
│  │   ├─ __init__.py
│  │   ├─ director.py
│  │   ├─ strategist.py
│  │   ├─ audience_researcher.py
│  │   ├─ writer.py
│  │   ├─ visual_producer.py
│  │   ├─ quality_editor.py
│  │   ├─ social_manager.py
│  │   ├─ community_manager.py
│  │   └─ growth_analyst.py
│  ├─ scripts/                # Utilidades
│  │   ├─ validate_skill.py
│  │   ├─ search_corpus.py
│  │   └─ package_skill.py
│  └─ requirements.txt        # Dependencias mínimas de Python
├─ docs/                      # Documentación, prompts, especificaciones
└─ README.md                  # (este archivo)
```

---

## 🙌 Súmate

¿Te gustó? Dale ⭐ al repo, haz un fork, crea tus propios agentes y cuéntanos qué campañas lanzaste.

## 📄 Licencia

Distribuido bajo la **[Licencia Apache 2.0](LICENSE)** — úsalo, modifícalo y construye tu propio negocio con él.
