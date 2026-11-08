export type Option = { id: string; text: string };
export type Question = {
  id: string; title: string; prompt?: string; explanation: string;
  options?: Option[]; answer?: string;
  numeric?: { value: number; tolerance: number; unit: string; hint: string };
};
export type Trace = { kind: 'narrow' | 'af' | 'wide' | 'brady' | 'vf'; rate: number; description: string };
export type Gas = { ph: number; co2: number; hco3: number; na: number; cl: number; albumin: number };
export type Case = {
  id: string; title: string; focus: string; context: string;
  observations: { label: string; value: string }[];
  questions: Question[]; takeaway: string; trace?: Trace; gas?: Gas;
};
export type LearningModule = {
  slug: string; title: string; subtitle: string; scope: string; objectives: string[];
  cases: Case[]; references: { title: string; url: string }[];
};
export function choice(id: string, title: string, texts: string[], correct: number, explanation: string, prompt?: string): Question {
  return { id, title, prompt, options: texts.map((text, i) => ({ id: `${id}-${i}`, text })), answer: `${id}-${correct}`, explanation };
}
export function isCorrect(question: Question, value: string) {
  if (!question.numeric) return value === question.answer;
  if (!/^\s*-?\d+(?:[.,]\d+)?\s*$/.test(value)) return false;
  return Math.abs(Number(value.trim().replace(',', '.')) - question.numeric.value) <= question.numeric.tolerance + 1e-9;
}
export function anionGap(gas: Gas) { return gas.na - gas.cl - gas.hco3; }
export function correctedGap(gas: Gas) { return anionGap(gas) + 2.5 * (4 - gas.albumin); }
export function winter(hco3: number) { return { center: 1.5 * hco3 + 8, low: 1.5 * hco3 + 6, high: 1.5 * hco3 + 10 }; }
export function calculatedPh(co2: number, hco3: number) { return 6.1 + Math.log10(hco3 / (0.03 * co2)); }
