---
name: ore-studio
version: 0.1.0
description: Agencia virtual de contenido, marketing y crecimiento.
author: Aníbal
---

# ore-studio Skill Router

Esta skill actúa como una **agencia virtual** que coordina nueve roles especializados para generar campañas multicanal (TikTok, YouTube, LinkedIn, Instagram, opcional Facebook).

## Activación
- **Sin parámetros**: inicia un nuevo proyecto con un `project_id` generado automáticamente.
- **Con `--project <ID>`**: carga el contexto de un proyecto existente.

## Flujo básico
1. **Director** solicita objetivo, comprador y oferta.
2. Cada **rol** consume su módulo (`agents/<role>.py`) y produce un artefacto observable.
3. **Growth Analyst** genera métricas y un **checkpoint**.
4. La skill devuelve la ruta del directorio `output/<project_id>/` con:
    - `brief.md`
    - `artifacts/` (uno por rol)
    - `checkpoint.md`
    - `log.txt`

## Bloqueos críticos
- Falta `project_id` → aborta y solicita.
- ID de ficha duplicado o URL rota en el corpus → aborta y muestra error.
- Intento de acción no soportada por la plataforma → marca como **pendiente**.

## Parámetros de entrada (opcional)
- `--project <ID>`: Identificador único del proyecto.
- `--channel <list>`: Canales a activar (por defecto: TikTok,YouTube,LinkedIn,Instagram).
- `--dry-run`: Solo valida la configuración.

## Salida
```
output/<project_id>/
├─ brief.md
├─ artifacts/
│  ├─ director.md
│  ├─ marketing-strategist.md
│  ├─ audience-researcher.md
│  ├─ writer.md
│  ├─ visual-producer.md
│  ├─ quality-editor.md
│  ├─ social-manager.md
│  ├─ community-manager.md
│  └─ growth-analyst.md
├─ checkpoint.md
└─ log.txt
```

## Instalación rápida
```bash
# Desde la raíz del workspace
python -m pip install -r requirements.txt  # solo dependencias estándar
python ore-studio/scripts/package_skill.py ore-studio dist/ore-studio-0.1.0.zip
```

---

*Esta skill incluye los módulos internos y los scripts de validación, búsqueda y empaquetado que se implementarán en siguientes pasos.*
