"""CLI: run the whole agency.

Examples:
  python ore-studio/scripts/run_agency.py --project cafe --yes \\
      --offer "Café de especialidad por suscripción" \\
      --buyer "oficinistas que toman mal café" --channel tiktok,linkedin
  python ore-studio/scripts/run_agency.py --project demo      # interview (max 5 questions)
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from agents.interviewer import ClientProfile, Interviewer, ALL_CHANNELS  # noqa: E402
from agents.pipeline import Pipeline  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="ORE Studio agency runner")
    ap.add_argument("--project", required=True)
    ap.add_argument("--output", default="output")
    ap.add_argument("--channel", default="", help="comma-separated: " + ",".join(ALL_CHANNELS))
    ap.add_argument("--profile", default="", help="path to a reusable client-profile.json")
    ap.add_argument("--brand", default="", help="brand or business name")
    ap.add_argument("--offer", default="")
    ap.add_argument("--buyer", default="")
    ap.add_argument("--objective", default="")
    ap.add_argument("--tone", default="")
    ap.add_argument("--yes", action="store_true", help="skip the interview, use flags + flagged assumptions")
    args = ap.parse_args()

    profile = ClientProfile.load(args.profile) if args.profile else None
    iv = Interviewer(profile=profile)
    if args.brand:
        iv.answers["brand_name"] = args.brand
    for fld in ("offer", "buyer", "objective", "tone"):
        if getattr(args, fld):
            iv.answers[fld] = getattr(args, fld)
    if args.channel:
        iv.answers["channels"] = [c.strip() for c in args.channel.split(",") if c.strip() in ALL_CHANNELS]

    if args.yes:
        brief = iv.build_brief()
    else:
        brief = iv.run()
    ctx = Pipeline(args.project, args.output).run(brief)
    print(f"\nListo. Archivos en: {ctx.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
