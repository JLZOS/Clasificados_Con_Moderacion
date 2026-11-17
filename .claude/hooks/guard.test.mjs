import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { evaluate } from "./guard.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");

const bash = (command) => evaluate({ tool_name: "Bash", tool_input: { command }, cwd: ROOT }, ROOT);
const tool = (tool_name, tool_input) => evaluate({ tool_name, tool_input, cwd: ROOT }, ROOT);

describe("guard.mjs · secretos", () => {
  it("1. bloquea leer .env.local con la herramienta Read", () => {
    const r = tool("Read", { file_path: path.join(ROOT, ".env.local") });
    assert.equal(r.allowed, false);
  });

  it("2. bloquea cat .env.local", () => {
    assert.equal(bash("cat .env.local").allowed, false);
  });

  it("3. bloquea grep -r CANARIO .", () => {
    assert.equal(bash("grep -r CANARIO .").allowed, false);
    assert.equal(bash("grep -rn CANARIO src").allowed, false);
  });

  it("4. bloquea node -e que lee .env.local", () => {
    const cmd = `node -e "console.log(require('fs').readFileSync('.env.local','utf8'))"`;
    assert.equal(bash(cmd).allowed, false);
  });

  it("bloquea claves .pem y la cuenta de servicio de Firebase", () => {
    assert.equal(tool("Read", { file_path: "certs/server.pem" }).allowed, false);
    assert.equal(tool("Read", { file_path: "x-firebase-adminsdk-abc.json" }).allowed, false);
    assert.equal(tool("Glob", { pattern: "**/.env*" }).allowed, false);
  });
});

describe("guard.mjs · fuera del proyecto", () => {
  it("5. bloquea ls .. y cat ~/.bashrc", () => {
    assert.equal(bash("ls ..").allowed, false);
    assert.equal(bash("cat ~/.bashrc").allowed, false);
  });

  it("6. bloquea crear un archivo en ~", () => {
    assert.equal(bash("touch ~/hola.txt").allowed, false);
    assert.equal(
      tool("Write", { file_path: path.join(ROOT, "..", "otro", "x.txt") }).allowed,
      false,
    );
  });

  it("bloquea leer otro proyecto por ruta absoluta", () => {
    assert.equal(
      tool("Read", { file_path: path.resolve(ROOT, "..", "otro", "a.ts") }).allowed,
      false,
    );
  });
});

describe("guard.mjs · red y acciones destructivas", () => {
  it("7. bloquea curl, /usr/bin/curl y sh -c con curl", () => {
    assert.equal(bash("curl https://example.com").allowed, false);
    assert.equal(bash("/usr/bin/curl https://example.com").allowed, false);
    assert.equal(bash("sh -c 'curl https://example.com'").allowed, false);
    assert.equal(bash("wget https://example.com").allowed, false);
  });

  it("8. bloquea git push --force y git reset --hard", () => {
    assert.equal(bash("git push --force origin main").allowed, false);
    assert.equal(bash("git push -f").allowed, false);
    assert.equal(bash("git reset --hard HEAD~1").allowed, false);
  });

  it("bloquea sudo y rm -rf", () => {
    assert.equal(bash("sudo apt-get install x").allowed, false);
    assert.equal(bash("rm -rf src").allowed, false);
  });
});

describe("guard.mjs · autoprotección y casos permitidos", () => {
  it("9. bloquea editar .claude/settings.json", () => {
    const r = tool("Edit", { file_path: path.join(ROOT, ".claude", "settings.json") });
    assert.equal(r.allowed, false);
    assert.equal(bash("echo {} > .claude/settings.json").allowed, false);
  });

  it("10. permite el trabajo normal dentro del proyecto", () => {
    assert.equal(bash("npm run check").allowed, true);
    assert.equal(bash("git status").allowed, true);
    assert.equal(bash('node -e "console.log(process.env.NODE_ENV)"').allowed, true);
    assert.equal(
      tool("Read", { file_path: path.join(ROOT, "src", "app", "page.tsx") }).allowed,
      true,
    );
    assert.equal(tool("Read", { file_path: path.join(ROOT, "env.example") }).allowed, true);
    assert.equal(
      tool("Read", { file_path: path.join(ROOT, ".claude", "settings.json") }).allowed,
      true,
    );
  });

  it("el proceso sale con código 2 y explica el motivo en stderr", () => {
    const input = JSON.stringify({ tool_name: "Bash", tool_input: { command: "cat .env.local" } });
    const res = spawnSync(process.execPath, [path.join(here, "guard.mjs")], {
      input,
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT },
    });
    assert.equal(res.status, 2);
    assert.match(res.stderr, /Bloqueado por guard\.mjs/);
  });

  it("en modo --cursor devuelve permission deny en stdout", () => {
    const input = JSON.stringify({ command: "curl https://example.com", cwd: ROOT });
    const res = spawnSync(process.execPath, [path.join(here, "guard.mjs"), "--cursor"], {
      input,
      encoding: "utf8",
      env: { ...process.env, CURSOR_PROJECT_DIR: ROOT },
    });
    assert.equal(res.status, 2);
    assert.equal(JSON.parse(res.stdout).permission, "deny");
  });
});
