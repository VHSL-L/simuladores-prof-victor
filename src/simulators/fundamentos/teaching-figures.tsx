import React, { useRef } from 'react';
import { equipmentPhotos } from './equipment-photos';
import type { TeachingFigure } from './types';

function EquipmentPhoto({photo}:{photo:(typeof equipmentPhotos)[number]}) {
 const dialog=useRef<HTMLDialogElement>(null);
 return <div className="equipment-item">
  <button type="button" className="equipment-photo-button" onClick={()=>dialog.current?.showModal()} aria-label={`Ampliar fotografia: ${photo.label}`}>
   <img src={photo.src} alt={`Fotografia de ${photo.label.toLowerCase()}`} loading="lazy" decoding="async"/>
   <span>Ampliar fotografia ↗</span>
  </button>
  <strong>{photo.label}</strong><span>{photo.description}</span>
  <dialog ref={dialog} className="equipment-dialog" aria-label={photo.label}>
   <div className="photo-dialog-heading"><strong>{photo.label}</strong><button type="button" onClick={()=>dialog.current?.close()} autoFocus>Fechar</button></div>
   <img src={photo.src} alt={`Fotografia ampliada de ${photo.label.toLowerCase()}`}/>
   <p>{photo.description}</p>
   <p className="photo-credit">Foto: <a href={photo.source} target="_blank" rel="noreferrer">{photo.author} · Wikimedia Commons</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>. Redimensionada, sem alteração do equipamento.</p>
  </dialog>
 </div>;
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
  <div className="equipment-grid">{equipmentPhotos.map(photo=><EquipmentPhoto key={photo.id} photo={photo}/>)}</div>
  <p className="small">Fotografias reais de equipamentos, sem escala comum. Toque para ampliar. Modelos e tamanhos variam; este painel não representa todo o material necessário nem uma recomendação de marca.</p>
  <details className="figure-description"><summary>Créditos das fotografias</summary><ul>{equipmentPhotos.map(photo=><li key={photo.id}><a href={photo.source} target="_blank" rel="noreferrer">{photo.label} · {photo.author}</a> — <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>.</li>)}</ul><p>Wikimedia Commons. Imagens redimensionadas, sem alteração do equipamento.</p></details>
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
