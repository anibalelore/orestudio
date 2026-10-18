import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "orebal-studio"))
from agents.personas import PERSONAS, connections_report  # noqa: E402


class OperationalProfileTests(unittest.TestCase):
    def test_operational_roles_have_complete_cards(self):
        roles = ["operations_director", "sales", "onboarding", "project_operations", "cash_operations"]
        required = ["## Misión", "## Referentes y fuentes", "## Principios", "## Tono", "## Prioridades",
                    "## Preguntas de diagnóstico", "## Errores que detecta", "## Cuándo discrepa", "## Límites",
                    "## Herramientas autorizadas", "## Entradas", "## Entregables", "## Terminado",
                    "## Respuestas originales", "## Decisión observable"]
        for role in roles:
            self.assertIn(role, PERSONAS)
            card = ROOT / "orebal-studio" / "references" / "roles" / f"{role.replace('_', '-')}.md"
            text = card.read_text(encoding="utf-8")
            for heading in required:
                self.assertIn(heading, text, f"{role}: {heading}")
            self.assertGreaterEqual(text.count("### Ejemplo"), 2)

    def test_all_connections_remain_reciprocal(self):
        self.assertEqual([], connections_report())


if __name__ == "__main__":
    unittest.main()
