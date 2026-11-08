import type { Trace } from './types';
// Synthetic educational traces, not patient recordings. 100 SVG units = 1 second.
export function beatTimes(trace: Trace): number[] {
 if (trace.kind === 'vf') return [];
 const times: number[] = []; const rr = 60 / trace.rate;
 const variation = [0.72,1.26,0.87,1.13,0.66,1.35,0.94,1.07];
 let t = 0.28; let i = 0;
 while (t < 6) { times.push(t); t += rr * (trace.kind === 'af' ? variation[i++ % variation.length] : 1); }
 return times;
}
function gaussian(t:number, center:number, width:number, height:number) { return height * Math.exp(-0.5 * ((t-center)/width)**2); }
export function waveValue(trace:Trace,t:number,times=beatTimes(trace)) {
 if (trace.kind === 'vf') return (0.55+0.15*Math.sin(t*3.1))*(Math.sin(t*41)+0.37*Math.sin(t*67.3)+0.22*Math.sin(t*23.7));
 let y = trace.kind === 'af' ? 0.028*Math.sin(t*79)+0.018*Math.sin(t*113) : 0;
 for(const beat of times) {
  if (trace.kind === 'wide') {
   // Broad, monomorphic complexes; no visible organized P waves.
   y+=gaussian(t,beat-0.055,0.025,-0.23)+gaussian(t,beat,0.045,1.05)+gaussian(t,beat+0.075,0.03,-0.5)+gaussian(t,beat+0.2,0.05,-0.24);
  } else {
   if(trace.kind === 'brady') y+=gaussian(t,beat-0.18,0.025,0.15);
   y+=gaussian(t,beat-0.025,0.008,-0.16)+gaussian(t,beat,0.01,1)+gaussian(t,beat+0.025,0.01,-0.25)+gaussian(t,beat+0.20,0.045,0.22);
  }
 }
 return y;
}
export function wavePath(trace:Trace) {
 const beats=beatTimes(trace); const parts:string[]=[];
 for(let i=0;i<=1800;i++){const t=i/300;parts.push(`${i?'L':'M'}${(t*100).toFixed(2)},${(100-waveValue(trace,t,beats)*48).toFixed(2)}`);}
 return parts.join(' ');
}
