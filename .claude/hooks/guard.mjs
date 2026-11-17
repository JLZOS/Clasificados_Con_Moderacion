#!/usr/bin/env node
// Hook PreToolUse: bloquea secretos, rutas fuera del proyecto y comandos peligrosos.
// Claude Code: sale con código 2 y el motivo en stderr.
// Cursor (--cursor): además escribe {"permission":"deny"} en stdout.
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SECRET_PATH =
  /(^|[\\/])(\.env(\.[\w.-]*)?|[^\\/]*\.(pem|key)|[^\\/]*firebase-adminsdk[^\\/]*\.json|id_(rsa|ed25519)[^\\/]*)$/i;
const SECRET_TEXT =
  /(^|[^\w])\.env(\.[\w-]+)*(?![\w-])|\.pem\b|\.key\b|firebase-adminsdk|id_rsa|id_ed25519/i;
const PROTECTED_CONFIG = /\.claude[\\/](settings|hooks)|\.cursor[\\/](hooks|cli\.json)/i;
const WRITE_TOOL = /edit|write|replace|delete/i;
const SEP = "(^|[\\s;&|(`'\"/\\\\])";
const END = "(\\.exe)?(?=$|[\\s;&|)'\"`])";

const word = (name) => new RegExp(`${SEP}${name}${END}`, "i");

const BLOCKED_COMMANDS = [
  { re: word("sudo"), why: "sudo está prohibido" },
  { re: word("(curl|wget|nc|ncat)"), why: "curl/wget/nc están prohibidos (red sin control)" },
  { re: /\b(Invoke-WebRequest|Invoke-RestMethod|iwr|irm)\b/i, why: "descargas por PowerShell" },
  { re: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r)/i, why: "rm -rf está prohibido" },
  { re: /Remove-Item[^;&|]*-Recurse/i, why: "borrado recursivo prohibido" },
  { re: /\bgit\s+push\b[^;&|]*\s(--force(-with-lease)?|-f\b|\+\S)/i, why: "git push --force" },
  { re: /\bgit\s+reset\b[^;&|]*--hard/i, why: "git reset --hard está prohibido" },
  { re: /\bgit\s+clean\b[^;&|]*\s-[a-z]*f/i, why: "git clean -f está prohibido" },
  { re: /\bvercel\s+env\s+pull\b/i, why: "vercel env pull baja secretos de producción" },
  { re: /\b[ef]?grep\b[^;&|]*\s(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b/, why: "grep recursivo" },
  { re: /\brg\b[^;&|]*\s(-u+|--no-ignore\S*|--hidden)\b/, why: "rg sin respetar .gitignore" },
  { re: /\bfindstr\b[^;&|]*\/s\b/i, why: "findstr /s recursivo" },
  { re: /-Recurse[^;]*\|\s*Select-String/i, why: "búsqueda recursiva de contenido" },
];

const OUTSIDE_TOKEN = /^(~|\$HOME|\$env:USERPROFILE|%USERPROFILE%|%HOMEPATH%|\.\.|\/|[a-z]:[\\/])/i;
const SAFE_TOKENS = new Set(["/dev/null", "nul"]);

function deny(reason) {
  return { allowed: false, reason };
}

const ALLOW = Object.freeze({ allowed: true, reason: "" });

function expandHome(token) {
  const home = os.homedir();
  return token
    .replace(/^~(?=$|[\\/])/, home)
    .replace(/^(\$HOME|\$env:USERPROFILE|%USERPROFILE%|%HOMEPATH%)/i, home);
}

function normalize(p) {
  const resolved = path.resolve(p);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

export function isInside(target, ctx) {
  const root = normalize(ctx.root);
  const full = normalize(path.resolve(ctx.cwd, expandHome(target)));
  return full === root || full.startsWith(root + path.sep);
}

function tokenize(command) {
  return command
    .split(/[\s;&|()<>]+/)
    .map((t) => t.replace(/^["'`]+|["'`,]+$/g, ""))
    .filter(Boolean);
}

function findOutsidePath(command, ctx) {
  return tokenize(command).find(
    (t) => OUTSIDE_TOKEN.test(t) && !SAFE_TOKENS.has(t.toLowerCase()) && !isInside(t, ctx),
  );
}

export function checkCommand(command, ctx) {
  if (SECRET_TEXT.test(command))
    return deny("el comando menciona archivos de secretos (.env*, claves)");
  if (PROTECTED_CONFIG.test(command)) return deny("no se permite tocar la configuración de la IA");
  const blocked = BLOCKED_COMMANDS.find((rule) => rule.re.test(command));
  if (blocked) return deny(blocked.why);
  const outside = findOutsidePath(command, ctx);
  if (outside) return deny(`ruta fuera del proyecto: ${outside}`);
  return ALLOW;
}

function collectPaths(toolInput, input) {
  return [toolInput.file_path, toolInput.path, toolInput.notebook_path, input.file_path].filter(
    (p) => typeof p === "string" && p.length > 0,
  );
}

function checkPath(p, toolName, ctx) {
  if (SECRET_PATH.test(p)) return deny(`archivo de secretos: ${path.basename(p)}`);
  if (!isInside(p, ctx)) return deny(`ruta fuera del proyecto: ${p}`);
  if (WRITE_TOOL.test(toolName) && PROTECTED_CONFIG.test(p)) {
    return deny("la IA no puede modificar su propia configuración");
  }
  return ALLOW;
}

export function checkTool(toolName, toolInput, input, ctx) {
  const fileGlobs = [toolName === "Grep" ? undefined : toolInput.pattern, toolInput.glob];
  if (fileGlobs.some((p) => typeof p === "string" && SECRET_TEXT.test(p))) {
    return deny("patrón dirigido a archivos de secretos");
  }
  for (const p of collectPaths(toolInput, input)) {
    const result = checkPath(p, toolName, ctx);
    if (!result.allowed) return result;
  }
  return ALLOW;
}

export function evaluate(input, projectDir) {
  const root = path.resolve(projectDir);
  const ctx = { root, cwd: path.resolve(input.cwd ?? root) };
  const toolInput = input.tool_input ?? {};
  const command = toolInput.command ?? input.command;
  if (typeof command === "string") return checkCommand(command, ctx);
  return checkTool(input.tool_name ?? "", toolInput, input, ctx);
}

function readInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return null;
  }
}

function main() {
  const cursor = process.argv.includes("--cursor");
  const input = readInput();
  const projectDir =
    process.env.CLAUDE_PROJECT_DIR || process.env.CURSOR_PROJECT_DIR || process.cwd();
  const result = input ? evaluate(input, projectDir) : deny("entrada JSON inválida");
  if (result.allowed) {
    if (cursor) process.stdout.write("{}");
    process.exit(0);
  }
  const message = `Bloqueado por guard.mjs: ${result.reason}`;
  process.stderr.write(`${message}\n`);
  if (cursor) {
    process.stdout.write(
      JSON.stringify({ permission: "deny", user_message: message, agent_message: message }),
    );
  }
  process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
