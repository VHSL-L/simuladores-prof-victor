/** Passive, linear, single-compartment model at periodic steady state.
 * Paw − PEEP = V/C + R·flow. V is above equilibrium at the set PEEP.
 * C: mL/cmH₂O, R: cmH₂O/(L/s), time: s, returned flow: L/min.
 * No patient effort, leaks, nonlinear compliance, valve delay or circuit compliance.
 * See README.md for equations, references and scope.
 */
export type WaveKind = 'pressure' | 'flow' | 'volume';
export type VentMode = 'VCV' | 'PCV';
export type VcvSettings = { fio2:number; vt:number; rr:number; flow:number; peep:number };
export type PcvSettings = { fio2:number; pinsp:number; ti:number; rr:number; rise:number; peep:number };
export type Mechanics = { compliance:number; resistance:number };
export type VentMetrics = {
 mode:VentMode; fio2:number; vt:number; rr:number; flow:number; peep:number;
 pinsp:number; rise:number; compliance:number; resistance:number; timeConstant:number;
 ti:number; cycle:number; te:number; ie:number; minuteVent:number; vte:number;
 pplat:number; ppeak:number; startVolume:number; endVolume:number; autoPeep:number;
 endExpFlow:number; timingLimited:boolean;
};

function timing(rr:number, requestedTi:number) {
 const cycle=60/rr;
 // Reserve 0.2 s for expiration; expose incompatible requests instead of overlapping breaths.
 const ti=Math.min(requestedTi,cycle-.2);
 return {cycle,ti,te:cycle-ti,ie:(cycle-ti)/ti,timingLimited:requestedTi>ti+1e-9};
}

export function deriveVcvMetrics(settings:VcvSettings, mechanics:Mechanics):VentMetrics {
 const t=timing(settings.rr,settings.vt/(settings.flow*1000/60));
 const timeConstant=mechanics.compliance/1000*mechanics.resistance;
 const vt=settings.flow*1000/60*t.ti;
 const b=Math.exp(-t.te/timeConstant);
 const endVolume=vt/(1-b), startVolume=endVolume*b;
 const pplat=settings.peep+endVolume/mechanics.compliance;
 return {...settings,...mechanics,...t,mode:'VCV',vt,timeConstant,startVolume,endVolume,
  pinsp:pplat-settings.peep+settings.flow/60*mechanics.resistance,rise:0,
  vte:vt,minuteVent:vt*settings.rr/1000,pplat,ppeak:pplat+settings.flow/60*mechanics.resistance,
  autoPeep:startVolume/mechanics.compliance,endExpFlow:-startVolume/timeConstant*.06};
}

// Exact response to a linear pressure rise followed by a constant pressure target,
// with zero initial volume. The homogeneous response adds retained volume separately.
function pressureResponse(t:number, compliance:number, pinsp:number, rise:number, tau:number) {
 const ramp=Math.min(t,rise);
 const atRamp=compliance*pinsp/rise*(ramp+tau*Math.expm1(-ramp/tau));
 return t<=rise ? atRamp : compliance*pinsp+(atRamp-compliance*pinsp)*Math.exp(-(t-rise)/tau);
}

export function derivePcvMetrics(settings:PcvSettings, mechanics:Mechanics):VentMetrics {
 const t=timing(settings.rr,settings.ti);
 const timeConstant=mechanics.compliance/1000*mechanics.resistance;
 const forced=pressureResponse(t.ti,mechanics.compliance,settings.pinsp,settings.rise,timeConstant);
 const endVolume=forced/(1-Math.exp(-t.cycle/timeConstant));
 const startVolume=endVolume*Math.exp(-t.te/timeConstant);
 const vt=endVolume-startVolume;
 const peakTime=Math.min(settings.rise,t.ti);
 const peakVolume=startVolume*Math.exp(-peakTime/timeConstant)+pressureResponse(peakTime,mechanics.compliance,settings.pinsp,settings.rise,timeConstant);
 const flow=(settings.pinsp*Math.min(peakTime/settings.rise,1)-peakVolume/mechanics.compliance)/mechanics.resistance*60;
 return {...settings,...mechanics,...t,mode:'PCV',vt,timeConstant,flow,startVolume,endVolume,
  vte:vt,minuteVent:vt*settings.rr/1000,pplat:settings.peep+endVolume/mechanics.compliance,
  ppeak:settings.peep+settings.pinsp*Math.min(t.ti/settings.rise,1),
  autoPeep:startVolume/mechanics.compliance,endExpFlow:-startVolume/timeConstant*.06};
}

export function waveformAt(kind:WaveKind,t:number,m:VentMetrics):number {
 const local=((t%m.cycle)+m.cycle)%m.cycle;
 const inspiration=local<m.ti;
 let volume:number, pressure:number, flow:number;
 if(!inspiration) {
  volume=m.endVolume*Math.exp(-(local-m.ti)/m.timeConstant);
  pressure=m.peep;
  flow=-volume/m.timeConstant*.06;
 } else if(m.mode==='VCV') {
  volume=m.startVolume+m.flow*1000/60*local;
  flow=m.flow;
  pressure=m.peep+volume/m.compliance+flow/60*m.resistance;
 } else {
  volume=m.startVolume*Math.exp(-local/m.timeConstant)+pressureResponse(local,m.compliance,m.pinsp,m.rise,m.timeConstant);
  pressure=m.peep+m.pinsp*Math.min(local/m.rise,1);
  flow=(pressure-m.peep-volume/m.compliance)/m.resistance*60;
 }
 return kind==='pressure'?pressure:kind==='flow'?flow:volume;
}

export function waveScale(kind:WaveKind,m:VentMetrics) {
 if(kind==='pressure')return {min:0,max:Math.max(40,Math.ceil((m.ppeak+2)/20)*20),color:'#ffd34d'};
 if(kind==='volume')return {min:0,max:Math.max(500,Math.ceil(m.endVolume/250)*250),color:'#78e878'};
 const peak=Math.max(m.flow,m.endVolume/m.timeConstant*.06,Math.abs(m.endExpFlow));
 const max=Math.max(60,Math.ceil(peak/30)*30);
 return {min:-max,max,color:'#55e7dc'};
}
