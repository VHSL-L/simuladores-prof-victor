import { choice, type Case, type Gas } from './types';

export const qualityCase: Case = {
  id: 'quality', title: 'Qualidade ao longo da RCP', focus: 'Técnica e trabalho em equipe',
  context: 'Adulto em parada reconhecida, com emergência acionada e RCP em andamento. Dois socorristas treinados usam um dispositivo de feedback. Os números representam uma situação fictícia; o site não mede compressões reais.',
  observations: [{label:'Compressões',value:'150/min'}, {label:'Profundidade',value:'3,5 cm'}, {label:'Retorno do tórax',value:'Incompleto'}],
  questions: [
    choice('quality-adjust','O que precisa mudar?', ['Comprimir ainda mais rápido.', 'Ajustar para 100–120/min, pelo menos 5 cm evitando mais de 6 cm, e permitir retorno completo.', 'Manter a técnica porque qualquer compressão tem a mesma eficácia.'], 1, 'Velocidade, profundidade e retorno precisam ser observados em conjunto. O número de compressões sozinho não descreve a qualidade.'),
    {...choice('quality-switch','Como organizar a equipe agora?', ['Planejar a troca do compressor com pausa mínima.', 'Aguardar exaustão completa para trocar.', 'Suspender a RCP para todos descansarem.'], 0, 'Organize o revezamento aproximadamente a cada 2 minutos, aproveitando a pausa planejada para análise do ritmo. Antecipe ajuda se a qualidade estiver comprometida.'),
      update: {label:'Após cerca de 2 minutos',context:'A frequência foi ajustada, mas o socorrista está fatigado e a profundidade voltou a cair.',observations:[{label:'Compressões',value:'110/min'},{label:'Profundidade',value:'4,1 cm'},{label:'Compressor',value:'Fatigado'}]}},
    {...choice('quality-outcome','Estes números confirmam retorno da circulação?', ['Sim, a profundidade adequada prova que há pulso.', 'Sim, é hora de desligar o DEA.', 'Não. Manter a RCP e reavaliar conforme o algoritmo e os sinais clínicos.'], 2, 'O dispositivo descreve a execução das compressões. O retorno da circulação exige avaliação clínica; não é deduzido da qualidade técnica.'),
      update: {label:'Depois do revezamento',context:'O novo compressor mantém a técnica; a RCP continua enquanto a equipe segue o DEA.',observations:[{label:'Compressões',value:'110/min'},{label:'Profundidade',value:'5,4 cm'},{label:'Retorno do tórax',value:'Completo'}]}},
  ], takeaway:'Qualidade precisa ser sustentada. Organizar o revezamento faz parte do atendimento.',
};

const firstGas: Gas = {ph:7.13,co2:50,hco3:16,na:140,cl:100,albumin:4};
const secondGas: Gas = {...firstGas,ph:7.32,co2:32};
export const serialGasCase: Case = {
  id:'serial-gas',title:'Duas gasometrias, um paciente',focus:'Distúrbio misto e reavaliação',
  context:'Adulto com doença aguda grave, hipoperfusão e ventilação inadequada. A equipe atende via aérea, respiração e circulação imediatamente. Você interpreta as amostras em paralelo, sem usar as contas para adiar suporte.',
  gas:firstGas, observations:[],
  questions:[
    choice('serial-ph','Como está o pH inicial?', ['Alcalemia.', 'Acidemia.', 'Dentro do intervalo de referência.'],1,'O pH inicial está reduzido. Bicarbonato baixo e PaCO₂ elevada exigem avaliar a coexistência de processos acidificantes.'),
    {id:'serial-winter',title:'Com HCO₃⁻ 16, qual a PaCO₂ central esperada por Winter?',numeric:{value:32,tolerance:0.1,unit:'mmHg',hint:'1,5 × HCO₃⁻ + 8 (± 2)'},explanation:'1,5 × 16 + 8 = 32 mmHg; a faixa esperada é 30–34 mmHg.'},
    choice('serial-mixed','A PaCO₂ inicial de 50 mmHg combina com compensação?', ['Sim, qualquer PaCO₂ alta compensa a acidose metabólica.', 'Não há distúrbio porque a albumina é normal.', 'Não. Está acima do esperado: acidose respiratória associada à metabólica.'],2,'A compensação da acidose metabólica reduz a PaCO₂. Um valor de 50, acima da faixa prevista, indica um segundo processo acidificante.'),
    {...choice('serial-response','O que mudou na segunda amostra?', ['A PaCO₂ está na faixa esperada, mas a acidose metabólica persiste.', 'Todos os distúrbios se resolveram.', 'Agora há alcalose metabólica.'],0,'PaCO₂ 32 está dentro de 30–34. O bicarbonato continua em 16 e o pH segue baixo; melhorar um componente não resolve necessariamente o outro.'),
      update:{label:'Segunda amostra · após suporte inicial',context:'Após as intervenções da equipe, uma nova amostra contemporânea aos eletrólitos mostra os valores abaixo. Esta evolução é ilustrativa, não uma previsão de resposta ao tratamento.',gas:secondGas}},
    {id:'serial-gap',title:'Qual o ânion gap na amostra atual?',numeric:{value:24,tolerance:0.1,unit:'mEq/L',hint:'AG = Na⁺ − (Cl⁻ + HCO₃⁻)'},explanation:'140 − (100 + 16) = 24 mEq/L. O AG permanece elevado com albumina normal; a investigação da causa continua.'},
  ],takeaway:'Compare amostras completas. A queda de PaCO₂ pode melhorar o pH enquanto o processo metabólico permanece.',
};

export const peaCase: Case = {
  id:'pea',title:'Há ritmo, mas há circulação?',focus:'Monitor e exame clínico',
  context:'Adulto colapsa, não responde e não respira normalmente. Não há pulso central definido em até 10 segundos. O monitor apresenta atividade organizada; a equipe inicia atendimento de parada.',
  observations:[{label:'Pulso',value:'Não identificado em até 10 s'},{label:'Respiração',value:'Ausente'},{label:'Monitor',value:'60/min'}],
  trace:{kind:'sinus',rate:60,description:'Atividade organizada com complexos estreitos, regulares, precedidos de onda P. O traçado não informa se existe pulso.'},
  questions:[
    choice('pea-recognition','Como integrar o traçado ao exame?', ['O ritmo organizado garante circulação.', 'Atividade elétrica sem pulso (AESP).', 'Fibrilação ventricular.'],1,'AESP é uma condição clínica: atividade elétrica organizada sem pulso. Não pode ser diagnosticada nem excluída pelo traçado isoladamente.'),
    choice('pea-action','Qual caminho inicial?', ['Desfibrilar apenas porque não há pulso.', 'Aguardar o ritmo ficar irregular.', 'RCP, suporte avançado e causas reversíveis; AESP não é ritmo chocável.'],2,'Mantenha RCP, acione a equipe habilitada e siga o algoritmo de ritmo não chocável, incluindo adrenalina precocemente conforme protocolo e investigação das causas.'),
    {...choice('pea-change','Na nova avaliação, qual caminho seguir?', ['Mudar para cuidados pós-parada, reavaliar via aérea, ventilação e perfusão e investigar a causa.', 'Continuar compressões apesar do pulso definido e da PA mensurável.', 'Desfibrilar o ritmo organizado.'],0,'Pulso definido com pressão mensurável indica retorno da circulação neste cenário. Interrompa as compressões e continue suporte e monitorização; a causa ainda precisa ser tratada.'),
      update:{label:'Reavaliação clínica durante o atendimento',context:'Na pausa planejada, o profissional identifica pulso central definido e pressão arterial mensurável. O paciente continua inconsciente. O monitor, sozinho, mudou pouco.',observations:[{label:'Pulso',value:'Presente e definido'},{label:'PA',value:'104/66 mmHg'},{label:'Consciência',value:'Inconsciente'}],trace:{kind:'sinus',rate:68,description:'Atividade organizada, regular, com ondas P e complexos estreitos. A presença de circulação foi confirmada clinicamente.'}}},
  ],takeaway:'Um monitor organizado pode acompanhar AESP ou circulação presente. O exame clínico muda a conduta.',
};

export const asystoleCase: Case = {
  id:'asystole',title:'Traçado quase plano',focus:'Checagem e ritmo não chocável',
  context:'Adulto inconsciente, sem respiração normal e sem pulso definido em até 10 segundos. A equipe já iniciou RCP. Na breve pausa de análise, o traçado parece plano.',
  observations:[{label:'Pulso',value:'Não identificado'},{label:'RCP',value:'Em andamento'},{label:'Registro',value:'Precisa de checagem técnica'}],
  trace:{kind:'asystole',rate:0,description:'Linha isoelétrica esquemática, sem complexos organizados. A avaliação exige checar conexões, ganho e outra derivação.'},
  questions:[
    choice('flat-check','O que conferir sem prolongar a pausa?', ['Conexões, eletrodos, ganho e outra derivação, mantendo o atendimento de parada.', 'Encerrar imediatamente o atendimento.', 'Aplicar choque para verificar se o monitor funciona.'],0,'Uma linha plana pode refletir problema de registro. Cheque o equipamento e confirme o ritmo sem atrasar compressões.'),
    {...choice('asystole-action','O que a confirmação orienta?', ['Desfibrilação de rotina.', 'Seguir o algoritmo de ritmo não chocável, com RCP, suporte avançado e causas reversíveis.', 'Marcapasso transcutâneo como substituto das compressões.'],1,'Assistolia confirmada não é indicação de choque. A equipe mantém RCP e segue o algoritmo, incluindo adrenalina precocemente conforme protocolo. O traçado isolado não determina encerramento da ressuscitação.'),
      update:{label:'Após checagem técnica',context:'Conexões e ganho estão adequados; outra derivação confirma ausência de atividade ventricular. A avaliação clínica segue sem pulso.',observations:[{label:'Pulso',value:'Ausente'},{label:'Registro',value:'Conferido em outra derivação'},{label:'RCP',value:'Retomada após análise'}]}},
  ],takeaway:'Confirme o registro e mantenha as prioridades. Assistolia e FV levam a caminhos diferentes.',
};

export const sodiumTrendCase: Case = {
  id:'sodium-trend',title:'O sódio subiu; e agora?',focus:'Reavaliação durante a correção',
  context:'Adulto com hiponatremia de duração desconhecida e convulsão recebeu atendimento inicial monitorizado por equipe experiente. Após a melhora dos sintomas, a solução hipertônica foi suspensa e o controle laboratorial continuou. As amostras usam o mesmo método.',
  observations:[{label:'Na⁺ inicial',value:'112 mmol/L'},{label:'Na⁺ após 1 hora',value:'117 mmol/L'},{label:'Evolução',value:'Convulsão cessou'}],
  questions:[
    choice('sodium-watch','O que deve acompanhar a melhora clínica?', ['Suspender todos os controles porque a convulsão cessou.', 'Dosar sódio novamente apenas na alta.', 'Manter sódio seriado, diurese e reavaliação do plano.'],2,'A resposta inicial não elimina o risco de correção excessiva. A situação pode mudar durante o tratamento, inclusive após suspender a solução hipertônica.'),
    {id:'sodium-delta',title:'Qual a elevação total do sódio desde o início?',numeric:{value:13,tolerance:0.1,unit:'mmol/L',hint:'Variação = Na⁺ atual − Na⁺ inicial'},explanation:'125 − 112 = 13 mmol/L em 6 horas. Conte desde o valor inicial, não apenas desde a última coleta.',
      update:{label:'Controle após 6 horas',context:'A diurese aumentou muito. Apesar da suspensão da solução hipertônica, o sódio chegou a 125 mmol/L; o paciente está mais desperto.',observations:[{label:'Na⁺ inicial',value:'112 mmol/L'},{label:'Na⁺ atual',value:'125 mmol/L'},{label:'Tempo total',value:'6 horas'},{label:'Diurese',value:'Aumento importante'}]}},
    choice('sodium-response','Como interpretar essa evolução?', ['É correção excessiva: avisar imediatamente a equipe experiente e rever o plano, com monitorização e medidas para conter ou reverter a elevação conforme protocolo.', 'Está seguro porque ainda não chegou a 140.', 'Acelerar a correção até normalizar o exame.'],0,'A elevação de 13 em 6 horas ultrapassa limites de segurança usuais. O aumento da perda de água pode contribuir. Isso exige manejo ativo; melhora aparente não exclui complicações tardias. Este exercício não fornece prescrição de resgate.'),
  ],takeaway:'Acompanhe a variação acumulada e o tempo. Corrigir sintomas e normalizar o exame são objetivos diferentes.',
};
