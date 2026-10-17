# ore‑studio

**Ore‑Studio** is a virtual agency skill that coordinates nine specialized agents to create multichannel marketing campaigns (TikTok, YouTube, LinkedIn, Instagram, optional Facebook). It provides a CLI‑style interface, generates a project folder with a brief, per‑role artefacts, a checkpoint and a log.

## Features
- **Nine role agents** – Director, Strategist, Audience Researcher, Writer, Visual Producer, Quality Editor, Social Manager, Community Manager, Growth Analyst.
- **Prompt‑driven workflow** – Starts from a high‑level objective and produces a full campaign package.
- **Validation script** (`scripts/validate_skill.py`) to ensure `SKILL.md` integrity.
- **Search utility** (`scripts/search_corpus.py`) for quick corpus lookup.
- **Packaging script** (`scripts/package_skill.py`) to create a distributable zip.

## Quick start
```bash
# Clone (if not already cloned)
git clone https://github.com/anibalelore/orestudio.git
cd "ORE Studio"
# Install minimal dependency
python -m pip install -r ore-studio/requirements.txt
# Validate the skill definition
python ore-studio/scripts/validate_skill.py
# Package the skill (creates dist/ore-studio-0.1.0.zip)
python ore-studio/scripts/package_skill.py ore-studio dist/ore-studio-0.1.0.zip
```

## Project layout
```
ORE Studio/
├─ ore‑studio/
│  ├─ SKILL.md                # Skill definition / router
│  ├─ agents/                 # Nine role modules
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
│  ├─ scripts/                # Helper utilities
│  │   ├─ validate_skill.py
│  │   ├─ search_corpus.py
│  │   └─ package_skill.py
│  └─ requirements.txt        # Minimal Python dependencies
├─ docs/                      # Documentation, prompts, specs
└─ README.md                  # (this file)
```

## License
MIT – feel free to fork, extend, and use in your own projects.
