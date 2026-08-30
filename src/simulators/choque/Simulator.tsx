"use client";

import { useEffect, useMemo, useState } from "react";

type Tone = "good" | "warn" | "bad" | "info";
type Category = "avaliar" | "suporte" | "volume" | "definitivo";
type Vitals = { hr: number; sbp: number; dbp: number; spo2: number; rr: number; crt: number };
type Effect = { score?: number; tone?: Tone; title?: string; message?: string; feedback?: string; delta?: Partial<Vitals>; sets?: string[]; reveals?: { label: string; value: string }[] };
type Action = Effect & { id: string; category: Category; label: string; detail: string; time: number; requires?: string[]; final?: boolean; forcedOutcome?: "partial" | "bad"; variant?: Effect & { when: string } };
type Case = {
  id: string; box: string; initials: string; name: string; demographic: string; arrival: string; complaint: string; onset: string;
  facts: { label: string; value: string }[]; vitals: Vitals; capillary: string; consciousness: string; actions: Action[];
  outcomes: Record<"good" | "partial" | "bad", { title: string; text: string }>; debrief: string;
};
type Timeline = { time: number; label: string; tone: Tone };
type Feedback = { title: string; message: string; detail: string; tone: Tone; duration: number };

const categories: { id: Category; label: string }[] = [
  { id: "avaliar", label: "Avaliar" }, { id: "suporte", label: "Suporte" }, { id: "volume", label: "Volume" }, { id: "definitivo", label: "Tratar causa" },
];

const cases: Case[] = [
  {
    id: "trauma", box: "BOX 01", initials: "MA", name: "Marina Alves", demographic: "29 anos · 62 kg · sem comorbidades conhecidas",
    arrival: "Colisão automobilística · pele fria · dor pélvica", complaint: "“Minha barriga e minha bacia estão doendo muito...”", onset: "Trauma fechado há 35 minutos; veículo com deformidade lateral",
    facts: [{ label: "APARÊNCIA", value: "Pálida, sudoreica e agitada" }, { label: "RESPIRAÇÃO", value: "Murmúrio presente bilateralmente" }, { label: "CIRCULAÇÃO", value: "Pulso fino, TEC 5 segundos" }, { label: "EXAME", value: "Dor abdominal e pélvica intensa" }],
    vitals: { hr: 138, sbp: 78, dbp: 44, spo2: 94, rr: 30, crt: 5 }, capillary: "5 s", consciousness: "Agitada",
    actions: [
      { id: "t-monitor", category: "avaliar", label: "Monitor + acessos e coleta imediata", detail: "Aquecer, obter dois acessos e colher amostras pré-transfusionais", time: 3, score: 6, tone: "good", title: "Estrutura inicial pronta", message: "Acessos obtidos; tipagem, hemograma, coagulação, fibrinogênio, cálcio e gasometria são colhidos em paralelo.", feedback: "A coleta orienta as próximas bolsas, mas não deve atrasar a transfusão de emergência.", sets: ["access"] },
      { id: "t-fast", category: "avaliar", label: "E-FAST + exame dirigido da pelve", detail: "Buscar rapidamente a fonte de sangramento", time: 4, score: 9, tone: "good", title: "Fonte provável identificada", message: "FAST positivo em Morrison e pelve mecanicamente instável.", feedback: "A fonte foi localizada sem retirar a paciente da sala.", sets: ["cause"], reveals: [{ label: "E-FAST", value: "Líquido livre abdominal" }, { label: "PELVE", value: "Instável ao exame" }] },
      { id: "t-wait-type", category: "avaliar", label: "Aguardar tipagem antes de transfundir", detail: "Esperar sangue isogrupo e prova de compatibilidade", time: 15, score: -14, tone: "bad", title: "Transfusão atrasada", message: "Enquanto a equipe aguarda o laboratório, a pressão cai e a paciente fica mais confusa.", feedback: "Na hemorragia com risco de morte, use sangue O não cruzado imediatamente; a tipagem ocorre em paralelo.", delta: { sbp: -16, dbp: -9, hr: 10 } },
      { id: "t-ct", category: "avaliar", label: "Levar agora para tomografia", detail: "Confirmar a anatomia antes de tratar", time: 18, score: -15, tone: "bad", title: "Instabilidade no transporte", message: "A pressão cai no corredor e a paciente fica obnubilada.", feedback: "A tomografia atrasou o controle da hemorragia.", delta: { sbp: -18, dbp: -10, hr: 10 } },
      { id: "t-binder", category: "suporte", label: "Aplicar cinta pélvica", detail: "Estabilizar na altura dos trocânteres", time: 2, score: 7, tone: "good", title: "Sangramento pélvico reduzido", message: "A pelve é estabilizada e a PA deixa de cair tão rápido.", feedback: "Medida precoce e coerente com a suspeita.", delta: { sbp: 5, dbp: 3 } },
      { id: "t-txa", category: "suporte", label: "Administrar ácido tranexâmico", detail: "Paciente dentro da janela de 3 horas", time: 3, score: 5, tone: "good", title: "TXA administrado", message: "O antifibrinolítico é iniciado precocemente.", feedback: "Deve acompanhar, não substituir, o controle da fonte." },
      { id: "t-norepi", category: "suporte", label: "Noradrenalina como única estratégia", detail: "Elevar a PA sem solicitar sangue", time: 5, score: -8, tone: "bad", title: "Número melhor, perfusão não", message: "A PA sobe pouco, mas pele e consciência pioram.", feedback: "Vasopressor isolado não corrige a perda sanguínea.", delta: { sbp: 8, dbp: 5, hr: 5 } },
      { id: "t-blood", category: "volume", label: "Iniciar sangue O− e protocolo maciço", detail: "CH O negativo não cruzado agora; reposição balanceada em seguida", time: 7, score: 12, tone: "good", title: "Ressuscitação hemostática imediata", message: "Marina recebe sangue O negativo sem esperar a tipagem; cálcio, aquecimento e demais componentes são organizados.", feedback: "Por ser mulher de 29 anos, inicia-se O RhD negativo. Migre para componentes isogrupo assim que a tipagem for confirmada, sem interromper o controle da fonte.", delta: { sbp: 16, dbp: 9, hr: -12 }, sets: ["pressure"], requires: ["access"] },
      { id: "t-fluid", category: "volume", label: "Infundir 2 litros de cristaloide", detail: "Expandir antes de solicitar sangue", time: 12, score: -13, tone: "bad", title: "Hemodiluição e hipotermia", message: "A resposta é transitória e o sangramento persiste.", feedback: "Grande volume de cristaloide agravou a ressuscitação.", delta: { sbp: 4, hr: 6 } },
      { id: "t-observe", category: "definitivo", label: "Observar resposta à transfusão antes de intervir", detail: "Reavaliar em 20 minutos antes de acionar cirurgia ou embolização", time: 20, score: -16, tone: "bad", title: "Hemorragia continua", message: "A resposta à transfusão é transitória e a paciente volta a deteriorar.", feedback: "Reposição sem controle da fonte apenas compra tempo enquanto o sangramento continua.", delta: { sbp: -18, dbp: -10, hr: 12 }, requires: ["cause"], final: true, forcedOutcome: "bad" },
      { id: "t-control", category: "definitivo", label: "Acionar controle hemorrágico agora", detail: "Cirurgia/embolização conforme estratégia", time: 4, score: 16, tone: "good", title: "Hemorragia controlada", message: "A paciente segue direto para controle definitivo.", feedback: "Suporte e controle da fonte foram integrados.", requires: ["cause"], final: true },
      { id: "t-reboa-only", category: "definitivo", label: "Usar REBOA e encaminhar para UTI", detail: "Considerar o balão como tratamento final da hemorragia", time: 9, score: -14, tone: "bad", title: "Ponte confundida com tratamento", message: "A oclusão temporária ganha minutos, mas a fonte permanece sangrando.", feedback: "REBOA, quando indicado, é ponte para controle definitivo — não substitui cirurgia ou embolização.", delta: { sbp: -12, dbp: -7, hr: 9 }, requires: ["cause"], final: true, forcedOutcome: "bad" },
    ],
    outcomes: { good: { title: "Controle hemorrágico em tempo oportuno", text: "A fonte é controlada antes do colapso, com recuperação da perfusão." }, partial: { title: "Sobrevive, mas com coagulopatia", text: "A hemorragia é controlada, porém atrasos tornam a evolução mais complexa." }, bad: { title: "Colapso hemorrágico", text: "A paciente chega ao controle da fonte em choque profundo." } },
    debrief: "No trauma instável, colha amostras em paralelo, inicie sangue O negativo sem esperar tipagem e avance simultaneamente para o controle da fonte.",
  },
  {
    id: "infection", box: "BOX 02", initials: "JL", name: "João Lima", demographic: "72 anos · 74 kg · DPOC · hipertensão",
    arrival: "Febre · tosse produtiva · alteração do sensório", complaint: "“Ele não reconhece a família e respira muito rápido.”", onset: "Febre há 3 dias; confusão e piora nas últimas 6 horas",
    facts: [{ label: "APARÊNCIA", value: "Confuso, quente, joelhos moteados" }, { label: "RESPIRAÇÃO", value: "Crepitações em base direita" }, { label: "CIRCULAÇÃO", value: "Pulso amplo, TEC 4 segundos" }, { label: "TEMPERATURA", value: "39,2 °C" }],
    vitals: { hr: 122, sbp: 84, dbp: 46, spo2: 89, rr: 32, crt: 4 }, capillary: "4 s", consciousness: "Confuso",
    actions: [
      { id: "s-lactate", category: "avaliar", label: "Monitor, acessos e lactato", detail: "Avaliar perfusão e gravidade", time: 4, score: 6, tone: "good", title: "Hipoperfusão confirmada", message: "Lactato 5,4 mmol/L e diurese reduzida.", feedback: "A gravidade foi avaliada sem atrasar o tratamento.", reveals: [{ label: "LACTATO", value: "5,4 mmol/L" }, { label: "DIURESE", value: "0,2 mL/kg/h" }] },
      { id: "s-pocus", category: "avaliar", label: "POCUS cardiopulmonar", detail: "Fenotipar congestão e resposta a volume", time: 5, score: 7, tone: "good", title: "Foco provável identificado", message: "VE hiperdinâmico, sem congestão; consolidação à direita.", feedback: "O exame apoia reposição individualizada e sugere foco pulmonar.", sets: ["cause"], reveals: [{ label: "POCUS", value: "VE hiperdinâmico" }, { label: "PULMÃO", value: "Consolidação à direita" }] },
      { id: "s-culture", category: "avaliar", label: "Coletar culturas rapidamente", detail: "Sem atrasar a primeira dose", time: 4, score: 4, tone: "good", title: "Culturas coletadas", message: "Amostras obtidas antes do antibiótico.", feedback: "Boa prática quando não posterga a terapia." },
      { id: "s-wait", category: "avaliar", label: "Esperar culturas para iniciar antibiótico", detail: "Definir o agente antes de tratar", time: 20, score: -16, tone: "bad", title: "Choque progride", message: "O paciente fica mais hipotenso e sonolento.", feedback: "O tratamento empírico não deve esperar microbiologia.", delta: { sbp: -16, dbp: -9, hr: 10, spo2: -4 } },
      { id: "s-o2", category: "suporte", label: "Oxigênio e suporte respiratório", detail: "Corrigir hipoxemia com reavaliação", time: 3, score: 4, tone: "good", title: "Hipoxemia reduzida", message: "SpO₂ melhora, mas a perfusão segue inadequada.", feedback: "Suporte respiratório não resolve a causa.", delta: { spo2: 6, rr: -2 } },
      { id: "s-atb", category: "suporte", label: "Antibiótico empírico agora", detail: "Cobertura conforme foco e epidemiologia", time: 6, score: 11, tone: "good", title: "Antibiótico iniciado", message: "A primeira dose é administrada sem aguardar resultados.", feedback: "A escolha considera foco e fatores individuais.", sets: ["treated"] },
      { id: "s-norepi", category: "suporte", label: "Iniciar noradrenalina", detail: "Titular para pressão de perfusão", time: 4, score: 10, tone: "good", title: "Pressão restaurada", message: "PAM sobe e o sensório melhora discretamente.", feedback: "Vasopressor precoce é apropriado na hipotensão grave.", delta: { sbp: 21, dbp: 14, hr: -7 }, sets: ["pressure"] },
      { id: "s-fluid", category: "volume", label: "Cristaloide balanceado e reavaliar", detail: "Alíquota inicial com avaliação dinâmica", time: 7, score: 8, tone: "good", title: "Resposta parcial ao fluido", message: "A PA sobe, sem surgimento de congestão.", feedback: "Fluidos devem ser individualizados.", delta: { sbp: 11, dbp: 5, hr: -6 }, sets: ["pressure"] },
      { id: "s-lasix", category: "volume", label: "Furosemida pela crepitação", detail: "Assumir congestão pulmonar", time: 5, score: -10, tone: "bad", title: "Perfusão piora", message: "A pressão cai; a crepitação focal persiste.", feedback: "O achado era de pneumonia, não congestão.", delta: { sbp: -12, dbp: -7, hr: 7 } },
      { id: "s-source", category: "definitivo", label: "Tratar a infecção e buscar complicações", detail: "Manter antibiótico adequado; drenar apenas se houver foco controlável", time: 5, score: 14, tone: "good", title: "Plano causal completo", message: "A pneumonia segue em tratamento e a equipe investiga empiema ou outra complicação drenável.", feedback: "Na pneumonia, o antibiótico trata a causa; controle invasivo da fonte só é indicado quando existe um foco anatômico controlável.", requires: ["treated", "pressure"], final: true },
      { id: "s-antifungal", category: "definitivo", label: "Associar antifúngico empírico de rotina", detail: "Ampliar cobertura apesar da ausência de fatores de risco", time: 8, score: -9, tone: "warn", title: "Cobertura sem indicação", message: "A terapia é ampliada, mas não melhora o foco pulmonar provável.", feedback: "Antifúngico empírico deve ser individualizado; uso indiscriminado adiciona toxicidade sem tratar melhor este caso.", requires: ["cause"], final: true, forcedOutcome: "partial" },
      { id: "s-final-wait", category: "definitivo", label: "Manter suporte até identificar o agente", detail: "Adiar tratamento causal direcionado até culturas", time: 18, score: -16, tone: "bad", title: "Atraso do tratamento causal", message: "A disfunção orgânica progride enquanto a equipe aguarda microbiologia.", feedback: "Choque com infecção provável exige tratamento empírico e avaliação precoce da fonte.", delta: { sbp: -14, dbp: -8, hr: 9 }, requires: ["cause"], final: true, forcedOutcome: "bad" },
    ],
    outcomes: { good: { title: "Perfusão recuperada precocemente", text: "Antibiótico, hemodinâmica e avaliação da fonte revertem a trajetória." }, partial: { title: "Resposta lenta e disfunção orgânica", text: "O paciente estabiliza, mas atrasos prolongam o suporte." }, bad: { title: "Choque refratário", text: "A infecção progride para falência de múltiplos órgãos." } },
    debrief: "Antimicrobiano, ressuscitação e vasopressor não devem esperar o POCUS; procure controle anatômico da fonte apenas quando houver indicação.",
  },
  {
    id: "cardiac", box: "BOX 03", initials: "RC", name: "Rafael Costa", demographic: "64 anos · 78 kg · HAS · DM2 · tabagista",
    arrival: "Dor torácica · dispneia · sudorese fria", complaint: "“Estou com muita falta de ar e uma dor forte no peito...”", onset: "Início súbito em repouso há cerca de 90 minutos",
    facts: [{ label: "APARÊNCIA", value: "Frio, sudoreico e confuso" }, { label: "RESPIRAÇÃO", value: "Taquipneico, estertores basais" }, { label: "CIRCULAÇÃO", value: "Pulso fino, TEC 5 segundos" }, { label: "DOR", value: "Precordial, intensidade 9/10" }],
    vitals: { hr: 128, sbp: 82, dbp: 48, spo2: 91, rr: 28, crt: 5 }, capillary: "5 s", consciousness: "Confuso",
    actions: [
      { id: "c-ecg", category: "avaliar", label: "Monitor + ECG 12 derivações", detail: "Acessos, monitorização e ECG imediato", time: 2, score: 9, tone: "good", title: "Informação decisiva", message: "ECG mostra supra extenso de ST em parede anterior.", feedback: "A provável causa é reconhecida sem atrasar o suporte.", sets: ["cause"], reveals: [{ label: "ECG", value: "Supra anterior extenso" }] },
      { id: "c-pocus", category: "avaliar", label: "POCUS cardíaco e pulmonar", detail: "Avaliar função e congestão", time: 4, score: 8, tone: "good", title: "Fenótipo revelado", message: "VE muito hipocontrátil e linhas B bilaterais.", feedback: "Grandes volumes podem piorar a oxigenação.", reveals: [{ label: "POCUS", value: "FEVE estimada em 20%" }, { label: "PULMÃO", value: "Linhas B bilaterais" }] },
      { id: "c-labs", category: "avaliar", label: "Gasometria, lactato e troponina", detail: "Coleta à beira-leito", time: 7, score: 1, tone: "info", title: "Exames coletados", message: "Lactato 5,1; pH 7,28; troponina elevada.", feedback: "Não devem atrasar reperfusão." },
      { id: "c-wait", category: "avaliar", label: "Aguardar troponina antes de decidir", detail: "Observar até a confirmação", time: 18, score: -14, tone: "bad", title: "Deterioração na espera", message: "Confusão, hipotensão e dispneia pioram.", feedback: "A espera atrasou medidas tempo-dependentes.", delta: { sbp: -12, dbp: -7, hr: 9, spo2: -5 } },
      { id: "c-o2", category: "suporte", label: "Oxigênio de rotina pela dor torácica", detail: "Administrar apesar de SpO₂ de 91%", time: 2, score: -2, tone: "warn", title: "Sem benefício demonstrado", message: "A saturação já era ≥ 90% e a conduta não modifica a hipoperfusão.", feedback: "Na síndrome coronariana aguda, oxigênio rotineiro não é recomendado quando a SpO₂ é ≥ 90%; use se surgir hipoxemia.", delta: {} },
      { id: "c-nitro", category: "suporte", label: "Iniciar nitroglicerina IV", detail: "Tratar dor apesar da hipotensão", time: 4, score: -14, tone: "bad", title: "Hipotensão acentuada", message: "A PA cai e o paciente fica obnubilado.", feedback: "Vasodilatação reduziu a pressão de perfusão.", delta: { sbp: -20, dbp: -11, hr: 10 } },
      { id: "c-norepi", category: "suporte", label: "Iniciar noradrenalina", detail: "Restaurar pressão de perfusão", time: 4, score: 10, tone: "good", title: "Pressão restaurada", message: "PAM melhora e o paciente fica mais responsivo.", feedback: "A pressão é sustentada enquanto a causa é tratada.", delta: { sbp: 22, dbp: 14, hr: -7 }, sets: ["pressure"] },
      { id: "c-dobuta", category: "suporte", label: "Associar dobutamina", detail: "Suporte inotrópico para baixo débito", time: 5, score: -8, tone: "bad", title: "Hipotensão agravada", message: "Sem pressão suficiente, surgem taquicardia e piora da PA.", feedback: "Primeiro sustente a pressão.", delta: { sbp: -10, dbp: -6, hr: 11 }, variant: { when: "pressure", score: 8, tone: "good", title: "Débito melhora", message: "Extremidades ficam menos frias e o TEC cai.", feedback: "Inotrópico após garantir pressão.", delta: { sbp: 6, hr: -5 } } },
      { id: "c-small", category: "volume", label: "Cristaloide 250 mL e reavaliar", detail: "Pequena prova volêmica", time: 5, score: -2, tone: "warn", title: "Pouca resposta", message: "A PA quase não muda e a dispneia aumenta.", feedback: "A ausência de benefício pede interrupção.", delta: { sbp: 2, spo2: -2 } },
      { id: "c-large", category: "volume", label: "Cristaloide rápido 1.000 mL", detail: "Expansão sem teste", time: 12, score: -15, tone: "bad", title: "Edema pulmonar", message: "Hipoxemia e esforço respiratório pioram.", feedback: "Grande expansão foi prejudicial.", delta: { sbp: 2, spo2: -9, rr: 7 } },
      { id: "c-medical", category: "definitivo", label: "Tratar clinicamente e cateterizar amanhã", detail: "Buscar estabilidade completa antes da estratégia invasiva", time: 22, score: -18, tone: "bad", title: "Reperfusão atrasada", message: "O choque progride apesar do suporte farmacológico.", feedback: "No infarto complicado por choque, estabilização e revascularização devem avançar juntas.", delta: { sbp: -17, dbp: -9, hr: 12, spo2: -5 }, requires: ["cause"], final: true, forcedOutcome: "bad" },
      { id: "c-coronary-ct", category: "definitivo", label: "Solicitar angio-TC de coronárias", detail: "Confirmar anatomia antes de ativar a hemodinâmica", time: 16, score: -14, tone: "bad", title: "Exame inadequado para o contexto", message: "O paciente deteriora durante a preparação para a tomografia.", feedback: "A angio-TC não deve atrasar reperfusão invasiva em IAM com choque.", delta: { sbp: -14, dbp: -8, hr: 10 }, requires: ["cause"], final: true, forcedOutcome: "bad" },
      { id: "c-cath", category: "definitivo", label: "Ativar hemodinâmica imediatamente", detail: "Reperfusão agora; POCUS e suporte circulatório em paralelo", time: 3, score: 41, tone: "good", title: "Fluxo de reperfusão acionado", message: "A hemodinâmica é ativada sem esperar exames adicionais; a equipe sustenta a perfusão durante a transferência.", feedback: "No IAM com choque, a reperfusão é prioridade e não deve aguardar estabilização completa. Noradrenalina e POCUS podem ocorrer em paralelo; inotrópico depende da persistência de baixo débito.", requires: ["cause"], final: true },
    ],
    outcomes: { good: { title: "Reperfusão acionada em tempo oportuno", text: "A hemodinâmica é ativada imediatamente, enquanto a equipe sustenta a perfusão." }, partial: { title: "Sobrevive, com complicações", text: "A reperfusão ocorre, mas atraso ou iatrogenia prolongam o choque." }, bad: { title: "Choque refratário", text: "O paciente chega à hemodinâmica em colapso." } },
    debrief: "Após reconhecer IAM com choque, acione reperfusão imediatamente; avaliação e suporte circulatório acontecem em paralelo.",
  },
  {
    id: "dyspnea", box: "BOX 04", initials: "FS", name: "Fernanda Souza", demographic: "46 anos · 69 kg · 5º dia após artroplastia",
    arrival: "Dispneia súbita · síncope · dor pleurítica", complaint: "“Não consigo respirar... meu peito dói ao puxar o ar.”", onset: "Piora abrupta durante fisioterapia há 25 minutos",
    facts: [{ label: "APARÊNCIA", value: "Ansiosa, cianose periférica" }, { label: "RESPIRAÇÃO", value: "Taquipneia, sem estertores" }, { label: "CIRCULAÇÃO", value: "Jugulares ingurgitadas, TEC 5 s" }, { label: "MEMBROS", value: "Panturrilha esquerda aumentada" }],
    vitals: { hr: 134, sbp: 76, dbp: 42, spo2: 82, rr: 36, crt: 5 }, capillary: "5 s", consciousness: "Ansiosa",
    actions: [
      { id: "p-ecg", category: "avaliar", label: "Monitor, acessos e ECG", detail: "Buscar ritmo e sobrecarga direita", time: 3, score: 5, tone: "good", title: "Sobrecarga direita", message: "Taquicardia sinusal e sinais de sobrecarga de VD.", feedback: "O ECG apoia, mas não confirma isoladamente.", reveals: [{ label: "ECG", value: "Sobrecarga de VD" }] },
      { id: "p-pocus", category: "avaliar", label: "POCUS cardiopulmonar e venoso", detail: "Avaliação imediata à beira-leito", time: 5, score: 11, tone: "good", title: "TEP de alto risco presumido", message: "VD dilatado, septo achatado e TVP femoral esquerda.", feedback: "O eco isolado não confirma TEP, mas o conjunto clínico e ultrassonográfico sustenta decisão urgente se o transporte for inseguro.", sets: ["presumptive"], reveals: [{ label: "CORAÇÃO", value: "VD dilatado e disfuncional" }, { label: "VEIAS", value: "TVP proximal à esquerda" }] },
      { id: "p-ct", category: "avaliar", label: "Transportar para angiotomografia", detail: "Confirmar o diagnóstico por imagem dedicada", time: 16, score: -15, tone: "bad", title: "Colapso no transporte", message: "Ainda em choque profundo, a paciente perde consciência no corredor.", feedback: "Antes da estabilização, o transporte foi inseguro e atrasou a reperfusão.", delta: { sbp: -17, dbp: -9, spo2: -6 }, variant: { when: "pressure", score: 9, tone: "good", title: "Diagnóstico confirmado com segurança", message: "Após estabilização, a angio-TC mostra trombos centrais bilaterais e sobrecarga do VD.", feedback: "Com pressão sustentada, a confirmação por imagem dedicada tornou-se uma escolha apropriada.", sets: ["cause", "presumptive"], reveals: [{ label: "ANGIO-TC", value: "TEP central bilateral" }] } },
      { id: "p-o2", category: "suporte", label: "Oxigênio em alto fluxo", detail: "Tratar hipoxemia", time: 3, score: 6, tone: "good", title: "Oxigenação parcial", message: "SpO₂ sobe, mas a pressão segue crítica.", feedback: "Suporte sem retardar o tratamento causal.", delta: { spo2: 9, rr: -3 } },
      { id: "p-norepi", category: "suporte", label: "Iniciar noradrenalina", detail: "Sustentar perfusão do ventrículo direito", time: 4, score: 10, tone: "good", title: "Pressão sustentada", message: "PAM melhora e o sensório clareia.", feedback: "Cria margem para reperfusão.", delta: { sbp: 20, dbp: 13, hr: -6 }, sets: ["pressure"] },
      { id: "p-iot", category: "suporte", label: "Intubar sem otimizar a pressão", detail: "Ventilar como primeiro passo", time: 8, score: -17, tone: "bad", title: "Colapso peri-intubação", message: "Após indução e pressão positiva, a PA despenca.", feedback: "A hemodinâmica precisava ser antecipada.", delta: { sbp: -24, dbp: -14, hr: 13, spo2: 6 } },
      { id: "p-small", category: "volume", label: "Cristaloide 250 mL e reavaliar", detail: "Pequena alíquota", time: 5, score: 1, tone: "warn", title: "Resposta mínima", message: "A PA sobe pouco; jugulares ficam mais tensas.", feedback: "Volume excessivo pode distender o VD.", delta: { sbp: 3 } },
      { id: "p-large", category: "volume", label: "Cristaloide rápido 1.500 mL", detail: "Corrigir PA apenas com volume", time: 12, score: -13, tone: "bad", title: "VD mais distendido", message: "A pressão não melhora e a hipoxemia piora.", feedback: "Grande expansão agravou a interação ventricular.", delta: { sbp: -4, spo2: -5, rr: 4 } },
      { id: "p-anticoag-only", category: "definitivo", label: "Anticoagulação isolada e observação", detail: "Aguardar lise endógena apesar do choque", time: 16, score: -15, tone: "bad", title: "Obstrução persiste", message: "A anticoagulação reduz recorrência, mas não reverte a obstrução a tempo.", feedback: "No TEP de alto risco com choque, anticoagulação isolada pode ser insuficiente quando reperfusão é possível.", delta: { sbp: -16, dbp: -9, spo2: -6, hr: 10 }, requires: ["presumptive"], final: true, forcedOutcome: "bad" },
      { id: "p-lysis", category: "definitivo", label: "Anticoagular e organizar reperfusão agora", detail: "Avaliar sangramento; estratégia sistêmica, por cateter ou cirúrgica", time: 5, score: 18, tone: "good", title: "Tratamento causal iniciado", message: "A anticoagulação é iniciada e, pelo pós-operatório recente, a equipe escolhe reperfusão avançada conforme risco e disponibilidade.", feedback: "No TEP com choque, anticoagulação isolada é insuficiente. O quinto pós-operatório aumenta o risco hemorrágico e deve orientar a modalidade de reperfusão.", delta: { sbp: 20, dbp: 12, hr: -10, spo2: 8, rr: -5 }, sets: ["pressure"], requires: ["presumptive"], final: true },
      { id: "p-filter", category: "definitivo", label: "Implantar filtro de veia cava como tratamento principal", detail: "Impedir novos êmbolos sem reperfundir a circulação pulmonar", time: 12, score: -12, tone: "bad", title: "A obstrução atual não foi tratada", message: "O filtro não reduz a carga embólica já presente e o VD continua falhando.", feedback: "Filtro de veia cava não substitui anticoagulação ou reperfusão do TEP de alto risco.", delta: { sbp: -13, dbp: -7, spo2: -5 }, requires: ["presumptive"], final: true, forcedOutcome: "bad" },
    ],
    outcomes: { good: { title: "Reperfusão antes do colapso", text: "A sobrecarga direita diminui e a paciente recupera perfusão." }, partial: { title: "Estabilização com alto risco", text: "A paciente sobrevive, mas necessita suporte prolongado." }, bad: { title: "Parada obstrutiva", text: "A obstrução persiste até o colapso circulatório." } },
    debrief: "No TEP com choque, associe anticoagulação à estratégia de reperfusão e escolha a modalidade conforme risco hemorrágico e recursos locais.",
  },
  {
    id: "allergy", box: "BOX 05", initials: "BN", name: "Bruno Nunes", demographic: "35 anos · 82 kg · asma leve",
    arrival: "Prurido · rouquidão · chiado · tontura", complaint: "“Minha garganta está fechando e estou ficando tonto.”", onset: "Início durante infusão de antibiótico há poucos minutos",
    facts: [{ label: "PELE", value: "Urticária difusa e rubor" }, { label: "VIA AÉREA", value: "Rouquidão e edema labial" }, { label: "RESPIRAÇÃO", value: "Sibilos difusos" }, { label: "CIRCULAÇÃO", value: "Pulso fino, TEC 4 segundos" }],
    vitals: { hr: 142, sbp: 70, dbp: 38, spo2: 86, rr: 34, crt: 4 }, capillary: "4 s", consciousness: "Agitado",
    actions: [
      { id: "a-abc", category: "avaliar", label: "Avaliação ABCDE imediata", detail: "Reconhecer acometimento multissistêmico", time: 2, score: 7, tone: "good", title: "Emergência reconhecida", message: "Pele, via aérea, respiração e circulação estão comprometidas.", feedback: "O diagnóstico é clínico; não espere exames.", sets: ["cause"], reveals: [{ label: "PADRÃO", value: "Início agudo multissistêmico" }] },
      { id: "a-tryptase", category: "avaliar", label: "Aguardar triptase sérica", detail: "Confirmar antes de medicar", time: 18, score: -18, tone: "bad", title: "Quadro progride", message: "O estridor aumenta e o paciente perde consciência.", feedback: "Exames não podem atrasar adrenalina.", delta: { sbp: -18, dbp: -10, spo2: -10 } },
      { id: "a-o2", category: "suporte", label: "Oxigênio em alto fluxo", detail: "Posicionar e preparar via aérea", time: 2, score: 5, tone: "good", title: "Suporte respiratório", message: "A saturação melhora parcialmente; o edema persiste.", feedback: "Complementa, não substitui, a adrenalina.", delta: { spo2: 7 } },
      { id: "a-antih", category: "suporte", label: "Anti-histamínico e observar", detail: "Tratar urticária como prioridade", time: 10, score: -12, tone: "bad", title: "Pele melhora, choque não", message: "O prurido reduz, mas hipotensão e edema pioram.", feedback: "Não reverte rapidamente choque ou via aérea.", delta: { sbp: -10, dbp: -6, spo2: -5 } },
      { id: "a-steroid", category: "suporte", label: "Corticoide IV como primeira medida", detail: "Tentar evitar progressão", time: 8, score: -10, tone: "bad", title: "Sem resposta imediata", message: "A hipotensão persiste enquanto o edema progride.", feedback: "Corticoide não substitui adrenalina.", delta: { sbp: -8, spo2: -4 } },
      { id: "a-neb", category: "suporte", label: "Broncodilatador inalatório isolado", detail: "Tratar apenas o chiado", time: 6, score: -7, tone: "warn", title: "Chiado reduz um pouco", message: "A PA segue crítica e a rouquidão piora.", feedback: "Não trata vasoplegia nem edema de via aérea.", delta: { rr: -2, sbp: -5, spo2: 2 } },
      { id: "a-fluid", category: "volume", label: "Cristaloide rápido e reavaliar", detail: "Reposição para extravasamento capilar", time: 6, score: 7, tone: "good", title: "Resposta parcial", message: "A PA sobe, mas sintomas respiratórios persistem.", feedback: "Fluido acompanha o tratamento de primeira linha.", delta: { sbp: 13, dbp: 7, hr: -5 }, sets: ["pressure"] },
      { id: "a-subcutaneous", category: "definitivo", label: "Adrenalina por via subcutânea", detail: "Aplicar no braço para reduzir efeitos cardiovasculares", time: 6, score: -11, tone: "bad", title: "Absorção lenta e imprevisível", message: "A hipotensão e o edema progridem antes do efeito adequado.", feedback: "A vasoconstrição local retarda a absorção; a via intramuscular na coxa é a primeira escolha.", delta: { sbp: -9, dbp: -5, spo2: -6, hr: 7 }, final: true, forcedOutcome: "bad" },
      { id: "a-iv-bolus", category: "definitivo", label: "Adrenalina IV em bolus", detail: "Usar a via intravenosa para obter efeito mais rápido", time: 2, score: -18, tone: "bad", title: "Taquiarritmia grave", message: "Após o bolus IV, surge taquicardia de complexo largo e instabilidade.", feedback: "Bolus IV não é a abordagem inicial; infusão titulada fica reservada a cenários refratários e equipes experientes.", delta: { hr: 38, sbp: -16, dbp: -9, spo2: -5 }, final: true, forcedOutcome: "bad" },
      { id: "a-epi", category: "definitivo", label: "Adrenalina IM imediata durante o ABCDE", detail: "0,5 mg IM na coxa, sem esperar exames ou completar a avaliação", time: 1, score: 50, tone: "good", title: "Tratamento de primeira linha imediato", message: "A adrenalina é aplicada enquanto a equipe chama ajuda, oferece oxigênio, obtém acesso e interrompe o antibiótico.", feedback: "Administre à primeira suspeita e repita em 5 minutos se não houver melhora; suporte e avaliação acontecem simultaneamente.", delta: { sbp: 28, dbp: 17, hr: -15, spo2: 8, rr: -7 }, sets: ["cause", "pressure"], final: true },
    ],
    outcomes: { good: { title: "Reação revertida precocemente", text: "Adrenalina rápida interrompe a progressão e recupera pressão e ventilação." }, partial: { title: "Resposta após atraso", text: "O paciente melhora, mas precisa de doses adicionais e observação intensiva." }, bad: { title: "Colapso anafilático", text: "O atraso permite progressão para obstrução e parada." } },
    debrief: "Adrenalina intramuscular é administrada imediatamente durante o ABCDE; oxigênio, fluidos e adjuvantes não podem atrasá-la.",
  },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const formatTime = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export default function Home() {
  const [phase, setPhase] = useState<"landing" | "selection" | "briefing" | "simulation">("landing");
  const [caseId, setCaseId] = useState(cases[0].id);
  const selected = cases.find((item) => item.id === caseId) ?? cases[0];
  const [vitals, setVitals] = useState(selected.vitals);
  const [flags, setFlags] = useState<string[]>([]);
  const [findings, setFindings] = useState<{ label: string; value: string }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category>("avaliar");
  const [done, setDone] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [outcome, setOutcome] = useState<"good" | "partial" | "bad" | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("sala-de-choque-progress");
      if (saved) {
        const state = JSON.parse(saved);
        if (cases.some((item) => item.id === state.caseId)) setCaseId(state.caseId);
        if (["landing", "selection", "briefing", "simulation"].includes(state.phase)) setPhase(state.phase);
        if (state.vitals) setVitals(state.vitals);
        if (Array.isArray(state.flags)) setFlags(state.flags);
        if (Array.isArray(state.findings)) setFindings(state.findings);
        if (typeof state.elapsed === "number") setElapsed(state.elapsed);
        if (typeof state.score === "number") setScore(state.score);
        if (categories.some((item) => item.id === state.activeCategory)) setActiveCategory(state.activeCategory);
        if (Array.isArray(state.done)) setDone(state.done);
        if (Array.isArray(state.timeline)) setTimeline(state.timeline);
        setFeedback(state.feedback ?? null);
        setOutcome(state.outcome ?? null);
      }
    } catch {
      sessionStorage.removeItem("sala-de-choque-progress");
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    sessionStorage.setItem("sala-de-choque-progress", JSON.stringify({ phase, caseId, vitals, flags, findings, elapsed, score, activeCategory, done, timeline, feedback, outcome }));
  }, [restored, phase, caseId, vitals, flags, findings, elapsed, score, activeCategory, done, timeline, feedback, outcome]);
  const map = Math.round((vitals.sbp + 2 * vitals.dbp) / 3);
  const perfusion = clamp(Math.round((map - 35) * 1.8), 5, 100);
  const stage = outcome ? 5 : Math.min(4, Math.floor(done.length / 2) + 1);
  const visible = selected.actions.filter((action) => action.category === activeCategory && (!action.requires || action.requires.every((flag) => flags.includes(flag))));
  const statusText = useMemo(() => outcome ? "Caso encerrado" : vitals.sbp < 65 ? "Deterioração crítica" : (flags.includes("cause") || flags.includes("presumptive")) && flags.includes("pressure") ? "Perfusão sustentada — trate a causa" : done.length ? "Reavalie e ajuste sua estratégia" : "Paciente instável — aja agora", [done.length, flags, outcome, vitals.sbp]);

  function resetCase(next = selected) {
    setVitals(next.vitals); setFlags([]); setFindings([]); setElapsed(0); setScore(0); setActiveCategory("avaliar"); setDone([]); setTimeline([]); setFeedback(null); setOutcome(null);
  }
  function chooseCase(next: Case) { setCaseId(next.id); resetCase(next); setPhase("briefing"); }
  function addVitals(base: Vitals, d?: Partial<Vitals>): Vitals {
    const oldMap = (base.sbp + 2 * base.dbp) / 3;
    const sbp = clamp(base.sbp + (d?.sbp ?? 0), 35, 180);
    const dbp = clamp(base.dbp + (d?.dbp ?? 0), 20, 110);
    const newMap = (sbp + 2 * dbp) / 3;
    return {
      hr: clamp(base.hr + (d?.hr ?? 0), 35, 190), sbp, dbp,
      spo2: clamp(base.spo2 + (d?.spo2 ?? 0), 55, 100), rr: clamp(base.rr + (d?.rr ?? 0), 8, 50),
      crt: clamp(d?.crt ?? base.crt - Math.round((newMap - oldMap) / 10), 2, 7),
    };
  }
  function execute(action: Action) {
    if (done.includes(action.id) || outcome) return;
    const effect: Effect = { ...action, ...(action.variant && flags.includes(action.variant.when) ? action.variant : {}) };
    let nextVitals = { ...vitals };
    if (!flags.includes("pressure") && !(effect.sets ?? []).includes("pressure")) nextVitals = addVitals(nextVitals, { sbp: -Math.max(1, Math.floor(action.time / 4)), dbp: -Math.max(1, Math.floor(action.time / 6)), hr: Math.floor(action.time / 5) });
    nextVitals = addVitals(nextVitals, effect.delta);
    const nextFlags = Array.from(new Set([...flags, ...(effect.sets ?? [])]));
    const nextFindings = [...findings];
    (effect.reveals ?? []).forEach((finding) => { if (!nextFindings.some((item) => item.label === finding.label)) nextFindings.push(finding); });
    const nextTime = elapsed + action.time;
    const nextScore = score + (effect.score ?? 0);
    const result: Feedback = { title: effect.title ?? "Conduta executada", message: effect.message ?? "A equipe realizou a intervenção.", detail: effect.feedback ?? "Reavalie o paciente.", tone: effect.tone ?? "info", duration: action.time };
    if (action.final) setOutcome(action.forcedOutcome ?? (nextVitals.sbp < 58 || nextScore < 2 ? "bad" : nextScore >= 22 && nextTime <= 35 ? "good" : "partial"));
    setVitals(nextVitals); setFlags(nextFlags); setFindings(nextFindings); setElapsed(nextTime); setScore(nextScore); setDone([...done, action.id]); setTimeline([{ time: nextTime, label: action.label, tone: result.tone }, ...timeline]); setFeedback(result);
  }

  if (phase === "landing") return <main className="landing-shell"><section className="landing-card"><div className="brand-row"><span className="brand-mark"><span className="pulse-dot" /></span><span>SALA DE CHOQUE DO PROF. VICTOR</span></div><div className="landing-grid"><div><p className="eyebrow">SIMULAÇÃO CLÍNICA INTERATIVA</p><h1>Cinco pacientes.<br /><em>Decisões que mudam a evolução.</em></h1><p className="lead">Entre em uma sala de emergência, escolha um box e acompanhe a fisiologia responder às suas condutas.</p><div className="landing-actions"><button className="primary-button" onClick={() => setPhase("selection")}>Ver pacientes da sala <span>→</span></button><div className="mode-badge"><span>●</span><div><b>Modo treino</b><small>Feedback imediato</small></div></div></div><p className="microcopy">5 casos independentes · evolução dinâmica</p></div><div className="emergency-board"><div className="board-title"><span>SALA DE EMERGÊNCIA</span><b>5 BOXES OCUPADOS</b></div>{cases.map((item) => <div className="board-row" key={item.id}><span>{item.box}</span><strong>{item.initials}</strong><small>{item.arrival}</small><i /></div>)}</div></div></section></main>;

  if (phase === "selection") return <main className="selection-shell"><section className="selection-wrap"><div className="selection-top"><div className="brand-row"><span className="brand-mark"><span className="pulse-dot" /></span><span>SALA DE CHOQUE DO PROF. VICTOR</span></div><button className="quiet-button" onClick={() => setPhase("landing")}>Voltar ao início</button></div><div className="selection-heading"><div><p className="eyebrow">PAINEL DA EMERGÊNCIA</p><h1>Qual paciente você vai assumir?</h1><p>Todos estão instáveis.</p></div><div className="occupancy"><strong>05</strong><span>boxes<br />ocupados</span></div></div><div className="box-grid">{cases.map((item) => <article className="box-card" key={item.id}><div className="box-card-head"><span>{item.box}</span><b><i /> ATENDIMENTO IMEDIATO</b></div><div className="box-patient"><div className="avatar">{item.initials}</div><div><h2>{item.name}</h2><p>{item.demographic.split(" · ")[0]}</p></div></div><p className="box-arrival">{item.arrival}</p><div className="box-mini-vitals"><span>FC <b>{item.vitals.hr}</b></span><span>PA <b>{item.vitals.sbp}/{item.vitals.dbp}</b></span><span>SpO₂ <b>{item.vitals.spo2}%</b></span></div><button onClick={() => chooseCase(item)}>Assumir este box <span>→</span></button></article>)}</div><p className="selection-note">Os casos podem ser realizados em qualquer ordem. Cada trajetória é independente.</p></section></main>;

  if (phase === "briefing") return <main className="briefing-shell"><section className="briefing-card"><div className="briefing-top"><div className="brand-row"><span className="brand-mark"><span className="pulse-dot" /></span><span>SALA DE CHOQUE DO PROF. VICTOR</span></div><span className="briefing-status">PASSAGEM DO CASO · {selected.box}</span></div><div className="briefing-title"><div><p className="eyebrow">ANTES DE ENTRAR</p><h1>Conheça seu paciente</h1><p>Estes são os únicos dados da passagem. O diagnóstico deverá surgir das suas decisões.</p></div><div className="briefing-clock"><span>CHEGADA</span><strong>00:00</strong></div></div><div className="patient-briefing"><div className="briefing-identity"><div className="avatar large">{selected.initials}</div><div><h2>{selected.name}</h2><p>{selected.demographic}</p></div></div><div className="chief-complaint"><span>QUEIXA PRINCIPAL</span><blockquote>{selected.complaint}</blockquote><small>{selected.onset}</small></div><div className="briefing-facts">{selected.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div></div><div className="briefing-footer"><button className="text-button" onClick={() => setPhase("selection")}>← Escolher outro box</button><p><span>●</span> O tempo clínico começará quando você assumir.</p><button className="primary-button" onClick={() => { resetCase(selected); setPhase("simulation"); }}>Assumir o caso <span>→</span></button></div></section></main>;

  return <main className="sim-shell"><header className="sim-header"><div className="brand-row compact"><span className="brand-mark"><span className="pulse-dot" /></span><span>SALA DE CHOQUE DO PROF. VICTOR</span></div><div className="case-progress"><span>EVOLUÇÃO</span><div>{[1,2,3,4,5].map((step) => <i key={step} className={step <= stage ? "active" : ""} />)}</div></div><button className="quiet-button" onClick={() => { resetCase(selected); setPhase("selection"); }}>Trocar box</button></header><section className="sim-grid"><aside className="patient-panel"><div className="panel-label">CASO EM ANDAMENTO · {selected.box}</div><div className="patient-identity"><div className="avatar">{selected.initials}</div><div><h2>{selected.name}</h2><p>{selected.demographic}</p></div></div><div className="case-reminder"><span>PASSAGEM</span><strong>{selected.arrival}</strong><small>{selected.onset}</small></div><div className="physiology-panel"><div><span>PERFUSÃO</span><b>{perfusion >= 62 ? "ADEQUADA" : perfusion >= 40 ? "LIMÍTROFE" : "CRÍTICA"}</b></div><div className="meter"><i style={{ width: `${perfusion}%` }} /></div><div><span>PRESSÃO MÉDIA</span><b>{map} mmHg</b></div><div className="meter pressure-meter"><i style={{ width: `${clamp(map, 5, 100)}%` }} /></div></div><div className="timeline-panel"><h3>Linha do tempo</h3>{!timeline.length && <p className="empty-log">Nenhuma conduta. O relógio começa com sua primeira decisão.</p>}{timeline.map((item, index) => <div className={`timeline-item ${item.tone}`} key={`${item.time}-${index}`}><span>{formatTime(item.time)}</span><p>{item.label}</p></div>)}</div></aside><section className="room-panel"><div className="room-head"><div><p>{selected.box} · SALA DE EMERGÊNCIA</p><h1>{statusText}</h1></div><div className="clinical-clock"><span>TEMPO CLÍNICO</span><strong>{formatTime(elapsed)}</strong></div></div><PatientMonitor vitals={vitals} map={map} /><section className={`perfusion-focus ${perfusion >= 62 ? "good" : perfusion >= 40 ? "mid" : "critical"}`}><div className="perfusion-head"><div><span>PERFUSÃO TECIDUAL</span><strong>{perfusion >= 62 ? "Sinais de recuperação" : perfusion >= 40 ? "Perfusão limítrofe" : "Hipoperfusão importante"}</strong></div><b>{perfusion}<small>%</small></b></div><div className="perfusion-track"><i style={{ width: `${perfusion}%` }} /></div><div className="perfusion-clues"><span>PAM <b>{map} mmHg</b></span><span>TEC <b>{flags.includes("pressure") ? "3 s" : selected.capillary}</b></span><span>Consciência <b>{flags.includes("pressure") ? "Mais responsivo" : selected.consciousness}</b></span><span>Pele <b>{flags.includes("pressure") ? "Menos fria" : "Fria/moteada"}</b></span></div></section>{findings.length > 0 && <div className="findings-row">{findings.map((finding) => <div key={finding.label}><span>{finding.label}</span><strong>{finding.value}</strong></div>)}</div>}{feedback && <section className={`feedback-card ${feedback.tone}`}><div className="feedback-icon">{feedback.tone === "good" ? "✓" : feedback.tone === "bad" ? "!" : "i"}</div><div><span>RESPOSTA DO PACIENTE</span><div className="feedback-title-row"><h2>{feedback.title}</h2><b>+ {feedback.duration} MIN</b></div><p>{feedback.message}</p><small>{feedback.detail}</small></div><button aria-label="Fechar feedback" onClick={() => setFeedback(null)}>×</button></section>}{!outcome && <section className="decisions-panel"><div className="decision-heading"><div><span>PRÓXIMA DECISÃO</span><h2>O que você faz agora?</h2></div><small>O tempo da conduta só aparece depois da escolha.</small></div><div className="category-tabs">{categories.map((category) => <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>{category.label}</button>)}</div><div className="action-grid">{visible.map((action, index) => <button className={`action-card ${done.includes(action.id) ? "completed" : ""}`} key={action.id} onClick={() => execute(action)} disabled={done.includes(action.id)}><span className="action-number">{String(index + 1).padStart(2, "0")}</span><span className="action-copy"><strong>{action.label}</strong><small>{action.detail}</small></span><span className="action-arrow">{done.includes(action.id) ? "✓" : "→"}</span></button>)}{!visible.length && <div className="locked-actions"><span>CONDUTAS AINDA INDISPONÍVEIS</span><strong>Você ainda não tem elementos para tratar a causa.</strong><p>Volte à avaliação e procure a informação que muda a conduta.</p></div>}</div><p className="simulation-note">Simulação educacional: respostas simplificadas para discussão clínica; siga os protocolos locais.</p></section>}{outcome && <section className={`outcome-panel ${outcome}`}><div className="outcome-copy"><p>DESFECHO DO CASO</p><h2>{selected.outcomes[outcome].title}</h2><span>{selected.outcomes[outcome].text}</span><button onClick={() => { resetCase(selected); setPhase("selection"); }}>Escolher outro box</button></div><div className="outcome-score"><div className="score-ring"><strong>{clamp(50 + score, 0, 100)}</strong><span>/ 100</span></div><h3>{outcome === "good" ? "Boa condução" : outcome === "partial" ? "Há pontos para rever" : "Reveja a sequência"}</h3><dl><div><dt>Tempo clínico</dt><dd>{elapsed} min</dd></div><div><dt>Condutas</dt><dd>{done.length}</dd></div><div><dt>Perfusão final</dt><dd>{perfusion < 40 ? "grave" : perfusion < 62 ? "limítrofe" : "controlada"}</dd></div></dl></div><div className="debrief-strip"><strong>PONTO PARA O DEBRIEFING</strong>{selected.debrief}</div></section>}</section></section></main>;
}

function PatientMonitor({ vitals, map }: { vitals: Vitals; map: number }) {
  const alarming = vitals.sbp < 75 || vitals.spo2 < 87;
  const crtTone = vitals.crt <= 2 ? "good" : vitals.crt <= 4 ? "mid" : "critical";
  const crtLabel = vitals.crt <= 2 ? "Perfusão periférica adequada" : vitals.crt <= 4 ? "Enchimento lentificado" : "Hipoperfusão periférica importante";
  const crtWidth = clamp((vitals.crt / 6) * 100, 16, 100);
  return (
    <section className={`patient-monitor ${alarming ? "alarming" : ""}`} aria-label="Monitor multiparamétrico e perfusão periférica">
      <div className="monitor-header"><div><i /> MONITORIZAÇÃO CONTÍNUA</div><span>{alarming ? "ALARME ATIVO" : "EM OBSERVAÇÃO"}</span></div>
      <div className="monitor-values">
        <div className="monitor-value heart"><span>FC</span><small>bpm</small><strong>{vitals.hr}</strong></div>
        <div className={`monitor-value pressure ${vitals.sbp < 80 ? "alert" : ""}`}><span>PA · PAM {map}</span><small>mmHg</small><strong>{vitals.sbp}/{vitals.dbp}</strong></div>
        <div className={`monitor-value oxygen ${vitals.spo2 < 88 ? "alert" : ""}`}><span>SpO₂</span><small>%</small><strong>{vitals.spo2}</strong></div>
        <div className="monitor-value breathing"><span>FR</span><small>irpm</small><strong>{vitals.rr}</strong></div>
      </div>
      <div className={`crt-monitor ${crtTone}`}>
        <div className="crt-heading"><div><span>TEMPO DE ENCHIMENTO CAPILAR</span><b>{crtLabel}</b></div><strong>{vitals.crt}<small> s</small></strong></div>
        <div className="crt-track"><i style={{ width: `${crtWidth}%` }} /></div>
        <div className="crt-scale"><span>≤ 2 s</span><span>3 s</span><span>4 s</span><span>≥ 5 s</span></div>
      </div>
    </section>
  );
}
