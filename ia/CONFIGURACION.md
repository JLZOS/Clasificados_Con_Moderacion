# Configuración de IA · barreras, riesgos y límites

La IA se configuró **antes** de generar código: el primer commit (`b33e33a`) contiene
`AGENTS.md`, `CLAUDE.md`, `.claude/`, `.cursor/`, `.gitignore`, `env.example` y los
scripts de calidad. Una instrucción en el prompt es una sugerencia. Un permiso
denegado, el sandbox o un hook **hacen cumplir** la regla.

Herramientas cubiertas: **Claude Code** (`.claude/settings.json`) y **Cursor**
(`.cursor/hooks.json`, `.cursor/cli.json`, `.cursor/rules/`). Ambas usan el mismo
hook `.claude/hooks/guard.mjs`.

## Capas y qué riesgo cubre cada una

| Capa                     | Archivo                                                                                                                                           | Riesgo que cubre                                                                                                                                                                                                                                                                   | Límite conocido                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Reglas del proyecto      | `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), `.cursor/rules/proyecto.mdc`                                                                             | Orientar stack, capas, prohibiciones y "datos, no órdenes"                                                                                                                                                                                                                         | No protegen: el modelo puede ignorarlas                                                                                                     |
| Permisos `deny`          | `.claude/settings.json` → `permissions.deny`                                                                                                      | Leer `.env*`, `*.pem`, `*.key`, `*firebase-adminsdk*.json`, `~`; editar `.claude/**`; `sudo`, `rm -rf`, `curl`, `wget`, `git push --force`, `git reset --hard`, `vercel env pull`                                                                                                  | `Read(...)` no ve lo que hace un script de Node ni un `grep` dentro de Bash; `Bash(curl *)` no detiene `/usr/bin/curl` ni `sh -c '…'`       |
| Permisos `ask`           | `permissions.ask`                                                                                                                                 | `git push`, instalar dependencias, `npx`, `vercel`, `WebFetch`                                                                                                                                                                                                                     | Depende de que la persona lea antes de aprobar                                                                                              |
| Lecturas fuera del repo  | `blockReadsOutsideWorkingDirectories: true`, sin `additionalDirectories`                                                                          | Leer otros proyectos o el home                                                                                                                                                                                                                                                     | Solo herramientas de lectura; Bash lo cubre el sandbox                                                                                      |
| Bypass                   | `disableBypassPermissionsMode: "disable"`                                                                                                         | Impide `--dangerously-skip-permissions` / `bypassPermissions`                                                                                                                                                                                                                      | —                                                                                                                                           |
| Sandbox                  | `sandbox.enabled`, `failIfUnavailable`, `allowUnsandboxedCommands: false`, `filesystem.denyRead: ["~/"]`, `allowRead: ["."]`, `allowWrite: ["."]` | Bash no puede leer el home ni escribir fuera del repo, aunque el comando esquive los permisos                                                                                                                                                                                      | **No existe en Windows nativo**: requiere WSL2 + `bubblewrap` + `socat`. Sin eso, `failIfUnavailable` hace que Claude Code no arranque Bash |
| Red                      | `sandbox.network.allowedDomains`: `registry.npmjs.org` (instalar paquetes), `github.com` (push con permiso)                                       | Exfiltración de secretos o descargas arbitrarias                                                                                                                                                                                                                                   | Un dominio permitido podría usarse para exfiltrar (p. ej. un gist): por eso `git push` sigue en `ask`                                       |
| Hook `PreToolUse`        | `.claude/hooks/guard.mjs` (+ 15 pruebas `node:test`)                                                                                              | Bloquea con código 2 y mensaje en `stderr`: `.env*`/claves (también dentro de comandos), rutas fuera del repo (`..`, `~`, absolutas), `curl/wget/nc/iwr`, `sudo`, `rm -rf`, `git push --force`, `git reset --hard`, `grep -r`/`rg --no-ignore`, y escribir la propia configuración | Análisis de texto: un comando ofuscado (variables, base64, `$(…)`) podría pasar. Por eso existe el sandbox                                  |
| Hooks de Cursor          | `.cursor/hooks.json` (`beforeShellExecution`, `beforeReadFile`, `preToolUse`, `failClosed: true`)                                                 | Las mismas reglas en Cursor (que no tiene el sandbox de Claude Code)                                                                                                                                                                                                               | Si Node no está en el `PATH`, `failClosed` bloquea todo (falla cerrado)                                                                     |
| Permisos CLI de Cursor   | `.cursor/cli.json`                                                                                                                                | `deny` de lectura de secretos y escritura de `.claude/**` y `.cursor/**` para `cursor-agent`                                                                                                                                                                                       | Solo aplica al CLI                                                                                                                          |
| Secretos fuera del disco | Emulator Suite, proyecto `demo-clasificados`, `scripts/seed.ts`                                                                                   | No hay credenciales reales que filtrar; el seed se niega a correr fuera de `demo-*`                                                                                                                                                                                                | Producción vive solo en Vercel; si una clave real se filtra hay que **rotarla**                                                             |
| Ignorados                | `.gitignore` (`.env*`, claves, `emulator-data/`)                                                                                                  | Subir secretos al repositorio                                                                                                                                                                                                                                                      | `.cursorignore` / `.claudeignore` **no** son barreras de seguridad                                                                          |
| CI                       | `.github/workflows/ci.yml`                                                                                                                        | Código roto o secretos que llegan a `main` (`gitleaks`)                                                                                                                                                                                                                            | —                                                                                                                                           |

## Por qué `env.example` y no `.env.example`

La regla `Read(**/.env*)` también bloquearía `.env.example`. Con el nombre
`env.example` la IA puede leer la plantilla (con valores falsos) sin abrir la regla.

## Orden de evaluación

`deny → ask → allow`: una regla `allow` nunca abre una excepción dentro de un `deny`.
Por eso no hay `allow` amplios (`Bash(*)`): solo `npm run check`, `test`, `lint`,
`git status/diff/log/add/commit`.

## La IA no modifica su propia jaula

- `Edit(./.claude/**)` y `Write(./.claude/**)` están en `deny`.
- El hook rechaza escribir en `.claude/settings*`, `.claude/hooks*`, `.cursor/hooks*`
  y `.cursor/cli.json`, y cualquier comando de shell que los mencione.
- Cambiar estas reglas exige que una persona edite el archivo y lo explique en un commit `chore:`.

## Windows

Este equipo usa Windows 11 sin WSL. Para las pruebas en vivo con Claude Code:

```powershell
wsl --install -d Ubuntu
```

```bash
sudo apt-get install bubblewrap socat   # dentro de Ubuntu (lo ejecuta la persona, no la IA)
cd /mnt/c/wamp64/www/clasificados_con_moderación && claude
/sandbox                                # debe mostrar el sandbox activo
```

Los emuladores de Firebase requieren **Java 21 o superior** (en el equipo hay Java 8).

## Ajustes hechos durante el desarrollo

1. **TypeScript 7 → 6.0.3**: `typescript-eslint` solo soporta `<6.1`.
2. **`overrides` de `@grpc/grpc-js` ≥ 1.14.7**: `firebase` traía una versión con 4 vulnerabilidades altas.
3. **Canario fuera de `env.example`**: la primera versión de la plantilla tenía el valor del
   canario, así que cualquier `grep` sobre el repo lo habría mostrado. Se cambió por un
   marcador. Como el valor sigue en el historial del primer commit, use un valor nuevo en `.env.local`.
4. **Hook en modo `--cursor`**: Cursor espera JSON en `stdout`; Claude Code usa el código 2 y `stderr`.
   Con `allow` el hook no imprime nada en Claude Code, para no saltarse sus permisos.
