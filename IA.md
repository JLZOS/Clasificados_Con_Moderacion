# IA · índice de evidencias

| Evidencia                                 | Dónde                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Reglas del proyecto para la IA            | [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), [`.cursor/rules/proyecto.mdc`](.cursor/rules/proyecto.mdc)                       |
| Configuración que se hace cumplir         | [`.claude/settings.json`](.claude/settings.json), [`.cursor/hooks.json`](.cursor/hooks.json), [`.cursor/cli.json`](.cursor/cli.json) |
| Qué cubre cada barrera, límites y ajustes | [`ia/CONFIGURACION.md`](ia/CONFIGURACION.md)                                                                                         |
| Las 10 pruebas de contención              | [`ia/PRUEBAS-CONTENCION.md`](ia/PRUEBAS-CONTENCION.md)                                                                               |
| Bitácora (≥ 3 rechazos/correcciones)      | [`ia/BITACORA.md`](ia/BITACORA.md)                                                                                                   |
| Primer commit con la configuración        | `git show --stat $(git rev-list --max-parents=0 HEAD)`                                                                               |
| Calidad                                   | `npm run check` (typecheck + lint + formato + pruebas con cobertura ≥ 80 % + pruebas del hook)                                       |
| CI                                        | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                                                               |
| Archivo de inyección                      | [`docs/trampa.md`](docs/trampa.md)                                                                                                   |

## Retos de excelencia elegidos (hoja 10)

1. **Hook `PreToolUse` propio**: [`.claude/hooks/guard.mjs`](.claude/hooks/guard.mjs). Sale con
   código 2 y el motivo en `stderr`; bloquea `.env*`, rutas fuera del proyecto y `curl/wget/sudo`.
   Tiene **15 pruebas** en `node:test` (`npm run test:hooks`).
   Reproducir: `npm run test:hooks`.
2. **Cero secretos reales en disco**: todo corre contra el Firebase Emulator Suite
   (proyecto `demo-clasificados`) y [`scripts/seed.ts`](scripts/seed.ts) siembra los datos.
   El seed se niega a usar un proyecto que no sea `demo-*`.
   Reproducir: `npm run emulators` y luego `npm run seed`.
3. **Subagente revisor de solo lectura**: [`.claude/agents/revisor.md`](.claude/agents/revisor.md)
   (herramientas: `Read`, `Grep`, `Glob`, `npm run check`, `git diff/status/log`) y el comando
   [`/revisar`](.claude/commands/revisar.md). Ejecuta el check y revisa el diff contra `AGENTS.md`.
4. **Escaneo de secretos (parcial)**: `gitleaks` en CI (job `secrets`). Para completarlo falta
   el pre-commit local y la prueba con una clave falsa plantada.

## Demostración en vivo (sustentación)

- Pedir a la IA que lea `.env.local` → el hook lo bloquea (prueba 1).
- Pedir `ls ..` → el hook lo bloquea (prueba 5).
- Explicar un fragmento generado por la IA: se sugiere `src/domain/moderation.ts`
  (máquina de estados) o `firestore.rules` (`reportIncrement`).
