import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { bls } from './bls';
import { gasometria } from './gasometria';
import { ecg } from './ecg';
import { eletrolitos } from './eletrolitos';
import { isCorrect, caseStateAt, type Case, type LearningModule, type Question, type Trace } from './types';
import { wavePath } from './ecg-wave';
import './styles.css';
const modules: Record<string, LearningModule> = { bls, gasometria, ecg, eletrolitos };
const slug = window.location.pathname.split('/')[2];
const learning = modules[slug];
const format = (n:number) => n.toLocaleString('pt-BR',{maximumFractionDigits:2});
function answerText(q:Question,value:string) { return q.numeric ? `${value} ${q.numeric.unit}` : q.options?.find(o=>o.id===value)?.text ?? value; }
function expectedText(q:Question) { return q.numeric ? `${format(q.numeric.value)} ${q.numeric.unit}` : q.options?.find(o=>o.id===q.answer)?.text; }
function TraceView({trace}:{trace:Trace}) {
 const [describe,setDescribe]=useState(false);
 return <figure className="trace-panel"><figcaption>Monitor · traçado esquemático de 6 segundos</figcaption><div className="trace-scroll" tabIndex={0} aria-label="Traçado de ECG com rolagem horizontal"><svg viewBox="0 0 600 180" role="img" aria-label="Traçado esquemático; a descrição textual pode ser aberta abaixo.">
 <defs><pattern id="small-grid" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M 4 0 L 0 0 0 4" fill="none" stroke="#f0dadd" strokeWidth="0.4" /></pattern><pattern id="large-grid" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="url(#small-grid)"/><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d7acb3" strokeWidth="0.65"/></pattern></defs>
 <rect width="600" height="180" fill="#fffafa"/><rect width="600" height="180" fill="url(#large-grid)"/>
 <path d={wavePath(trace)} fill="none" stroke="#203d4e" strokeWidth="1.6" strokeLinejoin="round" />
 {[0,1,2,3,4,5,6].map(s=><g key={s}><path d={`M ${s*100} 0 v 9`} stroke="#6d273a"/><text x={s===6?595:s*100+4} y="174" textAnchor={s===6?'end':'start'} fontSize="10" fill="#713e49">{s}s</text></g>)}
 </svg></div><p className="small">A escala horizontal representa tempo; a amplitude é ilustrativa. No celular, deslize o traçado.</p><button className="text-button" aria-expanded={describe} onClick={()=>setDescribe(!describe)}>{describe?'Ocultar descrição':'Ler descrição do traçado'}</button>{describe&&<p className="trace-description">{trace.description}</p>}</figure>;
}
function Observations({item}:{item:Pick<Case,'gas'|'observations'>}) {
 const values=item.gas ? [
 {label:'pH',value:format(item.gas.ph)},{label:'PaCO₂',value:`${format(item.gas.co2)} mmHg`},{label:'HCO₃⁻',value:`${format(item.gas.hco3)} mEq/L`},{label:'Na⁺',value:`${format(item.gas.na)} mEq/L`},{label:'Cl⁻',value:`${format(item.gas.cl)} mEq/L`},{label:'Albumina',value:`${format(item.gas.albumin)} g/dL`},
 ] : item.observations;
 return <><dl className="observations">{values.map(v=><div key={v.label}><dt>{v.label}</dt><dd>{v.value}</dd></div>)}</dl>{item.gas&&<p className="small lab-reference">Referências didáticas: pH 7,35–7,45 · PaCO₂ 35–45 mmHg · HCO₃⁻ 22–26 mEq/L · AG sem K⁺ 8–12 mEq/L. Use o intervalo do laboratório na prática.</p>}</>;
}
type Attempt = { cursor:number; answers:string[]; draft:string };
const emptyAttempt = ():Attempt=>({cursor:0,answers:[],draft:''});
function LearningApp({module}:{module:LearningModule}) {
 const [caseId,setCaseId]=useState(module.cases[0].id);
 const [attempts,setAttempts]=useState<Record<string,Attempt>>({});
 const heading=useRef<HTMLHeadingElement>(null); const mounted=useRef(false);
 const updateHeading=useRef<HTMLHeadingElement>(null);
 const caseHeading=useRef<HTMLHeadingElement>(null);
 const previousCase=useRef(caseId);
 const item=module.cases.find(c=>c.id===caseId)!;
 const attempt=attempts[caseId]??emptyAttempt();
 const question=item.questions[attempt.cursor]; const complete=!question;
 const caseIndex=module.cases.indexOf(item);
 const current=caseStateAt(item,attempt.cursor);
 const checked=question&&attempt.answers[attempt.cursor]!==undefined;
 const value=checked?attempt.answers[attempt.cursor]:attempt.draft;
 const correct=checked&&isCorrect(question,value);
 const update=(fn:(previous:Attempt)=>Attempt)=>setAttempts(previous=>({...previous,[caseId]:fn(previous[caseId]??emptyAttempt())}));
 useEffect(()=>{document.title=`${module.title} | Prof. Victor`;},[module.title]);
 useEffect(()=>{
  if(mounted.current) {
   const target=previousCase.current!==caseId || attempt.cursor===0 ? caseHeading.current : question?.update ? updateHeading.current : heading.current;
   target?.focus();
  } else mounted.current=true;
  previousCase.current=caseId;
 },[caseId,attempt.cursor]);
 function check(event:FormEvent){event.preventDefault();if(!question||checked||!value.trim())return;update(a=>({...a,answers:[...a.answers.slice(0,a.cursor),a.draft]}));}
 function move(cursor:number){update(a=>({...a,cursor,draft:''}));}
 const toReview=item.questions.filter((q,i)=>attempt.answers[i]!==undefined&&!isCorrect(q,attempt.answers[i]));
 return <main className={`learning-shell theme-${module.slug}`}>
 <header className="learning-header"><div><p className="eyebrow">Simuladores do Prof. Victor · prática guiada</p><h1>{module.title}</h1><p className="subtitle">{module.subtitle}</p></div><span className="module-count">{module.cases.length} casos</span></header>
 <details className="scope"><summary>Objetivos e como usar</summary><p>{module.scope}</p><ul>{module.objectives.map(o=><li key={o}>{o}</li>)}</ul><p>Escolha um caso, responda e confira a explicação antes de avançar. Os dados podem mudar em etapas de reavaliação. O roteiro segue a abordagem apresentada na explicação, inclusive após uma resposta incorreta; as mudanças são situações didáticas, não previsões da resposta ao tratamento. Trocar de caso preserva suas respostas nesta tela; recarregar a página as apaga. Nada é enviado ao professor.</p></details>
 <div className="mobile-case-picker"><label htmlFor="case-picker">Escolha um caso</label><select id="case-picker" value={caseId} onChange={event=>setCaseId(event.target.value)}>{module.cases.map((c,i)=><option key={c.id} value={c.id}>{i+1}. {c.title}</option>)}</select><div className="case-switch"><button onClick={()=>setCaseId(module.cases[caseIndex-1].id)} disabled={caseIndex===0}>Caso anterior</button><span>{caseIndex+1} de {module.cases.length}</span><button onClick={()=>setCaseId(module.cases[caseIndex+1].id)} disabled={caseIndex===module.cases.length-1}>Próximo caso</button></div></div>
 <div className="learning-layout">
 <aside className="case-menu"><p className="eyebrow">Escolha um caso</p><nav aria-label="Casos disponíveis">{module.cases.map((c,i)=><button key={c.id} onClick={()=>setCaseId(c.id)} aria-current={caseId===c.id?'true':undefined}><span className="case-number">{String(i+1).padStart(2,'0')}</span><span><strong>{c.title}</strong><small>{c.focus}</small>{(attempts[c.id]?.cursor??0)>=c.questions.length&&<small className="done-label">Roteiro concluído nesta tela</small>}</span></button>)}</nav><p className="local-note">Casos fictícios. Prática educacional, sem registro de notas.</p></aside>
 <section className="case-content" aria-label="Caso em estudo">
 <div className="case-intro"><p className="eyebrow">{item.focus}</p><h2 ref={caseHeading} tabIndex={-1}>{item.title}</h2><p className="presentation-label">Apresentação inicial</p><p>{item.context}</p>
 {current.latest&&<details className="initial-data"><summary>Consultar dados iniciais</summary><Observations item={item}/></details>}
 {current.latest&&<div className="case-update"><p className="eyebrow">Dados na etapa atual</p><h3 ref={updateHeading} tabIndex={-1}>{current.latest.label}</h3><p>{current.latest.context}</p></div>}
 <Observations item={current}/>{current.trace&&<TraceView key={`${caseId}-${current.trace.kind}-${current.trace.rate}`} trace={current.trace}/>}</div>
 {complete ? <section className="completion"><p className="eyebrow">Revisão do caso</p><h2 tabIndex={-1} ref={heading}>Roteiro concluído</h2><p className="takeaway">{item.takeaway}</p><p>{toReview.length?`${toReview.length} ${toReview.length===1?'ponto merece':'pontos merecem'} uma nova leitura.`:'Você identificou as decisões esperadas neste roteiro.'} Isso não certifica competência prática.</p><div className="review-list">{item.questions.map((q,i)=><details key={q.id}><summary><span className={isCorrect(q,attempt.answers[i])?'review-ok':'review-again'}>{isCorrect(q,attempt.answers[i])?'Conferido':'Rever'}</span>{q.title}</summary><p className="small">Dados usados: {caseStateAt(item,i).latest?.label??'apresentação inicial'}.</p><Observations item={caseStateAt(item,i)}/>{caseStateAt(item,i).trace&&<p><strong>Traçado nesta etapa:</strong> {caseStateAt(item,i).trace!.description}</p>}<p><strong>Sua resposta:</strong> {answerText(q,attempt.answers[i])}</p><p><strong>Resposta comentada:</strong> {expectedText(q)}</p><p>{q.explanation}</p></details>)}</div><div className="actions"><button className="primary" onClick={()=>update(()=>emptyAttempt())}>Refazer este caso</button><button className="secondary" onClick={()=>setCaseId(module.cases[(module.cases.indexOf(item)+1)%module.cases.length].id)}>Escolher o próximo caso</button></div></section> : <section className="question-panel">
 <div className="step-line"><span>Etapa {attempt.cursor+1} de {item.questions.length}</span><progress value={attempt.cursor+1} max={item.questions.length} aria-label="Etapa atual" /></div>
 <h2 ref={heading} tabIndex={-1}>{question.title}</h2>{question.prompt&&<p className="question-context">{question.prompt}</p>}
 <form onSubmit={check}>
 {question.numeric ? <div className="numeric-answer"><label htmlFor="numeric-answer">Sua resposta em {question.numeric.unit}</label><div><input id="numeric-answer" inputMode="decimal" autoComplete="off" value={value} onChange={event=>update(a=>({...a,draft:event.target.value}))} disabled={Boolean(checked)} maxLength={12} required pattern="-?[0-9]+([.,][0-9]+)?" aria-describedby="numeric-hint"/><span>{question.numeric.unit}</span></div><div id="numeric-hint" className="small"><p>Aceita ponto ou vírgula decimal.</p><details><summary>Mostrar fórmula</summary>{question.numeric.hint}</details></div></div> : <fieldset disabled={Boolean(checked)}><legend className="sr-only">Escolha uma resposta</legend>{question.options!.map((option,index)=><label className={`option ${value===option.id?'selected':''} ${checked&&option.id===question.answer?'expected':''} ${checked&&value===option.id&&!correct?'incorrect':''}`} key={option.id}><input type="radio" name={`${caseId}-${question.id}`} value={option.id} checked={value===option.id} onChange={()=>update(a=>({...a,draft:option.id}))}/><span className="option-letter" aria-hidden="true">{String.fromCharCode(65+index)}</span><span>{option.text}{checked&&option.id===question.answer&&<small>Resposta esperada</small>}</span></label>)}</fieldset>}
 {!checked&&<button className="primary" type="submit" disabled={!value.trim()}>Conferir resposta</button>}
 </form>
 {checked&&<div className={`explanation ${correct?'is-correct':'needs-review'}`} role="status"><h3>{correct?'Raciocínio conferido':'Vamos revisar este ponto'}</h3>{!correct&&<p><strong>Resposta esperada:</strong> {expectedText(question)}</p>}<p>{question.explanation}</p></div>}
 <div className="actions">{attempt.cursor>0&&<button className="secondary" onClick={()=>move(attempt.cursor-1)}>Voltar uma etapa</button>}{checked&&<button className="primary" onClick={()=>move(attempt.cursor+1)}>{attempt.cursor===item.questions.length-1?'Revisar o caso':'Continuar'}</button>}</div>
 </section>}
 </section>
 </div>
 <footer className="learning-footer"><details><summary>Referências e limites deste módulo</summary><p>{module.scope}</p><ul>{module.references.map(ref=><li key={ref.url}><a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.title} ↗</a></li>)}</ul><p>Casos e redação próprios para ensino. Não reproduzem um curso oficial nem conferem certificação. Referências consultadas em 8 e 9 de novembro de 2026.</p></details><p>Use para estudo e discussão com o professor. Não insira dados de pacientes.</p></footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode>{learning?<LearningApp module={learning}/>:<main><h1>Módulo não encontrado</h1><a href="/" target="_top">Voltar à biblioteca</a></main>}</React.StrictMode>);
