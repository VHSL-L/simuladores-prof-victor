import React from 'react';
import type { TeachingFigure } from './types';

const equipment = [
 ['bag','Bolsa e máscara','Suporte à ventilação'],
 ['scope','Videolaringoscópio','Visualização da via aérea'],
 ['tube','Tubo traqueal','Dispositivo para intubação'],
 ['suction','Aspiração','Remoção de secreções'],
 ['supraglottic','Dispositivo supraglótico','Alternativa de ventilação'],
 ['monitor','Capnógrafo','Curva de CO₂ expirado'],
] as const;

function EquipmentImage({kind,label}:{kind:string;label:string}) {
 return <svg viewBox="0 0 220 150" role="img" aria-label={`Ilustração de ${label}`}>
  <rect x="8" y="8" width="204" height="134" rx="14" fill="#eef4f4"/>
  <g stroke="#284b57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
   {kind==='bag'&&<>
    <path d="M22 73 Q5 45 31 39 L49 46 L49 94 L31 102 Q12 95 22 73" fill="#dae7ee"/>
    <rect x="45" y="60" width="22" height="25" rx="4" fill="#fff"/>
    <path d="M65 50 C82 34 127 36 144 51 L144 94 C125 108 84 108 65 92Z" fill="#9dccc8"/>
    <path d="M85 49 Q75 72 85 95 M124 49 Q135 72 124 95" fill="none" stroke="#6aaba8"/>
    <path d="M144 64 H165 V94" fill="none" strokeWidth="12"/>
    <path d="M144 64 H165 V94" fill="none" stroke="#fff" strokeWidth="6"/>
    <path d="M165 88 Q144 91 142 116 Q163 133 193 115 Q188 94 174 88Z" fill="#d8e8ee"/>
    <path d="M31 101 Q31 125 58 129" fill="none" stroke="#749aa4" strokeWidth="2"/>
   </>}
   {kind==='scope'&&<>
    <rect x="66" y="15" width="98" height="58" rx="8" fill="#3b5968"/>
    <rect x="73" y="22" width="84" height="40" rx="3" fill="#bfd4dd" stroke="none"/>
    <path d="M102 27 Q91 39 105 53 M125 27 Q137 39 124 53" fill="none" stroke="#7694a0"/>
    <path d="M105 74 V109 Q139 131 182 114 L182 105 Q147 111 130 96 V74Z" fill="#c6d6db"/>
    <path d="M113 83 V104" stroke="#7998a4"/>
    <circle cx="150" cy="67" r="2" fill="#a1cfbf" stroke="none"/>
   </>}
   {kind==='tube'&&<>
    <path d="M66 25 C95 30 142 44 152 76 C158 95 159 113 176 123" fill="none" stroke="#84abb8" strokeWidth="15"/>
    <path d="M66 25 C95 30 142 44 152 76 C158 95 159 113 176 123" fill="none" stroke="#d8edf2" strokeWidth="9"/>
    <path d="M147 94 Q130 99 139 114 Q154 137 174 123" fill="#b2d8dc"/>
    <path d="M147 94 Q166 84 170 104 L174 123" fill="#b2d8dc"/>
    <rect x="49" y="17" width="20" height="16" rx="3" fill="#478c9d"/>
    <path d="M141 97 Q109 71 97 96 L86 115" fill="none" strokeWidth="2"/>
    <ellipse cx="81" cy="119" rx="16" ry="8" transform="rotate(-30 81 119)" fill="#b2d8dc"/>
    <path d="M95 35 L91 43 M110 42 L105 50 M125 52 L120 60" strokeWidth="2"/>
   </>}
   {kind==='suction'&&<>
    <rect x="68" y="52" width="76" height="77" rx="9" fill="#d7e8ec"/>
    <path d="M71 96 Q106 88 141 97 V120 H71Z" fill="#b2cfd4" stroke="none"/>
    <rect x="63" y="45" width="86" height="14" rx="4" fill="#709eaa"/>
    <path d="M82 45 V30 Q82 20 64 22 H29" fill="none" strokeWidth="5"/>
    <path d="M128 45 V28 Q170 14 174 52 V90 Q174 103 191 105" fill="none" stroke="#779da8" strokeWidth="5"/>
    <path d="M191 105 L199 116" fill="none" strokeWidth="7"/>
    <path d="M123 72 H135 M123 88 H135 M123 104 H135" strokeWidth="2"/>
   </>}
   {kind==='supraglottic'&&<>
    <path d="M59 26 C107 30 130 60 139 91" fill="none" stroke="#7fabb7" strokeWidth="19"/>
    <path d="M59 26 C107 30 130 60 139 91" fill="none" stroke="#d4e8ed" strokeWidth="12"/>
    <ellipse cx="145" cy="105" rx="28" ry="38" transform="rotate(-28 145 105)" fill="#b6d1d8"/>
    <ellipse cx="145" cy="105" rx="14" ry="24" transform="rotate(-28 145 105)" fill="#4d7887"/>
    <rect x="43" y="17" width="22" height="19" rx="3" fill="#548c9e"/>
   </>}
   {kind==='monitor'&&<>
    <rect x="35" y="25" width="150" height="97" rx="10" fill="#d5e1e5"/>
    <rect x="46" y="36" width="128" height="63" rx="3" fill="#243f4e"/>
    <path d="M54 84 H65 L68 56 L84 51 L88 84 H101 L105 56 L122 51 L126 84 H139 L143 56 L160 51 L164 84" fill="none" stroke="#a6e0c4" strokeWidth="2.5"/>
    <circle cx="167" cy="110" r="4" fill="#4e8896"/>
    <path d="M54 110 H89" stroke="#7d9aa6"/>
   </>}
  </g>
 </svg>;
}

export function capnoValue(kind: TeachingFigure, seconds: number) {
 if(kind==='capno-absent'||(kind==='capno-lost'&&seconds>=7.5))return 0;
 const phase=seconds%5;
 if(phase<1.8)return 0;
 if(phase<2)return 30*(phase-1.8)/.2;
 if(phase<4.5)return 30+5*(phase-2)/2.5;
 if(phase<4.7)return 35*(4.7-phase)/.2;
 return 0;
}
export function capnoPath(kind: TeachingFigure) {
 return Array.from({length:751},(_,i)=>{
  const time=i/50;
  return `${i?'L':'M'}${(56+time*34).toFixed(2)} ${(190-capnoValue(kind,time)*3.5).toFixed(2)}`;
 }).join(' ');
}
const descriptions: Record<Exclude<TeachingFigure,'equipment'>,string> = {
 'capno-normal':'Trecho de 15 segundos: curvas repetidas com subida, platô expiratório próximo de 35 mmHg e retorno à linha de base. O enunciado informa a duração total do registro.',
 'capno-absent':'Trecho de 15 segundos: linha próxima de zero, sem elevação de CO₂ durante as ventilações.',
 'capno-lost':'Trecho de 15 segundos: a curva estava presente e desaparece abruptamente por volta de 7,5 segundos, permanecendo junto à linha de base.',
};
export function TeachingFigureView({kind}:{kind:TeachingFigure}) {
 if(kind==='equipment')return <figure className="teaching-figure">
  <figcaption>Material de via aérea · conheça os equipamentos</figcaption>
  <div className="equipment-grid">{equipment.map(([id,label,description])=><div className="equipment-item" key={id}><EquipmentImage kind={id} label={label}/><strong>{label}</strong><span>{description}</span></div>)}</div>
  <p className="small">Ilustrações didáticas, sem escala. Modelos e tamanhos variam. A seleção e o uso dependem do plano e da capacitação da equipe; o painel não representa todo o material necessário.</p>
 </figure>;
 return <figure className="teaching-figure capnography">
  <figcaption>Capnografia · registro na etapa atual</figcaption>
  <div className="capno-scroll" tabIndex={0} aria-label="Capnograma com rolagem horizontal"><svg viewBox="0 0 620 238" role="img" aria-label={descriptions[kind]}>
   <rect width="620" height="238" fill="#fbfdfd"/>
   <text x="20" y="23" fill="#405d69" fontSize="13">CO₂ (mmHg)</text>
   {[0,10,20,30,40].map(value=><g key={value}><path d={`M56 ${190-value*3.5} H566`} stroke="#dbe7e9" strokeWidth="1"/><text x="43" y={194-value*3.5} textAnchor="end" fill="#526d78" fontSize="12">{value}</text></g>)}
   {[0,5,10,15].map(value=><g key={value}><path d={`M${56+value*34} 40 V190`} stroke="#e0e9eb"/><text x={56+value*34} y="213" textAnchor="middle" fill="#526d78" fontSize="12">{value}s</text></g>)}
   <path d="M56 40 V190 H566" stroke="#7b969f" fill="none"/>
   <path d={capnoPath(kind)} stroke="#216b69" strokeWidth="3" fill="none" strokeLinejoin="round"/>
   <text x="594" y="231" textAnchor="end" fill="#526d78" fontSize="11">Tempo</text>
  </svg></div>
  <details className="figure-description"><summary>Ler descrição da imagem</summary><p>{descriptions[kind]}</p></details>
  <p className="small">Traçado sintético para interpretação, sem dados de pacientes. No celular, deslize o gráfico para ver todo o registro.</p>
 </figure>;
}
