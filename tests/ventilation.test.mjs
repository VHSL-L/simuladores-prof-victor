import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync('src/simulators/ventilacao-mecanica/respiratory-model.ts','utf8');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports});
const {deriveVcvMetrics:vcv,derivePcvMetrics:pcv,waveformAt:wave,waveScale:scale}=module.exports;
const normal={compliance:50,resistance:10},obstructed={compliance:60,resistance:22};
const v={fio2:30,vt:450,rr:18,flow:45,peep:8};
const p={fio2:30,pinsp:14,ti:.8,rr:18,rise:.15,peep:8};
function close(a,b,tolerance=1e-5){assert.ok(Math.abs(a-b)<tolerance,`${a} ≈ ${b}`);}
function integrateFlow(m,start,end){
 const n=20000,dt=(end-start)/n;let volume=0;
 for(let i=0;i<n;i++)volume+=wave('flow',start+(i+.5)*dt,m)*1000/60*dt;
 return volume;
}

test('curvas obedecem à equação do movimento e conservam volume em ambos os modos',()=>{
 for(const mechanics of [normal,obstructed,{compliance:30,resistance:10}])for(const m of [vcv(v,mechanics),pcv(p,mechanics)]){
  close(m.ti+m.te,m.cycle);
  close(integrateFlow(m,0,m.ti),m.vt,.002);
  close(-integrateFlow(m,m.ti,m.cycle),m.vte,.002);
  close(m.minuteVent,m.vte*m.rr/1000);
  for(let i=0;i<200;i++){
   const t=(i+.5)*m.cycle/200;
   close(wave('pressure',t,m)-m.peep,wave('volume',t,m)/m.compliance+wave('flow',t,m)/60*m.resistance);
  }
  close(wave('volume',m.ti-1e-8,m),wave('volume',m.ti+1e-8,m),.001);
  close(wave('volume',m.cycle-1e-8,m),wave('volume',0,m),.001);
 }
});
test('VCV tem fluxo constante, rampa de volume, pressão resistiva e expiração exponencial',()=>{
 const m=vcv(v,normal);
 close(m.ti,.6);close(m.vt,450);close(m.vte,450);
 close(wave('flow',.1,m),45);close(wave('flow',.5,m),45);
 close(wave('volume',.5,m)-wave('volume',.1,m),300);
 close(m.ppeak-m.pplat,7.5);
 close(wave('pressure',m.ti+.1,m),8);
 close(wave('flow',m.ti+m.timeConstant,m)/wave('flow',m.ti+1e-8,m),Math.exp(-1),1e-6);
});
test('PCV liga subida de pressão, pico de fluxo e volume entregue',()=>{
 const fast=pcv({...p,rise:.05},normal),slow=pcv({...p,rise:.5},normal);
 assert.ok(slow.vt<fast.vt);assert.ok(slow.flow<fast.flow);
 close(wave('pressure',.25,slow),15);
 close(wave('pressure',.6,slow),22);
 assert.ok(wave('flow',.1,slow)<wave('flow',.4,slow));
 assert.ok(wave('flow',.7,slow)<wave('flow',.55,slow));
 // With zero rise time and negligible trapping, VT approaches C × ΔP × (1 − exp(−Ti/RC)).
 const step=pcv({...p,rr:6,rise:1e-6},normal);
 close(step.vt,normal.compliance*p.pinsp*(1-Math.exp(-p.ti/.5)),.002);
});
test('expiração curta retém volume e deixa fluxo negativo antes do ciclo seguinte',()=>{
 for(const derive of [vcv,pcv]){
  const settings=derive===vcv?v:p;
  const slow=derive({...settings,rr:10},obstructed),fast=derive({...settings,rr:30},obstructed);
  assert.ok(fast.startVolume>slow.startVolume);assert.ok(fast.autoPeep>slow.autoPeep);
  assert.ok(fast.endExpFlow<slow.endExpFlow);
  close(fast.autoPeep,fast.startVolume/obstructed.compliance);
  close(wave('flow',fast.cycle-1e-8,fast),fast.endExpFlow,.001);
 }
});
test('extremos dos controles não sobrepõem ciclos e escalas incluem toda a amplitude',()=>{
 for(const mechanics of [normal,obstructed,{compliance:30,resistance:10}])for(const rr of [6,40])for(const m of [
  vcv({...v,rr,vt:900,flow:15},mechanics),vcv({...v,rr,vt:200,flow:100},mechanics),
  pcv({...p,rr,ti:2,rise:.05,pinsp:30},mechanics),pcv({...p,rr,ti:.3,rise:.5,pinsp:5},mechanics)]){
  assert.ok(m.ti>0&&m.te>=.2-1e-8);close(m.ti+m.te,m.cycle);
  for(const value of Object.values(m))if(typeof value==='number')assert.ok(Number.isFinite(value));
  for(const kind of ['pressure','flow','volume'])for(let i=0;i<1000;i++){
   const value=wave(kind,m.cycle*i/1000,m),s=scale(kind,m);
   assert.ok(Number.isFinite(value)&&value>=s.min-1e-6&&value<=s.max+1e-6,`${kind}: ${value} in ${s.min}..${s.max}`);
  }
 }
 const limited=vcv({...v,rr:40,vt:900,flow:15},normal);
 assert.ok(limited.timingLimited);assert.ok(limited.vt<900);
 assert.ok(pcv({...p,rr:40,ti:2},normal).timingLimited);
});
