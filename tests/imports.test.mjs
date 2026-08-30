import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFileSync(path, "utf8");
const hash = (text) => createHash("sha256").update(text).digest("hex");
const ventilation = read("src/simulators/ventilacao-mecanica/Simulator.tsx");

test("Choque e estilos mantêm os arquivos originais byte a byte", () => {
  const originals = {
    "src/simulators/choque/Simulator.tsx": "d4e49b86e6f201f823ca660cbc8cd9c266ccd6130f2bcd4ea328c770f2a762d4",
    "src/simulators/choque/globals.css": "158785fec6445ce49e619f63cd4afa19ae7e400d7392a419d6b250b33f0be214",
    "src/simulators/choque/crt.css": "7c0054d7f392c462dd33808c5db4d5b58a537a10b52cb235bf3a9b457cc03147",
    "src/simulators/ventilacao-mecanica/globals.css": "8595c66aef06e0a13e76609e753d13725512374b6616050b42e64f6f82926552",
    "public/simulators/rcp/index.html": "28cf69c4d7a72de0c4198d1cb514b6dccdd5ffe7ff66759922ceee46b30cc401",
  };
  for (const [path, expected] of Object.entries(originals)) assert.equal(hash(read(path)), expected, path);
});

test("núcleo integral do VentilaLab preservado, sem aula nem API de sessão", () => {
  const core = ventilation.split("\n\nexport default function PracticeSimulator")[0].trimEnd();
  assert.equal(hash(core), "e31da2a0d16a6de30b6f2ec2d5d6024ccc7e0517a7e92aab588ee5efb0bae8ac");
  assert.doesNotMatch(ventilation, /fetch\(|\/api\/session|slides\/slide-|QRCodeSVG|jspdf/);
});

test("todas as mecânicas VCV/PCV produzem métricas e curvas finitas", () => {
  const helpers = ventilation.slice(ventilation.indexOf("type WaveKind"), ventilation.indexOf("function drawWaveform"));
  const code = ts.transpileModule(helpers, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const model = vm.runInNewContext(`${code}; ({ SCENARIOS, deriveVcvMetrics, derivePcvMetrics, waveformAt })`);
  assert.equal(model.SCENARIOS.length, 4);
  for (const scenario of model.SCENARIOS) {
    for (const mode of ["VCV", "PCV"]) {
      const metrics = mode === "VCV" ? model.deriveVcvMetrics(scenario.vcv, scenario.mechanics) : model.derivePcvMetrics(scenario.pcv, scenario.mechanics);
      assert.equal(metrics.mode, mode);
      for (const value of Object.values(metrics)) if (typeof value === "number") assert.ok(Number.isFinite(value));
      for (const kind of ["pressure", "flow", "volume"]) {
        for (let i = 0; i < 100; i++) assert.ok(Number.isFinite(model.waveformAt(kind, metrics.cycle * i / 100, metrics)));
      }
    }
  }
});

test("HTML de cada simulador aponta apenas para assets presentes no build", () => {
  for (const name of ["choque", "ventilacao-mecanica"]) {
    const html = read(`dist/simulators/${name}/index.html`);
    assert.match(html, /<html lang="pt-BR">/);
    assert.doesNotMatch(html, /chatgpt\.site|_next\/|\/src\//);
    for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) assert.ok(existsSync(`dist${path}`), path);
  }
});
