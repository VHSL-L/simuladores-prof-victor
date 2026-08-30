import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

function simulatorModel() {
  const html = readFileSync("public/simulators/rcp/index.html", "utf8");
  const casesStart = html.indexOf("const cases=[");
  const casesEnd = html.indexOf(";\n      const rhythmNames", casesStart) + 1;
  const optionStart = html.indexOf("function option(", casesEnd);
  const rhythmStart = html.indexOf("function rhythmStep(", optionStart);
  const stepsStart = html.indexOf("function makeSteps(", rhythmStart);
  const modelEnd = html.indexOf("function initGrid(", stepsStart);

  assert.ok(casesStart >= 0 && casesEnd > casesStart, "casos não encontrados");
  assert.ok(optionStart >= 0 && rhythmStart > optionStart, "funções auxiliares não encontradas");
  assert.ok(stepsStart >= 0 && modelEnd > stepsStart, "gerador de etapas não encontrado");

  const source = [
    html.slice(casesStart, casesEnd),
    html.slice(optionStart, rhythmStart),
    html.slice(rhythmStart, stepsStart),
    html.slice(stepsStart, modelEnd),
    "globalThis.model = { cases, makeSteps };",
  ].join("\n");

  const context = {};
  vm.runInNewContext(source, context);
  return context.model;
}

test("não repete epinefrina no ciclo seguinte de 2 minutos", () => {
  const { cases, makeSteps } = simulatorModel();
  const scenario = cases.find((item) => item.sequence.join(",") === "FV,AESP,AESP,ORGANIZADO");
  assert.ok(scenario, "cenário de transição para AESP não encontrado");

  const medicationSteps = makeSteps(scenario).filter((step) =>
    step.label.includes("medicação") || step.label.includes("intervalo da epinefrina"),
  );
  const correctAnswers = medicationSteps.map((step) => ({
    cycle: step.cycle,
    text: step.options.find((answer) => answer.correct)?.text,
  }));

  assert.deepEqual(JSON.parse(JSON.stringify(correctAnswers)), [
    { cycle: 2, text: "Epinefrina 1 mg IV/IO" },
    {
      cycle: 3,
      text: "Não repetir epinefrina agora; manter RCP e controlar o intervalo para a próxima dose",
    },
  ]);
});

test("repete epinefrina somente quando cerca de 4 minutos se passaram", () => {
  const { cases, makeSteps } = simulatorModel();
  const scenario = cases.find((item) => item.sequence.join(",") === "FV,FV,FV,FV,AESP,ORGANIZADO");
  assert.ok(scenario, "cenário de FV refratária não encontrado");

  const cycleFour = makeSteps(scenario).find(
    (step) => step.cycle === 4 && step.label.includes("medicação"),
  );
  assert.equal(
    cycleFour.options.find((answer) => answer.correct)?.text,
    "Amiodarona 150 mg IV/IO e repetir epinefrina 1 mg",
  );
});
