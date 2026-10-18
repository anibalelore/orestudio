# Pipeline: connects every agent through one shared context

"""Interviewer -> Director -> Strategist / Audience Researcher -> per-platform
studies -> Writer (scripts) -> Visual Producer -> Quality Editor -> Social
Manager -> Community Manager -> Growth Analyst.

Each step reads what earlier agents produced (``Context``) and every hand-off is
logged, so the work is connected end to end. The pipeline produces structured,
rule-derived artifacts (briefs, studies, script skeletons, composition specs,
QA checks, calendar). The LLM host (the skill) is expected to polish the final
copy; the structure, platform rules and checks are enforced here.
"""

import datetime
import json
import os
from dataclasses import dataclass, field

try:
    from .personas import PERSONAS, PLATFORM_AGENT, get
    from .platform_playbooks import build_script, get_playbook, study_markdown
    from .interviewer import Brief, ClientProfile
except ImportError:
    from personas import PERSONAS, PLATFORM_AGENT, get
    from platform_playbooks import build_script, get_playbook, study_markdown
    from interviewer import Brief, ClientProfile

KPI_BY_OBJECTIVE = {
    "ventas": "Clics y conversiones a la oferta (leads / ventas por canal)",
    "audiencia": "Crecimiento de seguidores y alcance a no seguidores",
    "autoridad": "Guardados, comentarios de calidad y visitas al perfil",
    "comunidad": "Respuestas, miembros activos y mensajes directos",
}


@dataclass
class Context:
    project_id: str
    brief: Brief
    out_dir: str
    artifacts: dict = field(default_factory=dict)   # agent key -> markdown / data
    handoffs: list = field(default_factory=list)
    scripts: dict = field(default_factory=dict)     # channel -> list[script dict]
    pillars: list = field(default_factory=list)
    log: list = field(default_factory=list)

    def say(self, msg: str) -> None:
        self.log.append(f"{datetime.datetime.now().isoformat(timespec='seconds')} {msg}")

    def handoff(self, src: str, dst: str, what: str) -> None:
        self.handoffs.append((src, dst, what))
        self.say(f"HANDOFF {src} -> {dst}: {what}")

    def save(self, key: str, content: str, filename: str | None = None) -> str:
        self.artifacts[key] = content
        path = os.path.join(self.out_dir, "artifacts", filename or f"{key}.md")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        self.say(f"ARTIFACT {key} -> {os.path.relpath(path, self.out_dir)}")
        return path


def _head(key: str) -> str:
    p = get(key)
    return f"{p.header}\n\n> {p.voice}\n\n"


# --------------------------------------------------------------------- steps
def step_director(ctx: Context) -> None:
    b = ctx.brief
    errors = []
    if not b.offer:
        errors.append("falta la oferta")
    if not b.channels:
        errors.append("falta al menos un canal")
    if errors:
        raise ValueError("Brief incompleto: " + ", ".join(errors))
    body = (_head("director") + "# Plan de campaña\n\n"
            f"**Visión:** {b.objective} para *{b.offer}* dirigido a *{b.buyer}*, tono {b.tone}.\n\n"
            "## Encargos\n"
            "- Strategist: idea central, 3 pilares y KPI.\n"
            "- Audience Researcher: dolores y lenguaje real del comprador.\n"
            + "".join(f"- {get(PLATFORM_AGENT[c]).name}: estudio de {c} antes de cualquier guion.\n" for c in b.channels)
            + "- Writer: un guion por red, solo después de su estudio.\n"
            "- Visual Producer, Quality Editor, Social Manager, Community Manager, Growth Analyst: en cadena.\n\n"
            "## Criterio de 'terminado'\nCada pieza cumple las reglas de su red y apunta al KPI principal.\n")
    ctx.save("director", body)
    ctx.handoff("interviewer", "director", "brief aprobado")
    ctx.handoff("director", "strategist", "plan y encargos")
    ctx.handoff("director", "audience_researcher", "plan y encargos")


def step_strategist(ctx: Context) -> None:
    b = ctx.brief
    ctx.pillars = [f"Educar: por qué {b.offer} funciona para {b.buyer}",
                   f"Prueba: resultados y ejemplos reales de {b.offer}",
                   f"Conversación: preguntas y objeciones frecuentes de {b.buyer}"]
    body = (_head("strategist") + "# Estrategia\n\n"
            f"**Idea central:** {b.offer} es la forma más simple para que {b.buyer} consiga resultados.\n\n"
            "## Pilares de contenido\n" + "".join(f"{i}. {p}\n" for i, p in enumerate(ctx.pillars, 1)) +
            f"\n## KPI principal\n{KPI_BY_OBJECTIVE.get(b.objective, KPI_BY_OBJECTIVE['ventas'])}\n")
    ctx.save("strategist", body)
    ctx.handoff("strategist", "writer", "idea central y pilares")
    ctx.handoff("strategist", "growth_analyst", "KPI principal")
    for c in ctx.brief.channels:
        ctx.handoff("strategist", PLATFORM_AGENT[c], "idea central y pilares")


def step_audience(ctx: Context) -> None:
    b = ctx.brief
    rows = "".join(f"- **{get_playbook(c).label}:** {get_playbook(c).audience_mode}\n" for c in b.channels)
    body = (_head("audience_researcher") + "# Audiencia\n\n"
            f"**Comprador:** {b.buyer}\n**Problema:** {b.pain or '(por validar con entrevistas)'}\n\n"
            "## Mentalidad por red\n" + rows +
            "\n> Todo lo anterior es hipótesis hasta validarlo con comentarios y métricas reales.\n")
    ctx.save("audience_researcher", body)
    ctx.handoff("audience_researcher", "writer", "dolores y lenguaje del comprador")
    for c in b.channels:
        ctx.handoff("audience_researcher", PLATFORM_AGENT[c], "mentalidad de la audiencia en su red")


def step_platform_studies(ctx: Context) -> None:
    for c in ctx.brief.channels:
        key = PLATFORM_AGENT[c]
        ctx.save(key, study_markdown(c, ctx.brief), f"platform-study-{c}.md")
        ctx.handoff(key, "writer", f"estudio de {c} (formato, ganchos, reglas)")


def step_writer(ctx: Context, ideas_per_channel: int = 3) -> None:
    out = [_head("writer") + "# Guiones por red\n"]
    for c in ctx.brief.channels:
        if PLATFORM_AGENT[c] not in ctx.artifacts:
            raise RuntimeError(f"El Writer no puede escribir para {c} sin su estudio previo.")
        ctx.scripts[c] = []
        out.append(f"\n## {get_playbook(c).label}\n")
        for n in range(1, ideas_per_channel + 1):
            pillar = ctx.pillars[(n - 1) % len(ctx.pillars)]
            s = build_script(c, ctx.brief, pillar, n)
            ctx.scripts[c].append(s)
            out.append(f"\n### Pieza {n} — pilar: {pillar}\n**Gancho:** {s['hook']}\n")
            for beat in s["beats"]:
                out.append(f"- `{beat['t']}` **{beat['beat']}** → {beat['line']}\n")
            out.append(f"- **CTA:** {s['cta']}\n- **Caption:** {s['caption']}\n")
    ctx.save("writer", "".join(out))
    ctx.handoff("writer", "visual_producer", "guiones con beats y texto en pantalla")
    ctx.handoff("writer", "quality_editor", "guiones para revisión")


def step_media(ctx: Context, fetch: bool = False) -> None:
    """Media Scout: builds topic-related search queries; downloads only if ``fetch``."""
    b = ctx.brief
    queries = [b.offer, f"{b.offer} lifestyle"]
    if not b.buyer.startswith("público general"):
        queries.insert(1, b.buyer)
    humor = "memes" if b.tone in ("divertido", "cercano") else None
    lines = [_head("media_scout") + "# Búsqueda de medios\n\n## Consultas\n"]
    lines += [f"- {q}\n" for q in queries]
    if humor:
        lines.append(f"\n## Humor\nSubreddit sugerido: r/{humor} (licencia no verificada: revisar derechos).\n")
    downloaded: list = []
    if fetch:
        try:
            from .image_reference_agent import ImageReferenceAgent
            from .video_meme_agent import VideoMemeAgent
        except ImportError:
            from image_reference_agent import ImageReferenceAgent
            from video_meme_agent import VideoMemeAgent
        assets = os.path.join(ctx.out_dir, "assets")
        imgs, vids = ImageReferenceAgent(os.path.join(assets, "images")), VideoMemeAgent(os.path.join(assets, "videos"))
        for q in queries[:2]:
            downloaded += imgs.search_and_download(q, 2)
        downloaded += vids.search_videos(b.offer, 1)
        if humor:
            downloaded += vids.fetch_memes(humor, 2)
        lines.append("\n## Archivos descargados (cada uno con su .meta.json de licencia)\n")
        lines += [f"- {os.path.relpath(p, ctx.out_dir)}\n" for p in downloaded] or ["- (ninguno disponible)\n"]
    else:
        lines.append("\n> Descarga desactivada (usa fetch_media=True). Solo se generó el plan de búsqueda.\n")
    ctx.save("media_scout", "".join(lines))
    ctx.handoff("writer", "media_scout", "temas y escenas que necesitan material")
    ctx.handoff("media_scout", "visual_producer", f"{len(downloaded)} archivos con licencia registrada")


def step_visual(ctx: Context) -> None:
    comps = []
    for c, scripts in ctx.scripts.items():
        pb = get_playbook(c)
        for i, s in enumerate(scripts, 1):
            frames = 0
            scenes = []
            for beat in s["beats"]:
                f = beat["seconds"] * pb.fps
                scenes.append({"name": beat["beat"], "from": frames, "durationInFrames": f,
                               "text": beat["on_screen"]})
                frames += f
            comps.append({"id": f"{c}-{i}", "width": pb.resolution[0], "height": pb.resolution[1],
                          "fps": pb.fps, "durationInFrames": frames, "scenes": scenes})
    ctx.artifacts["_compositions"] = comps
    body = (_head("visual_producer") + "# Composiciones (estilo Remotion)\n\n"
            "Cada composición describe escenas con duración en fotogramas y texto en pantalla.\n\n"
            "```json\n" + json.dumps(comps, ensure_ascii=False, indent=2) + "\n```\n")
    ctx.save("visual_producer", body)
    ctx.handoff("visual_producer", "quality_editor", "composiciones para revisión")


def _review(ctx: Context) -> list[str]:
    issues = []
    for c, scripts in ctx.scripts.items():
        pb = get_playbook(c)
        for i, s in enumerate(scripts, 1):
            tag = f"{c} #{i}"
            if not s["hook"]:
                issues.append(f"{tag}: sin gancho")
            if c in ("tiktok", "instagram", "facebook") and len(s["hook"]) > 90:
                issues.append(f"{tag}: gancho largo para una ventana de {pb.hook_window}")
            if c == "linkedin" and len(s["hook"]) > 140:
                issues.append(f"{tag}: gancho supera lo visible antes del 'ver más'")
            if not s["cta"]:
                issues.append(f"{tag}: sin CTA")
            if sum(b["seconds"] for b in s["beats"]) > pb.duration_s[1]:
                issues.append(f"{tag}: duración mayor al máximo recomendado")
    return issues


def step_quality(ctx: Context) -> None:
    issues = _review(ctx)
    status = "APROBADO" if not issues else "CAMBIOS REQUERIDOS"
    body = (_head("quality_editor") + f"# Revisión: **{status}**\n\n"
            "## Lista de control\n- Gancho dentro de la ventana de su red\n- Una sola CTA\n"
            "- Duración dentro del rango de la red\n- Coherencia con idea central y tono\n\n"
            "## Hallazgos\n" + ("".join(f"- {i}\n" for i in issues) or "- Sin hallazgos.\n"))
    ctx.save("quality_editor", body)
    ctx.handoff("quality_editor", "social_manager", f"piezas {status.lower()}")


def step_social(ctx: Context) -> None:
    days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    rows = []
    for ci, c in enumerate(ctx.brief.channels):
        for i, s in enumerate(ctx.scripts.get(c, [])):
            rows.append(f"| {days[(ci + i * 2) % 7]} | {get_playbook(c).label} | Pieza {i + 1} | {s['hook'][:50]} |")
    body = (_head("social_manager") + "# Calendario (semana 1)\n\n| Día | Red | Pieza | Gancho |\n|---|---|---|---|\n"
            + "\n".join(rows) + "\n\n## Cadencia por red\n"
            + "".join(f"- **{get_playbook(c).label}:** {get_playbook(c).cadence}\n" for c in ctx.brief.channels))
    ctx.save("social_manager", body)
    ctx.handoff("social_manager", "community_manager", "calendario y piezas publicadas")
    ctx.handoff("social_manager", "growth_analyst", "calendario para medir")


def step_community(ctx: Context) -> None:
    b = ctx.brief
    body = (_head("community_manager") + "# Guía de respuestas\n\n"
            "- Responder en menos de 2 horas las primeras 24 h.\n"
            f"- Preguntas de precio u oferta → responder con valor y guiar a *{b.offer}*.\n"
            "- Objeciones → agradecer, aclarar, ofrecer un ejemplo.\n"
            "- Cada comentario recurrente = idea para el siguiente contenido (se envía al Growth Analyst).\n")
    ctx.save("community_manager", body)
    ctx.handoff("community_manager", "growth_analyst", "comentarios y objeciones recurrentes")


def step_growth(ctx: Context) -> None:
    b = ctx.brief
    rows = "".join(f"- **{get_playbook(c).label}:** " + ", ".join(get_playbook(c).metrics) + "\n" for c in b.channels)
    body = (_head("growth_analyst") + "# Métricas y experimentos\n\n"
            f"**KPI principal:** {KPI_BY_OBJECTIVE.get(b.objective, KPI_BY_OBJECTIVE['ventas'])}\n\n"
            "## Métricas por red\n" + rows +
            "\n## Experimentos (semana 2)\n"
            "1. Hipótesis: otro gancho aumenta la retención. Probar gancho alterno de cada guion.\n"
            "2. Hipótesis: CTA distinta aumenta comentarios. Probar una por pieza.\n"
            "\nCriterio de éxito: +20% en la métrica principal de la red frente a la semana 1.\n")
    ctx.save("growth_analyst", body)
    ctx.handoff("growth_analyst", "strategist", "aprendizajes para ajustar estrategia")
    ctx.handoff("growth_analyst", "writer", "ganchos que funcionaron")


# ------------------------------------------------------------------ pipeline
class Pipeline:
    def __init__(self, project_id: str, output_root: str = "output"):
        self.project_id = project_id
        self.output_root = output_root

    def run(self, brief: Brief, ideas_per_channel: int = 3, fetch_media: bool = False) -> Context:
        out_dir = os.path.join(self.output_root, self.project_id)
        os.makedirs(out_dir, exist_ok=True)
        ctx = Context(self.project_id, brief, out_dir)
        with open(os.path.join(out_dir, "brief.md"), "w", encoding="utf-8") as f:
            f.write(brief.to_markdown())
        ClientProfile.from_brief(brief).save(os.path.join(out_dir, "client-profile.json"))
        step_director(ctx)
        step_strategist(ctx)
        step_audience(ctx)
        step_platform_studies(ctx)
        step_writer(ctx, ideas_per_channel)
        step_media(ctx, fetch_media)
        step_visual(ctx)
        step_quality(ctx)
        step_social(ctx)
        step_community(ctx)
        step_growth(ctx)
        self._finish(ctx)
        return ctx

    def _finish(self, ctx: Context) -> None:
        issues = _review(ctx)
        cp = ["# Checkpoint", "", f"- Proyecto: `{ctx.project_id}`",
              f"- Canales: {', '.join(ctx.brief.channels)}",
              f"- Revisión de calidad: {'aprobada' if not issues else str(len(issues)) + ' hallazgos'}",
              f"- Confianza del brief: {int(ctx.brief.confidence * 100)}%", "",
              "## Conexiones (quién entregó qué a quién)"]
        cp += [f"- {a} → {b}: {w}" for a, b, w in ctx.handoffs]
        with open(os.path.join(ctx.out_dir, "checkpoint.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(cp))
        with open(os.path.join(ctx.out_dir, "log.txt"), "w", encoding="utf-8") as f:
            f.write("\n".join(ctx.log))
