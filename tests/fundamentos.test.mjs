import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const cache=new Map();
const requirePackage=createRequire(import.meta.url);
function load(relative){
 const file=path.resolve(relative); if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:name=>{
  if(!name.startsWith('.'))return requirePackage(name);
  const local=path.resolve(path.dirname(file),name);
  if(name.endsWith('.jpg')){assert.ok(existsSync(local));return {default:local,__esModule:true};}
  return load(local+(existsSync(local+'.ts')?'.ts':'.tsx'));
 }},{filename:file});
 return module.exports;
}
const root='src/simulators/fundamentos/';
const modules=['bls','gasometria','ecg','eletrolitos'].map(slug=>load(root+slug+'.ts')[slug]);
const airway=load(root+'via-aerea.ts').viaAerea;
modules.push(airway);
const {isCorrect,anionGap,correctedGap,winter,calculatedPh,caseStateAt}=load(root+'types.ts');
const {beatTimes,waveValue,wavePath}=load(root+'ecg-wave.ts');
const {AnswerFeedback}=load(root+'answer-feedback.tsx');
test('31 casos completos, respostas válidas e referências em todos os novos módulos',()=>{
 assert.equal(modules.reduce((n,m)=>n+m.cases.length,0),31);
 for(const m of modules){assert.ok(m.references.length>=2);assert.equal(new Set(m.cases.map(c=>c.id)).size,m.cases.length);
  for(const c of m.cases){assert.ok(c.questions.length>=2);assert.ok(c.context&&c.takeaway);assert.equal(new Set(c.questions.map(q=>q.id)).size,c.questions.length);
   for(const q of c.questions){assert.ok(q.explanation);assert.ok(Boolean(q.numeric)!==Boolean(q.options));
    if(q.numeric){assert.ok(Number.isFinite(q.numeric.value));assert.ok(isCorrect(q,String(q.numeric.value)));assert.equal(isCorrect(q,''),false);}
    else {assert.equal(q.options.length,4,`${m.slug}/${c.id}/${q.id}: quatro alternativas`);assert.equal(new Set(q.options.map(o=>o.text)).size,4,`${c.id}/${q.id}: textos distintos`);assert.equal(q.options.filter(o=>o.id===q.answer).length,1);for(const o of q.options)assert.equal(isCorrect(q,o.id),o.id===q.answer);}
   }
  }
 }
});
test('cada uma das 252 alternativas incorretas tem comentário específico e o gabarito fica sem comentário de erro',()=>{
 let count=0;
 for(const m of modules)for(const c of m.cases)for(const q of c.questions){
  if(!q.options)continue;
  const wrong=q.options.filter(o=>o.id!==q.answer);
  assert.equal(q.options.find(o=>o.id===q.answer).whyIncorrect,null);
  assert.equal(new Set(wrong.map(o=>o.whyIncorrect)).size,3,`${c.id}/${q.id}: explicações distintas`);
  for(const o of wrong){
   assert.ok(o.whyIncorrect?.length>40,`${c.id}/${q.id}/${o.id}`);
   assert.notEqual(o.whyIncorrect,q.explanation);
   count++;
  }
 }
 assert.equal(count,252);
});
test('gabarito comentado só revela o comentário da opção confirmada e também funciona na revisão',()=>{
 const render=(q,answer)=>renderToStaticMarkup(React.createElement(AnswerFeedback,{question:q,answer}));
 const text=value=>renderToStaticMarkup(React.createElement(React.Fragment,null,value));
 for(const m of modules)for(const c of m.cases)for(const q of c.questions){
  assert.equal(render(q,undefined),'');
  if(!q.options)continue;
  for(const selected of q.options){
   const html=render(q,selected.id);
   assert.ok(html.includes(text(q.explanation)));
   assert.ok(html.includes(text(q.options.find(o=>o.id===q.answer).text)));
   if(selected.id===q.answer){assert.ok(!html.includes('Por que sua resposta não se aplica'));}
   else {
    assert.ok(html.includes('Por que sua resposta não se aplica'));
    assert.ok(html.includes(text(selected.whyIncorrect)));
   }
   for(const other of q.options.filter(o=>o.id!==selected.id&&o.whyIncorrect))assert.ok(!html.includes(`<p>${text(other.whyIncorrect)}</p>`),`${c.id}/${q.id}: comentário de outra opção não aparece`);
  }
 }
 const numeric=modules[1].cases[0].questions.find(q=>q.id==='gap');
 assert.match(render(numeric,'22'),/Seu resultado:.*22.*Resultado esperado:.*24/s);
 assert.ok(render(numeric,'22').includes(text(numeric.explanation)));
 assert.ok(!render(numeric,'24,0').includes('Seu resultado:'));
});
test('comentários da gasometria acompanham os dados e a direção do erro escolhido',()=>{
 const gas=modules[1].cases;
 const ketosis=gas.find(c=>c.id==='ketosis');
 const ph=ketosis.questions.find(q=>q.id==='ph');
 assert.match(ph.options[0].whyIncorrect,/PaCO₂ de 26.*elevação/);
 assert.match(ph.options[1].whyIncorrect,/HCO₃⁻ de 12.*queda/);
 const mixed=gas.find(c=>c.id==='mixed').questions.find(q=>q.id==='compensation');
 assert.match(mixed.options[0].whyIncorrect,/20.*abaixo.*24–28/);
 const albumin=gas.find(c=>c.id==='albumin').questions.find(q=>q.id==='compensation');
 assert.match(albumin.options[3].whyIncorrect,/AG corrigido de 17/);
 const pea=modules[2].cases.find(c=>c.id==='pea').questions.find(q=>q.id==='pea-change');
 assert.match(pea.options[0].whyIncorrect,/retorno da circulação/);
});
test('gasometrias fictícias são internamente consistentes e os cálculos detectam o distúrbio misto',()=>{
 const cases=modules[1].cases;
 for(const c of cases)for(const g of [c.gas,...c.questions.map(q=>q.update?.gas).filter(Boolean)])assert.ok(Math.abs(g.ph-calculatedPh(g.co2,g.hco3))<0.015,c.id);
 assert.equal(anionGap(cases.find(c=>c.id==='ketosis').gas),24);
 assert.equal(anionGap(cases.find(c=>c.id==='diarrhea').gas),12);
 assert.equal(correctedGap(cases.find(c=>c.id==='albumin').gas),17);
 const mixed=cases.find(c=>c.id==='mixed');const expected=winter(mixed.gas.hco3);
 assert.equal(mixed.gas.ph,7.4);assert.equal(expected.low,24);assert.equal(expected.high,28);assert.ok(mixed.gas.co2<expected.low);
 assert.equal(isCorrect({numeric:{value:30.5,tolerance:0.1}},'30,5'),true);
 assert.equal(isCorrect({numeric:{value:30.5,tolerance:0.1}},'30,6'),true);
 assert.equal(isCorrect({numeric:{value:30.5,tolerance:0.1}},'30,61'),false);
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
  else if(trace.kind!=='vf'&&trace.kind!=='asystole')assert.ok(intervals.every(v=>Math.abs(v-60/trace.rate)<1e-9));
  else assert.equal(beats.length,0);
 }
 const wide=modules[2].cases.find(c=>c.id==='wide');const vf=modules[2].cases.find(c=>c.id==='vf');
 assert.match(wide.questions.find(q=>q.id==='wide-plan').options.find(o=>o.id===wide.questions.find(q=>q.id==='wide-plan').answer).text,/sincronizada/);
 assert.match(vf.questions.find(q=>q.id==='vf-plan').options.find(o=>o.id===vf.questions.find(q=>q.id==='vf-plan').answer).text,/não sincronizada/);
});

test('reavaliação não antecipa dados futuros e restaura o momento correto ao voltar',()=>{
 const respiratory=modules[0].cases.find(c=>c.id==='respiratory');
 assert.match(caseStateAt(respiratory,1).observations.find(o=>o.label==='Pulso').value,/Presente/);
 assert.match(caseStateAt(respiratory,2).observations.find(o=>o.label==='Pulso').value,/Não identificado/);
 assert.equal(caseStateAt(respiratory,0).latest,undefined);
 const serial=modules[1].cases.find(c=>c.id==='serial-gas');
 assert.equal(caseStateAt(serial,2).gas.co2,50);
 assert.equal(caseStateAt(serial,3).gas.co2,32);
 assert.equal(caseStateAt(serial,4).gas.co2,32);
 assert.equal(caseStateAt(serial,0).gas.co2,50);
 assert.equal(serial.gas.co2,50);
 const pea=modules[2].cases.find(c=>c.id==='pea');
 assert.equal(caseStateAt(pea,1).trace.rate,60);
 assert.equal(caseStateAt(pea,2).trace.rate,68);
 assert.match(caseStateAt(pea,2).observations.find(o=>o.label==='Pulso').value,/Presente/);
 assert.match(caseStateAt(pea,1).observations.find(o=>o.label==='Pulso').value,/Não identificado/);
 const sodium=modules[3].cases.find(c=>c.id==='sodium-trend');
 assert.equal(caseStateAt(sodium,0).observations.find(o=>o.label==='Na⁺ atual'),undefined);
 assert.equal(caseStateAt(sodium,1).observations.find(o=>o.label==='Na⁺ atual').value,'125 mmol/L');
 assert.equal(sodium.questions.find(q=>q.id==='sodium-delta').numeric.value,125-112);
});
test('ritmos não chocáveis não são confundidos com indicação de desfibrilação',()=>{
 const expected=q=>q.options.find(o=>o.id===q.answer).text;
 for(const id of ['pea','asystole']){
  const c=modules[2].cases.find(c=>c.id===id);
  assert.match(expected(c.questions[1]),/não (?:é ritmo )?chocável/);
 }
 const trace=modules[2].cases.find(c=>c.id==='asystole').trace;
 assert.equal(beatTimes(trace).length,0);
 for(let t=0;t<6;t+=.05)assert.equal(waveValue(trace,t),0);
});

test('via aérea inclui seis casos ilustrados, confirmação por CO₂ e prioridades de resgate',()=>{
 assert.equal(airway.cases.length,6);
 assert.equal(airway.cases.reduce((n,c)=>n+c.questions.length,0),18);
 for(const c of airway.cases)assert.ok(c.figure);
 const expected=id=>{const q=airway.cases.flatMap(c=>c.questions).find(q=>q.id===id);return q.options.find(o=>o.id===q.answer).text;};
 assert.match(expected('tube-confirm'),/CO₂ expirado sustentado/);
 assert.match(expected('tube-depth'),/profundidade.*bilateral/);
 assert.match(expected('no-co2-action'),/remover o tubo.*oxigenação/);
 assert.match(expected('rescue-failure'),/acesso cervical.*equipe habilitada/);
 const absent=airway.cases.find(c=>c.id==='absent-co2');
 assert.equal(caseStateAt(absent,0).figure,'capno-absent');
 assert.equal(caseStateAt(absent,1).figure,'capno-absent');
 assert.equal(caseStateAt(absent,2).figure,'capno-normal');
 assert.equal(caseStateAt(absent,0).figure,'capno-absent');
 const transfer=airway.cases.find(c=>c.id==='transport');
 assert.equal(caseStateAt(transfer,0).figure,'capno-normal');
 assert.equal(caseStateAt(transfer,1).figure,'capno-lost');
 assert.equal(caseStateAt(transfer,2).figure,'capno-normal');
 assert.equal(transfer.figure,'capno-normal');
});
test('imagens e capnogramas têm descrição acessível e sinais coerentes com cada etapa',()=>{
 const {capnoValue,capnoPath,TeachingFigureView}=load(root+'teaching-figures.tsx');
 for(const kind of ['capno-normal','capno-absent','capno-lost']){
  assert.ok(!/NaN|Infinity/.test(capnoPath(kind)));
  for(let time=0;time<=15;time+=.02){
   const value=capnoValue(kind,time);
   assert.ok(value>=-1e-8&&value<=35.001);
   if(kind==='capno-absent'||kind==='capno-lost'&&time>=7.5)assert.equal(value,0);
  }
  assert.match(renderToStaticMarkup(React.createElement(TeachingFigureView,{kind})),/role="img" aria-label="Trecho de 15 segundos/);
 }
 assert.ok(capnoValue('capno-normal',4)>30);
 assert.ok(capnoValue('capno-lost',7)>0);
 assert.equal(capnoValue('capno-lost',8),0);
 const kit=renderToStaticMarkup(React.createElement(TeachingFigureView,{kind:'equipment'}));
 assert.equal((kit.match(/aria-label="Ampliar fotografia:/g)||[]).length,6);
 assert.equal((kit.match(/<dialog/g)||[]).length,6);
 assert.equal((kit.match(/alt="Fotografia de/g)||[]).length,6);
 assert.match(kit,/Créditos das fotografias/);
 assert.match(kit,/Bolsa e máscara/);assert.match(kit,/Sensor de capnografia/);
});
test('percurso começa pelo BLS, apresenta ECG antes do ACLS e termina em ventilação mecânica',()=>{
 const {learningPath}=load('src/data/learning-path.ts');
 const routes=Array.from(learningPath,m=>m.href);
 assert.equal(routes.length,8);assert.equal(new Set(routes).size,8);
 assert.equal(routes[0],'/bls');
 assert.ok(routes.indexOf('/ecg')<routes.indexOf('/rcp'));
 assert.ok(routes.indexOf('/bls')<routes.indexOf('/rcp'));
 assert.equal(routes.at(-2),'/via-aerea');
 assert.equal(routes.at(-1),'/ventilacao-mecanica');
});
