# Platform playbooks: per-network study + script builder

"""Every script is written from a per-platform *study*: how people behave on
that network, which format wins, hook formulas, structure, rules, metrics.

IMPORTANT: the values below are working heuristics distilled from public
platform guidance and well-known creator practice. Networks change often:
validate them against current platform data / the client's own analytics
before relying on them (the Growth Analyst feeds learnings back here).
"""

from dataclasses import dataclass

try:
    from .personas import get, PLATFORM_AGENT
except ImportError:
    from personas import get, PLATFORM_AGENT


@dataclass(frozen=True)
class Playbook:
    key: str
    label: str
    audience_mode: str          # what the user is doing/feeling on this network
    formats: tuple[str, ...]
    spec: str                   # aspect ratio / length
    resolution: tuple[int, int]
    fps: int
    duration_s: tuple[int, int]
    hook_window: str
    hook_formulas: tuple[str, ...]   # use {buyer} {pain} {offer} {promise}
    structure: tuple[str, ...]       # beats in order
    rules: tuple[str, ...]
    avoid: tuple[str, ...]
    cta_style: str
    cadence: str
    metrics: tuple[str, ...]
    caption_hint: str


PLAYBOOKS: dict[str, Playbook] = {
    "tiktok": Playbook(
        "tiktok", "TikTok",
        "Descubrimiento rápido: desliza, no busca. Decide en 1–2 segundos si se queda.",
        ("Video vertical corto", "Serie con formato repetible", "Respuesta a comentarios en video"),
        "9:16, 15–45 s (sweet spot ~20–35 s)", (1080, 1920), 30, (15, 45),
        "primeros 1–2 segundos",
        ("{buyer}: si {pain}, deja de hacer esto.",
         "Cómo logré {promise} sin complicarme (paso a paso).",
         "Nadie le explica esto a {buyer}: {offer}.",
         "3 errores que cometen {buyer} (el #2 es el peor)."),
        ("Gancho (promesa o curiosidad)", "Contexto en 1 línea", "3 puntos / pasos con corte rápido",
         "Giro o prueba", "CTA único (comenta / sigue / guarda)"),
        ("Texto en pantalla y subtítulos siempre", "Corte o cambio visual cada 2–3 s",
         "Habla a cámara como persona, no como marca", "Primer cuadro ya con acción",
         "Usar sonido/tendencia solo si encaja con el mensaje"),
        ("Intro con logo", "Saludos largos", "Más de una llamada a la acción"),
        "Una acción simple: comentar una palabra clave, seguir o guardar.",
        "3–5 videos por semana (constancia > volumen).",
        ("Retención / % visto completo", "Compartidos", "Guardados", "Comentarios"),
        "Caption corto + 3–5 hashtags específicos."),
    "instagram": Playbook(
        "instagram", "Instagram",
        "Inspiración y pertenencia: mira, guarda y comparte con amigos.",
        ("Reels", "Carrusel educativo", "Stories de conversión"),
        "Reels 9:16, 15–45 s; carrusel 4:5 (1080×1350), 7–10 láminas", (1080, 1920), 30, (15, 45),
        "primeros 3 segundos / primera lámina del carrusel",
        ("{promise}: lo que nadie te cuenta si trabajas con {buyer}.",
         "Guarda esto si {pain}.",
         "Antes vs después de {offer} (resultado real).",
         "Para {buyer}: lo esencial de {offer} en 30 segundos."),
        ("Gancho visual + texto", "Valor concreto en 3 puntos", "Prueba o ejemplo",
         "CTA a guardar o enviar a alguien"),
        ("Coherencia visual de perfil", "Subtítulos en pantalla", "Un tema por pieza",
         "Carrusel: primera lámina = promesa, última = CTA", "Priorizar enviar/guardar"),
        ("Marcas de agua de otras apps", "Texto pequeño ilegible", "Hashtags en exceso"),
        "Pedir guardar o enviar a una persona concreta.",
        "3–4 Reels/carruseles por semana + Stories diarias.",
        ("Envíos (shares)", "Guardados", "Tiempo de reproducción", "Alcance a no seguidores"),
        "Caption con primera línea gancho + CTA."),
    "linkedin": Playbook(
        "linkedin", "LinkedIn",
        "Modo profesional: busca aprender, validarse y conectar. Lee más que mira.",
        ("Post de texto con historia", "Carrusel PDF", "Video corto con subtítulos"),
        "Texto ~900–1,300 caracteres; carrusel PDF 1080×1350, 8–12 láminas; video 30–90 s", (1080, 1350), 30, (30, 90),
        "primeras 2 líneas antes del 'ver más'",
        ("Hace un año {pain}. Esto cambió:",
         "{buyer}: probablemente cometes este error con {offer}.",
         "{promise}. Lo aprendí a la mala.",
         "3 lecciones que le habría dado a {buyer} hace 2 años."),
        ("Línea gancho (≤ 2 líneas)", "Historia breve con situación real", "Lección aplicable en 3 puntos",
         "Pregunta que invita a comentar"),
        ("Primera persona, experiencia específica", "Líneas cortas con aire entre ellas",
         "Una idea por post", "Responder comentarios las primeras horas", "Enlaces en comentarios, no en el cuerpo"),
        ("Jerga corporativa vacía", "Autopromoción directa", "Posts sin opinión"),
        "Una pregunta abierta que invite a comentar o guardar.",
        "3–5 posts por semana.",
        ("Comentarios de calidad", "Guardados", "Visitas al perfil", "Solicitudes de conexión relevantes"),
        "Sin hashtags excesivos (máx. 3)."),
    "youtube": Playbook(
        "youtube", "YouTube",
        "Intención: busca resolver algo concreto o entretenerse largo. Decide por título + miniatura.",
        ("Short", "Video largo (educativo o historia)"),
        "Short 9:16, 20–45 s; largo 16:9, 6–12 min", (1920, 1080), 30, (360, 720),
        "primeros 30 segundos (largo) / 1–2 s (Short)",
        ("Cómo {promise} (guía completa para {buyer}).",
         "Por qué {pain} y cómo arreglarlo.",
         "{offer}: lo que probé y lo que realmente funciona.",
         "Lo que ojalá supiera antes de {offer}."),
        ("Promesa del título cumplida al inicio", "Por qué importa + adelanto del resultado",
         "Desarrollo en capítulos", "Prueba / ejemplo", "Resumen + siguiente video como CTA"),
        ("Título y miniatura se diseñan antes del guion", "Patrón de interrupción cada 30–60 s",
         "Capítulos en la descripción", "Short = pieza independiente, no recorte flojo"),
        ("Intros largas", "Clickbait que no se cumple", "Relleno que no aporta"),
        "Invitar al siguiente video o a suscribirse con una razón concreta.",
        "1 video largo por semana + 2–3 Shorts.",
        ("CTR de miniatura", "Duración media de visualización", "% retenido", "Suscriptores por video"),
        "Descripción con capítulos y enlaces."),
    "facebook": Playbook(
        "facebook", "Facebook",
        "Comunidad y conversación: comparte con conocidos y comenta.",
        ("Reel", "Publicación para grupos", "Evento / transmisión"),
        "Reel 9:16, 15–45 s", (1080, 1920), 30, (15, 45),
        "primeros 3 segundos",
        ("{buyer}, ¿te pasa esto? {pain}.",
         "{promise}: comparte esto con alguien que lo necesite.",
         "Pregunta para la comunidad sobre {offer}."),
        ("Gancho", "Valor concreto", "Pregunta a la comunidad"),
        ("Contenido compartible", "Preguntas que generen comentarios", "Subtítulos"),
        ("Enlaces externos en exceso", "Contenido sin conversación"),
        "Una pregunta que invite a comentar o compartir.",
        "2–3 publicaciones por semana.",
        ("Compartidos", "Comentarios", "Participación en grupos"),
        "Texto breve con pregunta final."),
}


def get_playbook(channel: str) -> Playbook:
    return PLAYBOOKS[channel]


def _fill(template: str, brief) -> str:
    pain = brief.pain or f"no estás logrando resultados con {brief.offer}"
    promise = brief.proof or f"sacarle resultado a {brief.offer}"
    return template.format(buyer=brief.buyer, pain=pain, offer=brief.offer, promise=promise)


def study_markdown(channel: str, brief) -> str:
    """The per-platform study that MUST precede any script for that network."""
    pb = get_playbook(channel)
    agent = get(PLATFORM_AGENT[channel])
    out = [agent.header, "", f"> {agent.voice}", "", f"# Estudio de {pb.label}", "",
           f"**Comprador:** {brief.buyer}  |  **Objetivo:** {brief.objective}  |  **Tono:** {brief.tone}", "",
           "## Cómo se comporta la audiencia aquí", pb.audience_mode, "",
           "## Formatos que funcionan", *[f"- {f}" for f in pb.formats], "",
           f"## Especificaciones\n{pb.spec}. Ventana del gancho: **{pb.hook_window}**.", "",
           "## Fórmulas de gancho (aplicadas a este brief)",
           *[f"{i}. {_fill(t, brief)}" for i, t in enumerate(pb.hook_formulas, 1)], "",
           "## Estructura recomendada", *[f"{i}. {b}" for i, b in enumerate(pb.structure, 1)], "",
           "## Reglas de la red", *[f"- {r}" for r in pb.rules], "",
           "## Evitar", *[f"- {r}" for r in pb.avoid], "",
           f"## Llamada a la acción\n{pb.cta_style}", "",
           f"## Cadencia sugerida\n{pb.cadence}", "",
           "## Métricas que importan", *[f"- {m}" for m in pb.metrics], "",
           "> Heurísticas de trabajo: valida con datos actuales de la plataforma y con las métricas del cliente."]
    return "\n".join(out)


def build_script(channel: str, brief, pillar: str, idea_n: int = 1) -> dict:
    """Structured script for one piece, derived from the platform study."""
    pb = get_playbook(channel)
    hooks = [_fill(t, brief) for t in pb.hook_formulas]
    hook = hooks[(idea_n - 1) % len(hooks)]
    beats = []
    per = max(1, pb.duration_s[0] // max(1, len(pb.structure)))
    t = 0
    for i, name in enumerate(pb.structure):
        line = hook if i == 0 else f"➜ Escribe: {name.lower()} sobre «{pillar}» (tono {brief.tone})"
        beats.append({"t": f"{t}s", "beat": name, "line": line,
                      "on_screen": line[:60], "seconds": per})
        t += per
    return {"channel": channel, "pillar": pillar, "hook": hook, "alt_hooks": hooks,
            "beats": beats, "cta": pb.cta_style, "caption": pb.caption_hint,
            "spec": {"resolution": pb.resolution, "fps": pb.fps, "aspect": pb.spec}}
