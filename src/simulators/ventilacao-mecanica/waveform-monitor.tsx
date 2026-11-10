import { useEffect, useRef, useState } from 'react';
import { waveformAt, waveScale, type VentMetrics, type WaveKind } from './respiratory-model';

const panels = [
 {kind:'pressure', title:'Pressão',unit:'cmH₂O',color:'#ffd34d'},
 {kind:'flow',title:'Fluxo',unit:'L/min',color:'#55e7dc'},
 {kind:'volume',title:'Volume',unit:'mL',color:'#78e878'},
] as const;

function draw(canvas:HTMLCanvasElement,kind:WaveKind,m:VentMetrics,elapsed:number,windowSeconds:number) {
 const rect=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
 const width=Math.floor(rect.width),height=Math.floor(rect.height);
 if(width<80||height<60)return;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)) {
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 }
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const p={left:44,right:17,top:33,bottom:24};
 const w=width-p.left-p.right,h=height-p.top-p.bottom;
 const scale=waveScale(kind,m);
 const y=(v:number)=>p.top+h*(1-(v-scale.min)/(scale.max-scale.min));
 const x=(t:number)=>p.left+(t-elapsed)/windowSeconds*w;
 // The same elapsed time, window and cycle boundaries are used by all three panels.
 ctx.save();ctx.beginPath();ctx.rect(p.left,p.top,w,h);ctx.clip();
 for(let cycle=Math.floor(elapsed/m.cycle);cycle*m.cycle<elapsed+windowSeconds;cycle++) {
  ctx.fillStyle='rgba(134,181,199,.055)';ctx.fillRect(x(cycle*m.cycle),p.top,m.ti/windowSeconds*w,h);
 }
 ctx.restore();
 ctx.font='10px ui-monospace, SFMono-Regular, monospace';ctx.textAlign='right';ctx.textBaseline='middle';
 for(let i=0;i<=4;i++) {
  const value=scale.min+(scale.max-scale.min)*i/4,py=y(value);
  ctx.fillStyle='#a4b8bd';ctx.fillText(Number(value.toFixed(1)).toString(),p.left-8,py);
  ctx.strokeStyle=value===0?'#53676d':'#1c2e33';ctx.lineWidth=value===0?1.2:1;
  ctx.beginPath();ctx.moveTo(p.left,py);ctx.lineTo(p.left+w,py);ctx.stroke();
 }
 ctx.textAlign='center';ctx.textBaseline='alphabetic';
 // Major divisions represent one second, independent of viewport size.
 // Hide only some labels on narrow screens; never stretch or remove time divisions.
 const labelStep=w/windowSeconds>=20?1:2;
 for(let second=0;second<=windowSeconds;second+=.5) {
  const px=p.left+second/windowSeconds*w,major=Number.isInteger(second);
  ctx.strokeStyle=major?'#233943':'#111e26';ctx.lineWidth=major?1:.5;
  ctx.beginPath();ctx.moveTo(px,p.top);ctx.lineTo(px,p.top+h);ctx.stroke();
  if(major&&second%labelStep===0) {
   ctx.fillStyle='#a4b8bd';ctx.fillText(String(second),px,height-7);
  }
 }
 ctx.textAlign='right';ctx.fillStyle='#a4b8bd';ctx.fillText('s',width-3,height-7);
 if(kind==='pressure') {
  ctx.setLineDash([4,4]);ctx.strokeStyle='#9ba87a';ctx.beginPath();ctx.moveTo(p.left,y(m.peep));ctx.lineTo(p.left+w,y(m.peep));ctx.stroke();ctx.setLineDash([]);
  ctx.textAlign='right';ctx.fillStyle='#c4cba9';ctx.fillText('PEEP',p.left+w-3,Math.max(p.top+11,y(m.peep)-4));
 }
 ctx.save();ctx.beginPath();ctx.rect(p.left,p.top,w,h);ctx.clip();
 ctx.strokeStyle=scale.color;ctx.lineWidth=1.7;ctx.lineJoin='round';ctx.beginPath();
 const samples=Math.max(400,Math.ceil(w*2));
 for(let i=0;i<=samples;i++) {
  const t=elapsed+i/samples*windowSeconds,px=p.left+i/samples*w,py=y(waveformAt(kind,t,m));
  if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
 }
 ctx.stroke();ctx.restore();
}

export function WaveformMonitor({metrics}:{metrics:VentMetrics}) {
 const canvases=useRef<(HTMLCanvasElement|null)[]>([]);
 const elapsed=useRef(0);
 const [paused,setPaused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [windowSeconds,setWindowSeconds]=useState(()=>window.innerWidth>=1000?18:12);
 useEffect(()=>{elapsed.current=0;},[metrics]);
 useEffect(()=>{
  let frame=0,last=performance.now(),lastDraw=0;
  const render=(now:number)=>{
   if(!paused)elapsed.current+=(now-last)/1000;
   last=now;
   if(now-lastDraw>=1000/30) {
    panels.forEach((panel,i)=>{const canvas=canvases.current[i];if(canvas)draw(canvas,panel.kind,metrics,elapsed.current,windowSeconds);});
    lastDraw=now;
   }
   frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);
  return ()=>cancelAnimationFrame(frame);
 },[metrics,paused,windowSeconds]);
 return <div className="waveform-monitor">
  <div className="wave-controls">
   <span>{paused?'Curvas congeladas':'Curvas em tempo real'}<small className="wave-timing">1 divisão = 1 s · 1 ciclo = {metrics.cycle.toFixed(2)} s</small></span>
   <label>Escala <select aria-label="Janela de tempo das curvas" value={windowSeconds} onChange={e=>setWindowSeconds(Number(e.target.value))}>
    <option value={6}>6 s</option><option value={12}>12 s</option><option value={18}>18 s</option><option value={24}>24 s</option><option value={30}>30 s</option>
   </select></label>
   <button type="button" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'Retomar curvas':'Congelar curvas'}</button>
  </div>
  <div className="waves-column">{panels.map((panel,i)=><section className="wave-panel" aria-label={`Curva de ${panel.title.toLowerCase()}`} key={panel.kind}>
   <div className="wave-heading"><span className="wave-dot" style={{backgroundColor:panel.color}}/><strong>{panel.title} × tempo</strong><span>{panel.unit}</span></div>
   <canvas ref={element=>{canvases.current[i]=element;}} role="img" aria-label={`${panel.title} em ${panel.unit}; janela de ${windowSeconds} segundos. Valores numéricos e descrição abaixo.`}/>
  </section>)}</div>
  <details className="wave-guide"><summary>Como ler estas curvas</summary>
   <p>{metrics.mode==='VCV'?'VCV: fluxo inspiratório constante, volume subindo em rampa e pressão aumentando com o enchimento.':'PCV: pressão sobe até o alvo; o fluxo aumenta durante a subida e depois desacelera. A velocidade de enchimento depende da mecânica e do tempo de subida.'} Na expiração, a pressão da via aérea retorna à PEEP e o fluxo negativo diminui à medida que o pulmão esvazia.</p>
   <p>As faixas discretamente iluminadas marcam a inspiração. As três curvas compartilham a mesma escala horizontal, de 0 até a duração escolhida. Cada divisão principal vale 1 segundo; as linhas mais discretas dividem meio segundo. Em telas estreitas, alguns números são omitidos para manter a leitura. A janela muda a apresentação, sem alterar a frequência respiratória ou a velocidade real do tempo. As escalas verticais se ajustam à amplitude.</p>
   <p>FR {metrics.rr} ciclos/min: um ciclo a cada {metrics.cycle.toFixed(2)} s (60 ÷ FR). VCe {metrics.vte.toFixed(0)} mL · Ppico {metrics.ppeak.toFixed(1)} cmH₂O · fluxo ao final da expiração {metrics.endExpFlow.toFixed(1)} L/min. Volume acima do equilíbrio na PEEP ajustada: se houver retenção, a curva pode não retornar a zero. Auto-PEEP estimada: {metrics.autoPeep.toFixed(1)} cmH₂O.</p>
   <p>Modelo passivo de um compartimento, sem esforço muscular ou vazamento. Mostra ciclos estabilizados após cada ajuste, sem simular a transição. Congelar interrompe a animação; alterar os controles recalcula as três curvas.</p>
   <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10208993/" target="_blank" rel="noreferrer">Referência: equação do movimento e interpretação de curvas · Chatburn, 2023</a>
  </details>
 </div>;
}
