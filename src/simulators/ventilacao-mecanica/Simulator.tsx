"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { deriveVcvMetrics, derivePcvMetrics, type VentMode, type VcvSettings, type PcvSettings, type Mechanics } from './respiratory-model';
import { WaveformMonitor } from './waveform-monitor';
type ScenarioId = "free" | "hypoxemia" | "hypercapnia" | "initial";
type Assessment = { status: "success" | "review"; title: string; details: string[] };

type SimulatorSnapshot = {
  scenarioId: ScenarioId;
  mode: VentMode;
  vcvSettings: VcvSettings;
  pcvSettings: PcvSettings;
  assessment: Assessment | null;
};

type ScenarioWork = Omit<SimulatorSnapshot, "scenarioId">;

type ClinicalScenario = {
  id: ScenarioId;
  shortLabel: string;
  title: string;
  patient: string;
  pbw?: number;
  baseline: string;
  mission: string;
  mode: VentMode;
  mechanics: Mechanics;
  vcv: VcvSettings;
  pcv: PcvSettings;
};

const VCV_DEFAULTS: VcvSettings = {
  fio2: 30,
  vt: 450,
  rr: 18,
  flow: 45,
  peep: 8,
};

const PCV_DEFAULTS: PcvSettings = {
  fio2: 30,
  pinsp: 14,
  ti: 0.8,
  rr: 18,
  rise: 0.15,
  peep: 8,
};

const NORMAL_MECHANICS: Mechanics = { compliance: 50, resistance: 10 };

const SCENARIOS: ClinicalScenario[] = [
  {
    id: "free",
    shortLabel: "Treino livre",
    title: "Exploração livre do ventilador",
    patient: "Paciente virtual adulto",
    baseline: "Sem gasometria ou objetivo clínico definido.",
    mission: "Explore VCV e PCV e observe como curvas, monitorização e alertas respondem.",
    mode: "VCV",
    mechanics: NORMAL_MECHANICS,
    vcv: VCV_DEFAULTS,
    pcv: PCV_DEFAULTS,
  },
  {
    id: "hypoxemia",
    shortLabel: "Caso 2 · Hipoxemia",
    title: "Pneumonia com SARA moderada",
    patient: "Mulher, 1,60 m · peso predito 52 kg",
    pbw: 52,
    baseline: "SpO₂ 84% · pH 7,43 · PaCO₂ 36 · PaO₂ 52 · HCO₃ 23",
    mission: "Ajuste oxigenação sem abandonar ventilação protetora. Observe VC por peso predito, PEEP, FiO₂ e pressões.",
    mode: "VCV",
    mechanics: { compliance: 30, resistance: 10 },
    vcv: { fio2: 40, vt: 450, rr: 18, flow: 45, peep: 5 },
    pcv: { fio2: 40, pinsp: 15, ti: 0.8, rr: 18, rise: 0.15, peep: 5 },
  },
  {
    id: "hypercapnia",
    shortLabel: "Caso 3 · Hipercapnia",
    title: "Exacerbação de DPOC",
    patient: "Homem, 1,75 m · peso predito 71 kg",
    pbw: 71,
    baseline: "SpO₂ 90% · pH 7,25 · PaCO₂ 68 · PaO₂ 65 · HCO₃ 29",
    mission: "Melhore a ventilação preservando tempo expiratório. Evite aumentar FR e Ti a ponto de gerar auto-PEEP.",
    mode: "PCV",
    mechanics: { compliance: 60, resistance: 22 },
    vcv: { fio2: 35, vt: 400, rr: 14, flow: 60, peep: 5 },
    pcv: { fio2: 35, pinsp: 12, ti: 0.8, rr: 14, rise: 0.15, peep: 5 },
  },
  {
    id: "initial",
    shortLabel: "Caso 1 · Configuração",
    title: "Primeira configuração após intubação",
    patient: "Mulher, 1,65 m · peso predito fornecido: 57 kg",
    pbw: 57,
    baseline: "SpO₂ 96% sob ventilação manual · pH 7,38 · PaCO₂ 42 · PaO₂ 92 · HCO₃ 24",
    mission: "O ventilador ainda não foi configurado. Use o peso predito, inicie com FiO₂ 100% e planeje a titulação após avaliar a resposta.",
    mode: "VCV",
    mechanics: NORMAL_MECHANICS,
    vcv: { fio2: 100, vt: 200, rr: 6, flow: 15, peep: 0 },
    pcv: { fio2: 100, pinsp: 5, ti: 0.3, rr: 6, rise: 0.15, peep: 0 },
  },
];

const SCENARIO_SEQUENCE: ClinicalScenario[] = [SCENARIOS[3], SCENARIOS[1], SCENARIOS[2], SCENARIOS[0]];

const VCV_LIMITS = {
  fio2: { min: 21, max: 100, step: 5 },
  vt: { min: 200, max: 900, step: 50 },
  rr: { min: 6, max: 40, step: 1 },
  flow: { min: 15, max: 100, step: 5 },
  peep: { min: 0, max: 20, step: 1 },
} as const;

const PCV_LIMITS = {
  fio2: { min: 21, max: 100, step: 5 },
  pinsp: { min: 5, max: 30, step: 1 },
  ti: { min: 0.3, max: 2, step: 0.05 },
  rr: { min: 6, max: 40, step: 1 },
  rise: { min: 0.05, max: 0.5, step: 0.05 },
  peep: { min: 0, max: 20, step: 1 },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function MonitorItem({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className={`monitor-item${accent ? " monitor-accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{unit}</small>
    </div>
  );
}

function ControlTile({
  label,
  value,
  unit,
  calculated,
  calculatedNote,
  disabled,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  unit: string;
  calculated?: boolean;
  calculatedNote?: string;
  disabled?: boolean;
  onDecrease?: () => void;
  onIncrease?: () => void;
}) {
  return (
    <article className={`control-tile${calculated ? " calculated" : ""}`}>
      <div className="control-label-row">
        <span>{label}</span>
        {calculated && <em>calculado</em>}
      </div>
      <div className="control-value-row">
        {!calculated && (
          <button aria-label={`Diminuir ${label}`} disabled={disabled} onClick={onDecrease} type="button">
            −
          </button>
        )}
        <div className="control-readout">
          <strong>{value}</strong>
          <small>{unit}</small>
        </div>
        {!calculated && (
          <button aria-label={`Aumentar ${label}`} disabled={disabled} onClick={onIncrease} type="button">
            +
          </button>
        )}
      </div>
      {calculated && <p>{calculatedNote ?? "Resultado calculado pelo ventilador"}</p>}
    </article>
  );
}

function VentilatorSimulator({
  locked = false,
  syncedSnapshot,
  forcedScenarioId,
  presentedScenarioId,
  visibleScenarioIds,
  onSnapshotChange,
}: {
  locked?: boolean;
  syncedSnapshot?: SimulatorSnapshot;
  forcedScenarioId?: ScenarioId;
  presentedScenarioId?: ScenarioId;
  visibleScenarioIds?: ScenarioId[];
  onSnapshotChange?: (snapshot: SimulatorSnapshot) => void;
}) {
  const firstScenarioId = syncedSnapshot?.scenarioId ?? forcedScenarioId ?? presentedScenarioId ?? "initial";
  const firstScenario = SCENARIOS.find((item) => item.id === firstScenarioId) ?? SCENARIOS[3];
  const [scenarioId, setScenarioId] = useState<ScenarioId>(firstScenarioId);
  const [mode, setMode] = useState<VentMode>(syncedSnapshot?.mode ?? firstScenario.mode);
  const [vcvSettings, setVcvSettings] = useState<VcvSettings>(syncedSnapshot?.vcvSettings ?? firstScenario.vcv);
  const [pcvSettings, setPcvSettings] = useState<PcvSettings>(syncedSnapshot?.pcvSettings ?? firstScenario.pcv);
  const [assessment, setAssessment] = useState<Assessment | null>(syncedSnapshot?.assessment ?? null);
  const [screenOnly, setScreenOnly] = useState(false);
  const scenarioWork = useRef<Partial<Record<ScenarioId, ScenarioWork>>>({});
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const visibleScenarios = visibleScenarioIds
    ? SCENARIO_SEQUENCE.filter((item) => visibleScenarioIds.includes(item.id))
    : SCENARIO_SEQUENCE;
  const metrics = useMemo(
    () => mode === "VCV"
      ? deriveVcvMetrics(vcvSettings, scenario.mechanics)
      : derivePcvMetrics(pcvSettings, scenario.mechanics),
    [mode, vcvSettings, pcvSettings, scenario],
  );

  const updateVcv = useCallback(
    (key: keyof VcvSettings, direction: -1 | 1) => {
      if (locked) return;
      const limits = VCV_LIMITS[key];
      setAssessment(null);
      setVcvSettings((current) => {
        const raw = current[key] + limits.step * direction;
        const nextValue = clamp(raw, limits.min, limits.max);
        return { ...current, [key]: Number(nextValue.toFixed(2)) };
      });
    },
    [locked],
  );

  const updatePcv = useCallback(
    (key: keyof PcvSettings, direction: -1 | 1) => {
      if (locked) return;
      const limits = PCV_LIMITS[key];
      setAssessment(null);
      setPcvSettings((current) => {
        const raw = current[key] + limits.step * direction;
        const nextValue = clamp(raw, limits.min, limits.max);
        return { ...current, [key]: Number(nextValue.toFixed(2)) };
      });
    },
    [locked],
  );

  const restoreCurrentMode = () => {
    if (locked) return;
    if (mode === "VCV") setVcvSettings(scenario.vcv);
    else setPcvSettings(scenario.pcv);
    setAssessment(null);
  };

  const openScenario = (nextScenario: ClinicalScenario) => {
    scenarioWork.current[scenarioId] = { mode, vcvSettings, pcvSettings, assessment };
    const savedWork = scenarioWork.current[nextScenario.id];
    setScenarioId(nextScenario.id);
    setMode(savedWork?.mode ?? nextScenario.mode);
    setVcvSettings(savedWork?.vcvSettings ?? nextScenario.vcv);
    setPcvSettings(savedWork?.pcvSettings ?? nextScenario.pcv);
    setAssessment(savedWork?.assessment ?? null);
  };

  const selectScenario = (nextScenario: ClinicalScenario) => {
    if (locked || forcedScenarioId) return;
    openScenario(nextScenario);
  };

  const evaluateAdjustment = () => {
    if (locked || scenario.id === "free") return;
    const pbw = scenario.pbw ?? 70;
    const vtPerKg = metrics.vte / pbw;
    const details: string[] = [];
    let success = true;

    if (scenario.id === "hypoxemia") {
      const estimatedSpo2 = clamp(84 + (metrics.fio2 - 40) * 0.18 + (metrics.peep - 5) * 1.2, 80, 98);
      const protectiveVt = vtPerKg >= 4 && vtPerKg <= 8;
      const safePressure = metrics.pplat < 30;
      const oxygenation = estimatedSpo2 >= 88 && estimatedSpo2 <= 95;
      success = protectiveVt && safePressure && oxygenation;
      details.push(`${protectiveVt ? "✓" : "→"} VCe: ${vtPerKg.toFixed(1)} mL/kg de peso predito.`);
      details.push(`${safePressure ? "✓" : "→"} Pplat estimada: ${metrics.pplat.toFixed(0)} cmH₂O.`);
      details.push(`${oxygenation ? "✓" : "→"} SpO₂ estimada após o ajuste: ${estimatedSpo2.toFixed(0)}%.`);
    } else if (scenario.id === "hypercapnia") {
      const expiratoryPenalty = clamp(metrics.te / 2.5, 0.35, 1);
      const effectiveVent = Math.max(1, metrics.minuteVent * expiratoryPenalty);
      const estimatedCo2 = clamp(68 * 4.5 / effectiveVent, 30, 100);
      const adequateVt = vtPerKg >= 4 && vtPerKg <= 8;
      const expiration = metrics.te >= 2.2;
      const ventilation = estimatedCo2 < 65;
      success = adequateVt && expiration && ventilation && metrics.ppeak < 30;
      details.push(`${adequateVt ? "✓" : "→"} VCe: ${vtPerKg.toFixed(1)} mL/kg de peso predito.`);
      details.push(`${expiration ? "✓" : "→"} Te: ${metrics.te.toFixed(2)} s; procure preservar a expiração.`);
      details.push(`${ventilation ? "✓" : "→"} PaCO₂ estimada após o ajuste: ${estimatedCo2.toFixed(0)} mmHg.`);
      if (!expiration) details.push("→ O fluxo expiratório pode não retornar à linha de base: risco de auto-PEEP.");
    } else {
      const protectiveVt = vtPerKg >= 6 && vtPerKg <= 8;
      const peepOk = metrics.peep >= 5 && metrics.peep <= 10;
      const oxygenOk = metrics.fio2 === 100;
      const rateOk = metrics.rr >= 12 && metrics.rr <= 22;
      const pressureOk = metrics.ppeak < 30;
      const minuteOk = metrics.minuteVent >= 4 && metrics.minuteVent <= 10;
      success = protectiveVt && peepOk && oxygenOk && rateOk && pressureOk && minuteOk;
      details.push(`${protectiveVt ? "✓" : "→"} VCe: ${vtPerKg.toFixed(1)} mL/kg; alvo didático inicial de 6–8 mL/kg.`);
      details.push(`${peepOk ? "✓" : "→"} PEEP: ${metrics.peep.toFixed(0)} cmH₂O.`);
      details.push(`${oxygenOk ? "✓" : "→"} FiO₂ inicial: ${metrics.fio2.toFixed(0)}%; inicie em 100% e depois titule pela resposta.`);
      details.push(`${rateOk && minuteOk ? "✓" : "→"} FR ${metrics.rr.toFixed(0)} e VM ${metrics.minuteVent.toFixed(1)} L/min.`);
      details.push(`${pressureOk ? "✓" : "→"} Ppico: ${metrics.ppeak.toFixed(0)} cmH₂O.`);
    }

    if (metrics.timingLimited) {
      success = false;
      details.push("→ O tempo inspiratório solicitado não cabe no ciclo. Revise FR, fluxo/VC ou Ti.");
    }
    setAssessment({
      status: success ? "success" : "review",
      title: success ? "Ajuste coerente para o objetivo didático" : "Revise alguns pontos do ajuste",
      details,
    });
  };

  useEffect(() => {
    if (!syncedSnapshot) return;
    setScenarioId(syncedSnapshot.scenarioId);
    setMode(syncedSnapshot.mode);
    setVcvSettings(syncedSnapshot.vcvSettings);
    setPcvSettings(syncedSnapshot.pcvSettings);
    setAssessment(syncedSnapshot.assessment);
  }, [syncedSnapshot]);

  useEffect(() => {
    if (!forcedScenarioId || forcedScenarioId === scenarioId) return;
    const nextScenario = SCENARIOS.find((item) => item.id === forcedScenarioId);
    if (!nextScenario) return;
    openScenario(nextScenario);
  }, [forcedScenarioId, scenarioId]);

  useEffect(() => {
    if (!presentedScenarioId || presentedScenarioId === scenarioId) return;
    const nextScenario = SCENARIOS.find((item) => item.id === presentedScenarioId);
    if (!nextScenario) return;
    openScenario(nextScenario);
  }, [presentedScenarioId]);

  useEffect(() => {
    onSnapshotChange?.({ scenarioId, mode, vcvSettings, pcvSettings, assessment });
  }, [assessment, mode, onSnapshotChange, pcvSettings, scenarioId, vcvSettings]);

  const alerts = useMemo(() => {
    const items: { level: "warning" | "danger"; title: string; detail: string }[] = [];
    if (metrics.timingLimited) items.push({level:"danger",title:"Ajustes de tempo incompatíveis",detail:"O Ti solicitado não cabe no ciclo. A simulação interrompe a inspiração para reservar 0,20 s de expiração; o volume entregue pode ficar abaixo do ajustado. Revise FR, fluxo/VC ou Ti."});
    if (metrics.autoPeep >= 1) items.push({level:"warning",title:"Expiração incompleta",detail:`O fluxo ainda é ${metrics.endExpFlow.toFixed(1)} L/min antes do próximo ciclo. Auto-PEEP estimada: ${metrics.autoPeep.toFixed(1)} cmH₂O. Correlacione com a curva e o tempo expiratório.`});
    const vtMlKg = scenario.pbw ? metrics.vte / scenario.pbw : null;
    if (vtMlKg !== null ? vtMlKg > 8 : metrics.vt > 600) {
      items.push({
        level: "warning",
        title: "VT elevado",
        detail: metrics.mode === "VCV"
          ? "Considere o peso predito; valores altos aumentam o risco de volutrauma."
          : "VC estimado alto no PCV; reavalie ΔP inspiratória, Ti e mecânica do paciente.",
      });
    }
    if (metrics.mode === "PCV" && (vtMlKg !== null ? vtMlKg < 4 : metrics.vte < 300)) {
      items.push({
        level: "warning",
        title: "VCe baixo no PCV",
        detail: "O volume entregue depende da ΔP, do Ti e da mecânica do paciente.",
      });
    }
    if (metrics.peep < 5) {
      items.push({
        level: "warning",
        title: "PEEP baixa",
        detail: `PEEP em ${metrics.peep.toFixed(0)} cmH₂O. Discuta risco de desrecrutamento alveolar e piora da oxigenação.`,
      });
    } else if (metrics.peep > 15) {
      items.push({
        level: "danger",
        title: "PEEP muito alta",
        detail: `PEEP em ${metrics.peep.toFixed(0)} cmH₂O. Reavalie pressão, repercussão hemodinâmica e necessidade clínica.`,
      });
    } else if (metrics.peep > 12) {
      items.push({
        level: "warning",
        title: "PEEP alta",
        detail: `PEEP em ${metrics.peep.toFixed(0)} cmH₂O. Observe pressão total e tolerância hemodinâmica.`,
      });
    }
    if (metrics.ppeak > 35) {
      items.push({
        level: "danger",
        title: "Pressão muito alta",
        detail: metrics.mode === "VCV"
          ? `Ppico estimada em ${metrics.ppeak.toFixed(0)} cmH₂O. Reavalie VC, fluxo e paciente.`
          : `Ppico em ${metrics.ppeak.toFixed(0)} cmH₂O. Reavalie ΔP inspiratória e PEEP.`,
      });
    } else if (metrics.ppeak > 30) {
      items.push({
        level: "warning",
        title: "Pressão alta",
        detail: "Ppico acima de 30 cmH₂O neste modelo didático.",
      });
    }
    if (metrics.te < 1.5) {
      items.push({
        level: "danger",
        title: "Tempo expiratório curto",
        detail: `Te = ${metrics.te.toFixed(2)} s. Há risco didático de aprisionamento aéreo/auto-PEEP.`,
      });
    }
    if (metrics.fio2 > 60 && scenario.id !== "initial") {
      items.push({
        level: "warning",
        title: "FiO₂ alta",
        detail: "Acima de 60%: reavalie assim que a oxigenação permitir.",
      });
    }
    if (metrics.minuteVent < 4) {
      items.push({
        level: "danger",
        title: "Volume minuto muito baixo",
        detail: "VM abaixo de 4 L/min; correlacione com ventilação alveolar e gasometria.",
      });
    } else if (metrics.minuteVent > 12) {
      items.push({
        level: "warning",
        title: "Volume minuto alto",
        detail: "VM acima de 12 L/min; verifique demanda, FR e VC.",
      });
    }
    return items;
  }, [metrics, scenario]);

  const ieText = metrics.ie >= 1
    ? `1:${metrics.ie.toFixed(1)}`
    : `${(1 / metrics.ie).toFixed(1)}:1`;

  return (
    <main className={`simulator-shell${locked ? " simulator-locked" : ""}${screenOnly ? " screen-only" : ""}`}>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">V</span>
          <div>
            <strong>VENTILAB</strong>
            <small>Simulador do Prof. Victor</small>
          </div>
        </div>
        <div className="mode-title">
          <span>Modo ventilatório</span>
          <strong>{mode}</strong>
        </div>
        <div className="top-status">
          <span className="status-light" />
          SIMULAÇÃO ATIVA
        </div>
      </header>

      <section className={`case-panel${scenario.id === "free" ? " free-case" : ""}`} aria-label="Casos clínicos">
        <div
          className="case-tabs"
          role="tablist"
          aria-label="Selecionar caso clínico"
          style={{ gridTemplateColumns: `repeat(${visibleScenarios.length}, minmax(0, 1fr))` }}
        >
          {visibleScenarios.map((item) => (
            <button
              className={scenario.id === item.id ? "active" : ""}
              key={item.id}
              onClick={() => selectScenario(item)}
              role="tab"
              aria-selected={scenario.id === item.id}
              disabled={locked || Boolean(forcedScenarioId)}
              type="button"
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
        <div className="case-content">
          <div className="case-copy">
            <span>{scenario.id === "free" ? "SIMULADOR" : "CASO CLÍNICO ATIVO"}</span>
            <strong>{scenario.title}</strong>
            <p>{scenario.patient}</p>
          </div>
          <div className="case-data">
            <span>Dados iniciais</span>
            <strong>{scenario.baseline}</strong>
          </div>
          <div className="case-mission">
            <span>Missão</span>
            <p>{scenario.mission}</p>
          </div>
          {scenario.id !== "free" && (
            <button className="evaluate-button" disabled={locked} onClick={evaluateAdjustment} type="button">
              Avaliar ajuste
            </button>
          )}
        </div>
        {assessment && (
          <div className={`assessment ${assessment.status}`} aria-live="polite">
            <div>
              <span>{assessment.status === "success" ? "✓" : "!"}</span>
              <strong>{assessment.title}</strong>
            </div>
            <ul>
              {assessment.details.map((detail) => {
                const achieved = detail.startsWith("✓");
                const message = detail.replace(/^[✓→]\s*/, "");
                return (
                  <li className={achieved ? "met" : "pending"} key={detail}>
                    <span aria-hidden="true">{achieved ? "✓" : "!"}</span>
                    <span>{message}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="ventilator-screen" aria-label="Tela do ventilador mecânico">
        <div className="screen-toolbar">
          <div className="patient-label">
            <span>Adulto · Ventilação invasiva</span>
            <strong>{scenario.id === "free" ? "Adulto · Mecânica fixa" : scenario.shortLabel}</strong>
          </div>
          <div className="vent-mode-switch" role="group" aria-label="Selecionar modo ventilatório">
            <button className={mode === "VCV" ? "active" : ""} disabled={locked} onClick={() => { setMode("VCV"); setAssessment(null); }} type="button">VCV</button>
            <button className={mode === "PCV" ? "active" : ""} disabled={locked} onClick={() => { setMode("PCV"); setAssessment(null); }} type="button">PCV</button>
          </div>
          <div className="screen-actions">
            <button className="screen-focus-button" type="button" aria-pressed={screenOnly} onClick={()=>{setScreenOnly(value=>!value);window.scrollTo({top:0,behavior:'instant'});}}>{screenOnly?'Voltar ao caso':'Ampliar painel'}</button>
            <button className="reset-button" disabled={locked} onClick={restoreCurrentMode} type="button">Restaurar</button>
          </div>
        </div>

        <details className={`device-alarms ${alerts.some(alert=>alert.level==='danger')?'critical':alerts.length?'caution':'clear'}`}>
          <summary><span className="alarm-indicator" aria-hidden="true">{alerts.length?'!':'✓'}</span><strong>{alerts.length ? (alerts.find(alert=>alert.level==='danger')??alerts[0]).title : 'Sem alertas didáticos'}</strong><span>{alerts.length?`${alerts.length} alerta${alerts.length>1?'s':''} · detalhes`:'Ver critérios'}</span></summary>
          <div className="device-alarm-details" aria-live="polite">
            {alerts.length ? alerts.map(alert=><div key={alert.title}><strong>{alert.title}</strong><p>{alert.detail}</p></div>) : <p>Os ajustes estão dentro das faixas didáticas deste caso. A avaliação clínica continua necessária.</p>}
            <small>Alertas educacionais do modelo; não representam todos os alarmes de um equipamento real.</small>
          </div>
        </details>

        <div className="display-grid">
          <WaveformMonitor metrics={metrics} />

          <aside className="monitor-column" aria-label="Valores monitorizados">
            <div className="monitor-heading">
              <span>Valores monitorizados</span>
              <strong>{mode}</strong>
            </div>
            <div className="monitor-grid">
              <MonitorItem label="Ppico" value={metrics.ppeak.toFixed(0)} unit="cmH₂O" accent={metrics.ppeak > 30} />
              {mode === "VCV"
                ? <MonitorItem label="Pplat est." value={metrics.pplat.toFixed(0)} unit="cmH₂O" />
                : <MonitorItem label="ΔP insp" value={metrics.pinsp.toFixed(0)} unit="cmH₂O" accent={metrics.pinsp > 20} />}
              <MonitorItem label="PEEP" value={metrics.peep.toFixed(0)} unit="cmH₂O" accent={metrics.peep < 5 || metrics.peep > 12} />
              <MonitorItem label="VM" value={metrics.minuteVent.toFixed(1)} unit="L/min" accent={metrics.minuteVent < 4 || metrics.minuteVent > 12} />
              <MonitorItem label="VCe" value={metrics.vte.toFixed(0)} unit="mL" />
              <MonitorItem label="FR total" value={metrics.rr.toFixed(0)} unit="rpm" />
              <MonitorItem label="FiO₂" value={metrics.fio2.toFixed(0)} unit="%" accent={metrics.fio2 > 60} />
              <MonitorItem label="I:E" value={ieText} unit="relação" accent={metrics.te < 1.5} />
            </div>
            <div className="timing-strip">
              <span>Ti <strong>{metrics.ti.toFixed(2)} s</strong></span>
              <span>Te <strong>{metrics.te.toFixed(2)} s</strong></span>
              <span>Auto-PEEP est. <strong>{metrics.autoPeep.toFixed(1)} cmH₂O</strong></span>
            </div>
            <p className="model-note">
              {mode === "VCV"
                ? "Pplat é estimada pelo modelo. No ventilador real, confirme com pausa inspiratória quando indicada."
                : "No PCV, o volume depende da ΔP, do Ti, da subida da pressão e da mecânica do paciente virtual."}
            </p>
          </aside>
        </div>

      <section className="controls-deck" aria-label="Ajustes do ventilador">
        <div className="controls-heading">
          <div>
            <span>AJUSTES</span>
            <strong>Parâmetros ajustados</strong>
          </div>
          <p>{mode === "VCV" ? "VC e fluxo definem o Ti automaticamente." : "ΔP e Ti determinam o fluxo e o volume resultantes."}</p>
        </div>
        <div className="controls-grid">
          {mode === "VCV" ? (
            <>
              <ControlTile label="FiO₂" value={metrics.fio2.toFixed(0)} unit="%" disabled={locked} onDecrease={() => updateVcv("fio2", -1)} onIncrease={() => updateVcv("fio2", 1)} />
              <ControlTile label="VC" value={vcvSettings.vt.toFixed(0)} unit="mL" disabled={locked} onDecrease={() => updateVcv("vt", -1)} onIncrease={() => updateVcv("vt", 1)} />
              <ControlTile label="Ti" value={metrics.ti.toFixed(2)} unit="s" calculated calculatedNote="Definido automaticamente por VC ÷ fluxo" />
              <ControlTile label="Frequência" value={metrics.rr.toFixed(0)} unit="rpm" disabled={locked} onDecrease={() => updateVcv("rr", -1)} onIncrease={() => updateVcv("rr", 1)} />
              <ControlTile label="Fluxo" value={metrics.flow.toFixed(0)} unit="L/min" disabled={locked} onDecrease={() => updateVcv("flow", -1)} onIncrease={() => updateVcv("flow", 1)} />
              <ControlTile label="PEEP" value={metrics.peep.toFixed(0)} unit="cmH₂O" disabled={locked} onDecrease={() => updateVcv("peep", -1)} onIncrease={() => updateVcv("peep", 1)} />
            </>
          ) : (
            <>
              <ControlTile label="FiO₂" value={metrics.fio2.toFixed(0)} unit="%" disabled={locked} onDecrease={() => updatePcv("fio2", -1)} onIncrease={() => updatePcv("fio2", 1)} />
              <ControlTile label="ΔP insp" value={metrics.pinsp.toFixed(0)} unit="cmH₂O" disabled={locked} onDecrease={() => updatePcv("pinsp", -1)} onIncrease={() => updatePcv("pinsp", 1)} />
              <ControlTile label="Ti" value={pcvSettings.ti.toFixed(2)} unit="s" disabled={locked} onDecrease={() => updatePcv("ti", -1)} onIncrease={() => updatePcv("ti", 1)} />
              <ControlTile label="Frequência" value={metrics.rr.toFixed(0)} unit="rpm" disabled={locked} onDecrease={() => updatePcv("rr", -1)} onIncrease={() => updatePcv("rr", 1)} />
              <ControlTile label="Subida" value={metrics.rise.toFixed(2)} unit="s" disabled={locked} onDecrease={() => updatePcv("rise", -1)} onIncrease={() => updatePcv("rise", 1)} />
              <ControlTile label="PEEP" value={metrics.peep.toFixed(0)} unit="cmH₂O" disabled={locked} onDecrease={() => updatePcv("peep", -1)} onIncrease={() => updatePcv("peep", 1)} />
            </>
          )}
        </div>
      </section>

        <div className="device-status"><span>VENTILAB · SIMULAÇÃO</span><span>Adulto · Passivo · C {metrics.compliance} mL/cmH₂O · R {metrics.resistance} cmH₂O/L/s</span></div>
      </section>

      <footer className="footer-note">
        <span>USO DIDÁTICO</span>
        <p>Simulação simplificada para aula. Não utilizar para decisões clínicas ou ajuste de ventiladores reais.</p>
      </footer>
    </main>
  );
}


export default function PracticeSimulator() {
  return (
    <div className="practice-only">
      <section className="simulation-stage-banner practice-banner">
        <div><span>MODO ALUNO</span><strong>Ventilação mecânica · prática individual</strong></div>
        <p>Escolha um dos três casos clínicos ou o treino livre. Todos os controles e avaliações estão liberados.</p>
        <span className="teacher-paced-badge">USO DIDÁTICO</span>
      </section>
      <VentilatorSimulator />
    </div>
  );
}
