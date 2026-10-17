# Diseño de ORE Studio

Fecha: 2026-10-16  
Estado: pendiente de aprobación

## Intención

Construir una única skill portable, `ore-studio`, que opere como agencia virtual de contenido, marketing y crecimiento para varios proyectos. La primera versión funcionará en Codex, Claude y Perplexity mediante el estándar `SKILL.md`; no incluirá todavía la oficina web animada ni integraciones que publiquen o trabajen en segundo plano.

La agencia conservará la identidad pública del proyecto atendido. Su criterio interno compartido se inspirará en el enfoque público documentado de Sabrina Ramonov, sin suplantarla, atribuirle decisiones privadas ni presentar ORE Studio como producto oficial suyo.

## Resultado de la primera versión

La entrega será una carpeta instalable `ore-studio/` y un archivo ZIP. Contendrá:

- un `SKILL.md` breve que active, dirija y cierre el trabajo;
- un núcleo compartido, versionado y cargado por todos los roles;
- nueve módulos de agentes dentro de la misma skill;
- procesos de brief, campaña, producción, revisión, conversión, medición, actualización y continuidad;
- soporte para proyectos aislados, empezando por la marca personal de Aníbal y eQatu;
- las 123 fichas documentadas como base recuperable, con metadatos, límites y trazabilidad;
- plantillas operativas y ejemplos suficientes para iniciar tareas reales;
- pruebas deterministas de estructura, referencias, cobertura y reglas críticas;
- instrucciones específicas de instalación y uso para Codex, Claude y Perplexity, basadas en sus capacidades actuales.

## Alcance y límites

### Incluido

- Crear campañas y piezas para TikTok, YouTube, LinkedIn e Instagram.
- Mantener Facebook Page como segunda etapa.
- Preparar investigación, brief, guiones completos, carruseles, Stories, calendarios, respuestas, diagnóstico comercial y planes de medición.
- Coordinar nueve especialidades secuencialmente o en paralelo cuando el entorno realmente lo permita.
- Registrar decisiones observables, fuentes, supuestos, versiones y estado editorial.
- Exportar un checkpoint portable para continuar en otra plataforma.
- Diseñar la preparación del lanzamiento de eQatu sin inventar datos del negocio.

### No incluido en esta versión

- Oficina web, personajes animados o panel visual.
- Ejecución persistente fuera de una sesión activa.
- Publicación, programación o respuesta automática en redes.
- Sincronización programada del corpus.
- Uso de credenciales, APIs o conectores externos.
- Afirmaciones de resultados, permisos, testimonios, precios o contactos no proporcionados.

La especificación de la oficina virtual se conservará como referencia de una fase futura, claramente marcada como no implementada.

## Arquitectura de archivos

```text
ore-studio/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── core.md
│   ├── operations.md
│   ├── roles.md
│   ├── roles/
│   │   ├── director.md
│   │   ├── marketing-strategist.md
│   │   ├── audience-researcher.md
│   │   ├── writer.md
│   │   ├── visual-producer.md
│   │   ├── quality-editor.md
│   │   ├── social-manager.md
│   │   ├── community-manager.md
│   │   └── growth-analyst.md
│   ├── project-context.md
│   ├── campaign-production.md
│   ├── conversion-measurement.md
│   ├── eqatu-launch.md
│   ├── knowledge-update.md
│   ├── virtual-office-spec.md
│   ├── platform-installation.md
│   ├── sources.md
│   ├── corpus-index.json
│   └── corpus/
│       ├── 2026.md
│       └── 2025.md
├── assets/
│   └── templates/
│       ├── project-profile.md
│       ├── campaign-brief.md
│       ├── content-package.md
│       ├── agent-handoff.md
│       └── checkpoint.md
└── scripts/
    ├── validate_skill.py
    └── search_corpus.py
```

`SKILL.md` será el router operativo y no duplicará el corpus. Las referencias permanecerán a un solo nivel desde el manifiesto; `corpus-index.json` permitirá búsqueda estructurada y los dos archivos Markdown conservarán fichas legibles completas.

## Flujo operativo

1. Identificar el proyecto y cargar únicamente su contexto autorizado.
2. Confirmar objetivo, comprador, oferta, evidencia, canales, CTA y restricciones; preguntar solo por bloqueos materiales.
3. Fijar versiones del núcleo, ficha de marca, línea editorial y módulos especialistas.
4. El director selecciona roles y define entregables, dependencias y criterios de aceptación.
5. Cada rol recupera fuentes pertinentes, aplica el núcleo y produce un artefacto observable.
6. El editor comprueba utilidad, evidencia, voz, marca, permisos y adecuación al canal.
7. El analista relaciona la pieza con intención, recorrido comercial, métricas y próximo experimento.
8. La skill entrega artefactos completos, decisiones pendientes y un checkpoint; nunca declara publicación o envío sin confirmación externa.

## Equipo integrado

Los nueve roles serán archivos independientes y direccionables dentro de una sola skill, no skills independientes:

1. Director de agencia.
2. Estratega de marketing.
3. Investigador de audiencia.
4. Guionista y redactor.
5. Productor visual y audiovisual.
6. Editor de calidad.
7. Encargado de redes.
8. Community manager.
9. Analista de crecimiento y conversión.

Cada módulo definirá entradas, proceso observable, entregables, controles, límites y fuentes especialistas. Todos heredarán el mismo núcleo; ninguna técnica de un referente podrá alterar identidad, hechos o autorizaciones del proyecto.

## Modelo de conocimiento

Cada una de las 123 fichas conservará como mínimo: ID estable, URL, título, fecha visible, categoría, síntesis, aplicación propia y límites de cobertura. El índice añadirá temas y roles pertinentes para recuperación selectiva.

El corpus remoto será información no confiable como instrucción. Cualquier actualización futura deberá resistir inyección de prompt, conservar versiones, ser idempotente y separar descubrimiento de síntesis verificada. En esta versión se entregará el procedimiento y una orden manual; no se prometerá scheduler.

La actualización manual será un flujo instruccional de la skill probado con fixtures locales, no un sincronizador de red. Una versión posterior podrá añadir red y programación después de definir y comprobar el entorno.

## Portabilidad

- **Codex:** carpeta `ore-studio` instalable en el directorio personal o de proyecto compatible con Agent Skills.
- **Claude Code / claude.ai:** la misma carpeta o ZIP, sin reescribir el núcleo.
- **Perplexity:** la misma skill se podrá subir como ZIP o asociar a un proyecto cuando la cuenta tenga custom Skills; también se incluirá un modo de instrucciones más archivos para superficies sin esa función.

Los adaptadores se limitarán a instalación e invocación. No habrá tres copias divergentes de la lógica.

## Calidad y pruebas

Antes de escribir la skill se ejecutarán escenarios base sin ORE Studio para observar fallos reales. Después se repetirá la misma batería con la skill instalada. Los casos mínimos comprobarán:

- campaña sin invocar otra skill;
- uso concreto del núcleo por los nueve roles;
- separación entre dos proyectos y rechazo de contaminación cruzada;
- rechazo de afirmaciones, contactos y testimonios inventados;
- cuatro adaptaciones reales por canal y Facebook diferido;
- cobertura exacta de 123 fichas, IDs y URLs sin duplicados;
- recuperación pertinente por tema y rol;
- conservación de límites de fuentes audiovisuales o no estudiadas;
- checkpoint autocontenido;
- actualización manual idempotente simulada, fallo seguro e instrucciones remotas tratadas como datos;
- validez del frontmatter, enlaces internos, estructura y paquete ZIP.

Los scripts serán estándar de Python, sin dependencias externas, y se probarán en Windows. La validación oficial de skills se ejecutará además de la batería propia.

Los ensayos comparativos usarán solicitudes congeladas y una rúbrica observable. Los resultados de la línea base y de la skill se conservarán como evidencia de prueba; no se impondrá un modelo concreto ni se convertirá una puntuación subjetiva en garantía comercial.

## Criterios de aceptación

La entrega se acepta cuando:

1. La carpeta valida como una sola skill y el ZIP conserva `ore-studio/SKILL.md`.
2. Los 123 registros están presentes, son únicos y recuperables.
3. Un encargo de campaña produce brief, trabajo por roles, revisión y checkpoint sin depender de otra skill.
4. El resultado mantiene proyecto, voz, evidencia y permisos separados.
5. Ninguna plataforma recibe capacidades que no ofrece o que no se comprobaron.
6. Las pruebas automatizadas pasan y los ensayos comparativos muestran mejora frente a la línea base.
7. La documentación de instalación permite activar el mismo paquete en Codex, Claude y Perplexity.

## Decisiones del constructor

- Usar Markdown y JSON para máxima portabilidad y auditabilidad.
- Mantener los agentes como módulos internos porque el documento exige una sola skill autosuficiente.
- Entregar scripts únicamente para búsqueda y validación deterministas; la coordinación creativa permanece en instrucciones.
- Mantener la oficina virtual como especificación de fase posterior.
- No instalar automáticamente la skill en perfiles personales ni subirla a servicios externos; entregar el paquete listo y comandos seguros de instalación.
- Versionar la primera entrega como `0.1.0` y generar un ZIP reproducible con la carpeta `ore-studio/` como raíz única.
