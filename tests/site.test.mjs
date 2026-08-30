import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const requiredFiles = [
  "dist/index.html",
  "dist/_redirects",
  "dist/_headers",
  "dist/favicon.svg",
  "dist/simulators/rcp/index.html",
  "dist/simulators/choque/index.html",
  "dist/simulators/ventilacao-mecanica/index.html",
  "dist/simulators/ventilacao-mecanica/fonts/geist-mono-latin.woff2",
];

test("build contém os arquivos essenciais", () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(file), true, `${file} não foi gerado`);
  }
});

test("SPA fallback nativo não é bloqueado nem cria loop de redirecionamento", () => {
  assert.equal(existsSync("dist/404.html"), false);
  assert.ok(existsSync("dist/index.html"));
  const rules = readFileSync("dist/_redirects", "utf8").split("\n").filter(line => line.trim() && !line.trim().startsWith("#"));
  assert.equal(rules.length, 0);
});

test("simulador de RCP preserva o Megacode e o feedback final", () => {
  const simulator = readFileSync("dist/simulators/rcp/index.html", "utf8");
  assert.match(simulator, /Megacode do Prof\. Victor/);
  assert.match(simulator, /Parabéns!/);
  assert.match(simulator, /Amiodarona 300 mg/);
  assert.match(simulator, /Amiodarona 150 mg/);
  assert.match(simulator, /Não repetir epinefrina agora/);
  assert.match(simulator, /intervalo de 3–5 minutos/);
});
