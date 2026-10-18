import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class OrebalBrandingTests(unittest.TestCase):
    def test_skill_and_control_plane_are_orebal_version_2(self):
        skill = (ROOT / "orebal-studio" / "SKILL.md").read_text(encoding="utf-8")
        package = json.loads((ROOT / "apps" / "control-plane" / "package.json").read_text(encoding="utf-8"))
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("name: orebal-studio", skill)
        self.assertIn("OREBAL Studio", readme)
        self.assertIn("Versión 2.0.0", readme)
        self.assertEqual(package["name"], "@orebal-studio/control-plane")
        self.assertEqual(package["version"], "2.0.0")


if __name__ == "__main__":
    unittest.main()
