import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const cache=new Map();
function load(relative){
 const file=path.resolve(relative); if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:name=>load(path.resolve(path.dirname(file),name+'.ts'))},{filename:file});
 return module.exports;
}
const root='src/simulators/fundamentos/';
const modules=['bls','gasometria','ecg','eletrolitos'].map(slug=>load(root+slug+'.ts')[slug]);
const {isCorrect,anionGap,correctedGap,winter,calculatedPh}=load(root+'types.ts');
const {beatTimes,waveValue,wavePath}=load(root+'ecg-wave.ts');
test('20 casos completos, respostas válidas e referências em todos os novos módulos',()=>{
 assert.equal(modules.reduce((n,m)=>n+m.cases.length,0),20);
 for(const m of modules){assert.ok(m.references.length>=2);assert.equal(new Set(m.cases.map(c=>c.id)).size,m.cases.length);
  for(const c of m.cases){assert.ok(c.questions.length>=2);assert.ok(c.context&&c.takeaway);assert.equal(new Set(c.questions.map(q=>q.id)).size,c.questions.length);
   for(const q of c.questions){assert.ok(q.explanation);assert.ok(Boolean(q.numeric)!==Boolean(q.options));
    if(q.numeric){assert.ok(Number.isFinite(q.numeric.value));assert.ok(isCorrect(q,String(q.numeric.value)));assert.equal(isCorrect(q,''),false);}
    else {assert.equal(q.options.filter(o=>o.id===q.answer).length,1);for(const o of q.options)assert.equal(isCorrect(q,o.id),o.id===q.answer);}
   }
  }
 }
});
test('gasometrias fictícias são internamente consistentes e os cálculos detectam o distúrbio misto',()=>{
 const cases=modules[1].cases;
 for(const c of cases)assert.ok(Math.abs(c.gas.ph-calculatedPh(c.gas.co2,c.gas.hco3))<0.015,c.id);
 assert.equal(anionGap(cases.find(c=>c.id==='ketosis').gas),24);
 assert.equal(anionGap(cases.find(c=>c.id==='diarrhea').gas),12);
 assert.equal(correctedGap(cases.find(c=>c.id==='albumin').gas),17);
 const mixed=cases.find(c=>c.id==='mixed');const expected=winter(mixed.gas.hco3);
 assert.equal(mixed.gas.ph,7.4);assert.equal(expected.low,24);assert.equal(expected.high,28);assert.ok(mixed.gas.co2<expected.low);
 assert.equal(isCorrect({numeric:{value:30.5,tolerance:0.1}},'30,5'),true);
 for(const invalid of ['',' ','30abc','30,5.0','Infinity','NaN','3e1'])assert.equal(isCorrect({numeric:{value:30,tolerance:0.1}},invalid),false);
});
test('BLS preserva distinção entre pulso presente, perda de pulso e comando do DEA',()=>{
 const cases=modules[0].cases;
 const expected=q=>q.options.find(o=>o.id===q.answer).text;
 assert.match(expected(cases[0].questions.find(q=>q.id==='recognize')),/10 segundos/);
 assert.match(expected(cases[0].questions.find(q=>q.id==='compress')),/100–120/);
 assert.match(expected(cases[0].questions.find(q=>q.id==='ventilate')),/30 compressões/);
 assert.match(expected(cases[1].questions.find(q=>q.id==='resume')),/Retomar RCP/);
 assert.match(expected(cases[1].questions.find(q=>q.id==='no-shock')),/Retomar RCP/);
 assert.match(expected(cases[2].questions.find(q=>q.id==='rescue')),/6 segundos/);
 assert.match(expected(cases[2].questions.find(q=>q.id==='loss')),/Iniciar RCP/);
});
test('ECG oferece traçados finitos e ritmos regulares ou irregulares coerentes',()=>{
 for(const c of modules[2].cases){const trace=c.trace;const beats=beatTimes(trace);const p=wavePath(trace);assert.ok(!/NaN|Infinity/.test(p));assert.ok(p.startsWith('M'));
  for(let t=0;t<6;t+=0.003){const y=waveValue(trace,t,beats);assert.ok(Number.isFinite(y));assert.ok(Math.abs(y)<2.1);}
  const intervals=beats.slice(1).map((t,i)=>t-beats[i]);
  if(trace.kind==='af')assert.ok(Math.max(...intervals)-Math.min(...intervals)>0.15);
  else if(trace.kind!=='vf')assert.ok(intervals.every(v=>Math.abs(v-60/trace.rate)<1e-9));
  else assert.equal(beats.length,0);
 }
 const wide=modules[2].cases.find(c=>c.id==='wide');const vf=modules[2].cases.find(c=>c.id==='vf');
 assert.match(wide.questions.find(q=>q.id==='wide-plan').options.find(o=>o.id===wide.questions.find(q=>q.id==='wide-plan').answer).text,/sincronizada/);
 assert.match(vf.questions.find(q=>q.id==='vf-plan').options.find(o=>o.id===vf.questions.find(q=>q.id==='vf-plan').answer).text,/não sincronizada/);
});
