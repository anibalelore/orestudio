# Interviewer Agent

"""Short, adaptive client interview. Goal: understand what the client wants
WITHOUT endless questions.

How it avoids endless questions:
  * hard cap on the number of questions (``MAX_QUESTIONS``, default 5);
  * questions are asked in order of impact and only for what is still missing;
  * every question offers a recommended default ("ok" accepts it);
  * anything still unknown is filled with an explicit, flagged assumption;
  * a free-text opening message is parsed first, so already-given info is not asked again.
"""

import re
import json
from pathlib import Path
from dataclasses import asdict
from dataclasses import dataclass, field

try:
    from .personas import get
except ImportError:
    from personas import get

MAX_QUESTIONS = 5
ALL_CHANNELS = ["tiktok", "instagram", "linkedin", "youtube", "facebook"]
DEFAULT_CHANNELS = ["tiktok", "instagram", "linkedin", "youtube"]

CHANNEL_WORDS = {
    "tiktok": ["tiktok", "tik tok"],
    "instagram": ["instagram", "reels", "insta"],
    "linkedin": ["linkedin"],
    "youtube": ["youtube", "shorts"],
    "facebook": ["facebook"],
}

OBJECTIVE_WORDS = {
    "ventas": ["vender", "ventas", "venta", "comprar", "convertir", "leads"],
    "audiencia": ["seguidores", "audiencia", "crecer", "alcance", "viral"],
    "autoridad": ["autoridad", "marca personal", "posicionar", "reputación"],
    "comunidad": ["comunidad", "fidelizar", "retención"],
}


@dataclass
class Question:
    field: str
    text: str
    default: str
    why: str


# Ordered by impact on the rest of the pipeline.
QUESTIONS = [
    Question("offer", "¿Qué vendes o promocionas, en una frase?", "",
             "Sin oferta no hay mensaje."),
    Question("buyer", "¿A quién le hablas? (quién es y qué problema tiene hoy)", "",
             "Define el lenguaje y los ganchos."),
    Question("objective", "¿Qué quieres lograr con esta campaña? (ventas / audiencia / autoridad / comunidad)",
             "ventas", "Decide el KPI y la llamada a la acción."),
    Question("channels", "¿En qué redes? (tiktok, instagram, linkedin, youtube, facebook)",
             ", ".join(DEFAULT_CHANNELS), "Cada red tiene su propio estudio y guion."),
    Question("tone", "¿Qué tono prefieres? (cercano / experto / divertido / premium)",
             "cercano", "Define la voz de todos los agentes."),
]


@dataclass
class Brief:
    brand_name: str = ""
    offer: str = ""
    buyer: str = ""
    pain: str = ""
    objective: str = "ventas"
    channels: list[str] = field(default_factory=lambda: list(DEFAULT_CHANNELS))
    tone: str = "cercano"
    proof: str = ""
    constraints: str = ""
    assumptions: list[str] = field(default_factory=list)
    confidence: float = 1.0

    def to_markdown(self) -> str:
        p = get("interviewer")
        lines = [p.header, "", f"> {p.voice}", "", "# Brief de campaña", "",
                 f"- **Marca/negocio:** {self.brand_name or '(por confirmar)'}",
                 f"- **Oferta:** {self.offer}",
                 f"- **Comprador:** {self.buyer}",
                 f"- **Problema principal:** {self.pain or '(por confirmar)'}",
                 f"- **Objetivo:** {self.objective}",
                 f"- **Canales:** {', '.join(self.channels)}",
                 f"- **Tono:** {self.tone}",
                 f"- **Prueba/diferencial:** {self.proof or '(por confirmar)'}",
                 f"- **Restricciones:** {self.constraints or 'ninguna declarada'}",
                 f"- **Confianza del brief:** {int(self.confidence * 100)}%", ""]
        if self.assumptions:
            lines += ["## Supuestos (corrígelos si no aplican)", ""]
            lines += [f"- {a}" for a in self.assumptions]
            lines.append("")
        lines += ["## Resumen para aprobar", "",
                  f"Quieres **{self.objective}** vendiendo *{self.offer}* a *{self.buyer}* "
                  f"en {', '.join(self.channels)}, con tono {self.tone}. ¿Avanzamos? (un solo 'sí')"]
        return "\n".join(lines)


@dataclass(eq=True)
class ClientProfile:
    """Reusable business context shared by future campaigns."""

    brand_name: str = ""
    offer: str = ""
    buyer: str = ""
    tone: str = "cercano"
    proof: str = ""
    constraints: str = ""

    @classmethod
    def from_brief(cls, brief: Brief) -> "ClientProfile":
        return cls(brief.brand_name, brief.offer, brief.buyer, brief.tone,
                   brief.proof, brief.constraints)

    def save(self, path: str | Path) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(asdict(self), ensure_ascii=False, indent=2) + "\n",
                          encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path) -> "ClientProfile":
        return cls(**json.loads(Path(path).read_text(encoding="utf-8")))


def _extract(text: str) -> dict:
    """Best-effort extraction from a free-text opening message."""
    low = text.lower()
    found: dict = {}
    chans = [c for c, words in CHANNEL_WORDS.items() if any(w in low for w in words)]
    if chans:
        found["channels"] = chans
    for obj, words in OBJECTIVE_WORDS.items():
        if any(w in low for w in words):
            found["objective"] = obj
            break
    m = re.search(r"\s(?:a|para)\s+([\wáéíóúñ ]{3,40}?)(?=\s+en\s+(?:tiktok|instagram|linkedin|youtube|facebook)|[,.]|$)", low)
    if m and len(m.group(1).strip()) > 3:
        found["buyer_hint"] = m.group(1).strip()
    return found


def _clean_offer(text: str) -> str:
    """Turn 'quiero vender cursos de excel a contadores en linkedin' into 'cursos de excel'."""
    t = re.sub(r"^(quiero|necesito|busco|vamos a)\s+(vender|promocionar|lanzar|ofrecer)\s+", "", text.strip(), flags=re.I)
    t = re.split(r"\s+(?:a|para)\s+|\s+en\s+(?:tiktok|instagram|linkedin|youtube|facebook)", t, maxsplit=1, flags=re.I)[0]
    return t.strip(" .,") or text.strip()


class Interviewer:
    def __init__(self, max_questions: int = MAX_QUESTIONS,
                 profile: ClientProfile | None = None):
        self.max_questions = max_questions
        self.answers: dict = {}
        self.asked: list[str] = []
        self.profile = profile
        if profile:
            for key in ("brand_name", "offer", "buyer", "tone", "proof", "constraints"):
                value = getattr(profile, key)
                if value:
                    self.answers[key] = value

    def ingest(self, text: str) -> None:
        """Feed the opening message so we don't ask what is already known."""
        info = _extract(text)
        for k in ("channels", "objective", "buyer_hint"):
            if k in info:
                self.answers[k] = info[k]
        if "offer" not in self.answers and text.strip():
            self.answers["offer_hint"] = text.strip()

    def next_questions(self) -> list[Question]:
        """Pending questions, highest impact first, limited by the remaining budget."""
        remaining = self.max_questions - len(self.asked)
        pending = [q for q in QUESTIONS if q.field not in self.answers and q.field not in self.asked]
        return pending[:max(0, remaining)]

    def answer(self, field_name: str, value: str) -> None:
        self.asked.append(field_name)
        value = (value or "").strip()
        q = next((q for q in QUESTIONS if q.field == field_name), None)
        if not value or value.lower() in {"ok", "si", "sí", "default", "lo que recomiendes"}:
            value = q.default if q else ""
        if field_name == "channels":
            low = value.lower()
            chans = [c for c in ALL_CHANNELS if c in low]
            value = chans or list(DEFAULT_CHANNELS)
        if value != "":
            self.answers[field_name] = value

    def build_brief(self) -> Brief:
        a = self.answers
        b = Brief()
        assumptions = []
        b.brand_name = a.get("brand_name", "")
        b.offer = a.get("offer") or _clean_offer(a.get("offer_hint", ""))
        if not a.get("offer"):
            assumptions.append("Oferta tomada del mensaje inicial; confirma el nombre exacto.")
        b.buyer = a.get("buyer") or a.get("buyer_hint") or ""
        if not b.buyer:
            b.buyer = "público general interesado en la oferta"
            assumptions.append("Comprador genérico: sin esto los ganchos serán menos específicos.")
        b.objective = a.get("objective", "ventas")
        if "objective" not in a:
            assumptions.append("Objetivo asumido: ventas.")
        b.channels = a.get("channels") or list(DEFAULT_CHANNELS)
        if "channels" not in a:
            assumptions.append(f"Canales asumidos: {', '.join(DEFAULT_CHANNELS)}.")
        b.tone = a.get("tone", "cercano")
        if "tone" not in a:
            assumptions.append("Tono asumido: cercano.")
        b.pain = a.get("pain", "")
        b.proof = a.get("proof", "")
        b.constraints = a.get("constraints", "")
        b.assumptions = assumptions
        missing_core = sum(1 for k in ("offer", "buyer", "objective", "channels") if k not in a)
        b.confidence = round(max(0.3, 1 - 0.15 * missing_core - 0.05 * len(assumptions)), 2)
        return b

    def run(self, opening: str = "", ask=input, say=print) -> Brief:
        """Interactive session, never exceeds ``max_questions``."""
        p = get("interviewer")
        say(f"{p.emoji} {p.name}: {p.voice}")
        if opening:
            self.ingest(opening)
        else:
            self.ingest(ask("Cuéntame en una frase qué quieres lograr: ").strip())
            self.asked.append("opening")
        for q in self.next_questions():
            hint = f" [{q.default}]" if q.default else ""
            self.answer(q.field, ask(f"{q.text}{hint}: "))
        brief = self.build_brief()
        say("\n" + brief.to_markdown())
        return brief
