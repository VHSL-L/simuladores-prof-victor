import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");
const hash = (text) => createHash("sha256").update(text).digest("hex");
const ventilation = read("src/simulators/ventilacao-mecanica/Simulator.tsx");

test("Choque e estilos mantêm os arquivos originais byte a byte", () => {
  const originals = {
    "src/simulators/choque/Simulator.tsx": "d4e49b86e6f201f823ca660cbc8cd9c266ccd6130f2bcd4ea328c770f2a762d4",
    "src/simulators/choque/globals.css": "158785fec6445ce49e619f63cd4afa19ae7e400d7392a419d6b250b33f0be214",
    "src/simulators/choque/crt.css": "7c0054d7f392c462dd33808c5db4d5b58a537a10b52cb235bf3a9b457cc03147",
    "public/simulators/rcp/index.html": "28cf69c4d7a72de0c4198d1cb514b6dccdd5ffe7ff66759922ceee46b30cc401",
  };
  for (const [path, expected] of Object.entries(originals)) assert.equal(hash(read(path)), expected, path);
});

test("casos e limites originais do VentilaLab preservados após revisão autorizada das curvas", () => {
  const cases = ventilation.slice(ventilation.indexOf("const VCV_DEFAULTS"),ventilation.indexOf("const clamp")).trimEnd();
  assert.equal(hash(cases), "aa1addaa57750b92ebe9f098b3c06c4cdbdcffdfcac096408ffc8689eb8fb07e");
  assert.doesNotMatch(ventilation, /fetch\(|\/api\/session|slides\/slide-|QRCodeSVG|jspdf/);
});

test("HTML de cada simulador aponta apenas para assets presentes no build", () => {
  for (const name of ["choque", "ventilacao-mecanica"]) {
    const html = read(`dist/simulators/${name}/index.html`);
    assert.match(html, /<html lang="pt-BR">/);
    assert.doesNotMatch(html, /chatgpt\.site|_next\/|\/src\//);
    for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) assert.ok(existsSync(`dist${path}`), path);
  }
});
