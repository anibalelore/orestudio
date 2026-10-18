import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "orebal-studio"))

from agents.interviewer import MAX_QUESTIONS, Brief, ClientProfile, Interviewer  # noqa: E402
from agents.personas import PLATFORM_AGENT, connections_report  # noqa: E402
from agents.pipeline import Context, Pipeline, step_writer  # noqa: E402
from scripts.run_agency import run_contract_request  # noqa: E402


class InterviewerTests(unittest.TestCase):
    def test_default_interview_has_six_initial_questions_and_can_advance(self):
        self.assertEqual(6, MAX_QUESTIONS)
        answers = iter([
            "quiero lanzar una academia",
            "cursos de automatización",
            "dueños de negocio",
            "autoridad",
            "linkedin",
            "experto",
            "avanzar",
        ])
        interviewer = Interviewer()

        brief = interviewer.run(ask=lambda _prompt: next(answers), say=lambda _message: None)

        self.assertEqual(6, len(interviewer.asked))
        self.assertEqual("", brief.pain)

    def test_optional_follow_up_requires_consent(self):
        answers = iter([
            "quiero lanzar una academia",
            "cursos de automatización",
            "dueños de negocio",
            "autoridad",
            "linkedin",
            "experto",
            "sí",
            "pierden horas en tareas repetitivas",
            "avanzar",
        ])
        interviewer = Interviewer()

        brief = interviewer.run(ask=lambda _prompt: next(answers), say=lambda _message: None)

        self.assertEqual(7, len(interviewer.asked))
        self.assertEqual("pierden horas en tareas repetitivas", brief.pain)

    def test_interview_never_exceeds_question_budget(self):
        interviewer = Interviewer(max_questions=3)
        answers = iter(["una academia", "dueños de negocio", "autoridad", "avanzar"])

        interviewer.run(ask=lambda _prompt: next(answers), say=lambda _message: None)

        self.assertEqual(3, len(interviewer.asked))

    def test_client_profile_reuses_business_context_without_reasking(self):
        profile = ClientProfile(
            brand_name="ORE",
            offer="automatización de contenido",
            buyer="fundadores de pequeñas empresas",
            tone="directo",
            proof="10 campañas publicadas",
            constraints="no prometer resultados garantizados",
        )

        interviewer = Interviewer(profile=profile)

        pending = [question.field for question in interviewer.next_questions()]
        self.assertNotIn("offer", pending)
        self.assertNotIn("buyer", pending)
        self.assertNotIn("tone", pending)
        self.assertIn("objective", pending)
        brief = interviewer.build_brief()
        self.assertEqual(profile.offer, brief.offer)
        self.assertEqual(profile.constraints, brief.constraints)

    def test_client_profile_round_trips_as_json(self):
        profile = ClientProfile("ORE", "servicio", "fundadores", "experto", "casos", "sin humo")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "client-profile.json"
            profile.save(path)
            loaded = ClientProfile.load(path)

        self.assertEqual(profile, loaded)


class ConnectedPipelineTests(unittest.TestCase):
    def test_versioned_contract_keeps_client_profile_and_studies_before_writer(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = run_contract_request({
                "contractVersion": 1,
                "organizationId": "org",
                "clientId": "anibal",
                "projectId": "pilot",
                "profileVersionId": "profile-v2",
                "offer": "consultoría",
                "buyer": "fundadores",
                "channels": ["tiktok"],
                "outputRoot": tmp,
            })
        self.assertEqual(1, result["contractVersion"])
        self.assertEqual("anibal", result["clientId"])
        self.assertEqual("profile-v2", result["profileVersionId"])
        kinds = [item["kind"] for item in result["artifacts"]]
        self.assertLess(kinds.index("platform-study-tiktok"), kinds.index("writer"))

    def test_persona_handoffs_are_reciprocal(self):
        self.assertEqual([], connections_report())

    def test_writer_refuses_to_write_without_platform_study(self):
        brief = Brief(offer="servicio", buyer="fundadores", channels=["tiktok"])
        with tempfile.TemporaryDirectory() as tmp:
            ctx = Context("demo", brief, tmp, pillars=["educar"])
            with self.assertRaisesRegex(RuntimeError, "sin su estudio previo"):
                step_writer(ctx, ideas_per_channel=1)

    def test_pipeline_persists_reusable_client_profile_and_platform_study(self):
        brief = Brief(
            brand_name="ORE",
            offer="servicio",
            buyer="fundadores",
            channels=["linkedin"],
            tone="experto",
        )
        with tempfile.TemporaryDirectory() as tmp:
            context = Pipeline("demo", tmp).run(brief, ideas_per_channel=1)
            profile_path = Path(context.out_dir) / "client-profile.json"
            study_path = Path(context.out_dir) / "artifacts" / "platform-study-linkedin.md"
            writer_path = Path(context.out_dir) / "artifacts" / "writer.md"

            self.assertTrue(profile_path.exists())
            self.assertEqual("ORE", json.loads(profile_path.read_text(encoding="utf-8"))["brand_name"])
            self.assertTrue(study_path.exists())
            self.assertTrue(writer_path.exists())
            self.assertLess(
                context.log.index(next(item for item in context.log if "platform-study-linkedin.md" in item)),
                context.log.index(next(item for item in context.log if "ARTIFACT writer" in item)),
            )
            self.assertEqual("linkedin_strategist", PLATFORM_AGENT["linkedin"])

    def test_cli_can_start_campaign_from_saved_client_profile(self):
        profile = ClientProfile("ORE", "servicio", "fundadores", "experto", "casos", "sin humo")
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            profile_path = tmp_path / "profile.json"
            profile.save(profile_path)
            result = subprocess.run(
                [sys.executable, str(ROOT / "orebal-studio" / "scripts" / "run_agency.py"),
                 "--project", "second-campaign", "--output", str(tmp_path / "output"),
                 "--profile", str(profile_path), "--yes", "--channel", "tiktok"],
                cwd=ROOT, capture_output=True, text=True,
            )

            self.assertEqual(0, result.returncode, result.stderr)
            saved = json.loads((tmp_path / "output" / "second-campaign" /
                                "client-profile.json").read_text(encoding="utf-8"))
            self.assertEqual("ORE", saved["brand_name"])
            self.assertEqual("servicio", saved["offer"])


if __name__ == "__main__":
    unittest.main()
