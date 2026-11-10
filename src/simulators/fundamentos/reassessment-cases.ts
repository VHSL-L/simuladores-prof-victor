import { choice, type Case, type Gas } from './types';

export const qualityCase: Case = {
  id: 'quality', title: 'Qualidade ao longo da RCP', focus: 'Técnica e trabalho em equipe',
  context: 'Adulto em parada reconhecida, com emergência acionada e RCP em andamento. Dois socorristas treinados usam um dispositivo de feedback. Os números representam uma situação fictícia; o site não mede compressões reais.',
  observations: [{label:'Compressões',value:'150/min'}, {label:'Profundidade',value:'3,5 cm'}, {label:'Retorno do tórax',value:'Incompleto'}],
  questions: [
    choice('quality-adjust',"Qual ajuste corrige os problemas mostrados pelo dispositivo?", [
   ["Manter 150/min, aumentar para 5–6 cm e permitir retorno completo do tórax.","A profundidade e o retorno melhorariam, mas 150 compressões/min continua acima da faixa recomendada de 100–120/min."],
   ["Reduzir para 100–120/min, manter 3,5 cm e permitir retorno completo do tórax.","A frequência e o retorno melhorariam, mas 3,5 cm permanece uma profundidade insuficiente no adulto."],
   ["Reduzir para 100–120/min, atingir 5–6 cm e sustentar apoio entre as compressões.","Frequência e profundidade ficariam adequadas, mas sustentar apoio entre compressões impede o retorno completo do tórax."],
   ["Reduzir para 100–120/min, atingir 5–6 cm e permitir retorno completo do tórax.",null]
 ], 3, "A frequência excessiva, a profundidade insuficiente e o retorno incompleto precisam de correção conjunta. Melhorar apenas um parâmetro não compensa os demais."),
    {...choice('quality-switch',"Com queda da profundidade e fadiga, qual ajuste de equipe é mais adequado?", [
   ["Manter o compressor até completar 5 minutos, pois a frequência ainda está adequada.","A profundidade caiu para 4,1 cm e o compressor está fatigado. Manter a mesma pessoa até 5 minutos aceita uma qualidade já inadequada."],
   ["Reduzir a frequência para aliviar a fadiga, mantendo o mesmo compressor no próximo ciclo.","A frequência está adequada em 110/min. Reduzi-la para compensar fadiga não resolve de modo apropriado a queda de profundidade; organize o revezamento."],
   ["Trocar o compressor com pausa mínima, aproveitando a análise planejada do ritmo.",null],
   ["Pausar a RCP para descanso breve e reiniciar o ciclo com o mesmo compressor.","Uma pausa para descanso aumenta o tempo sem suporte circulatório. Há outro socorrista disponível para assumir com interrupção mínima."]
 ], 2, "O revezamento aproximadamente a cada 2 minutos, ou antes se necessário, ajuda a sustentar a qualidade. Frequência adequada não neutraliza compressões rasas; evite pausas para descanso."),
      update: {label:'Após cerca de 2 minutos',context:'A frequência foi ajustada, mas o socorrista está fatigado e a profundidade voltou a cair.',observations:[{label:'Compressões',value:'110/min'},{label:'Profundidade',value:'4,1 cm'},{label:'Compressor',value:'Fatigado'}]}},
    {...choice('quality-outcome',"Qual interpretação é correta após a melhora da técnica?", [
   ["A circulação retornou; a profundidade adequada indica recuperação do débito próprio.","A profundidade adequada descreve a compressão externa. O dispositivo não confirma que o coração voltou a gerar circulação espontânea."],
   ["A circulação precisa ser checada imediatamente; pausar agora apesar de não haver novos sinais.","Sem novos sinais de vida, a melhora técnica não é motivo para uma pausa adicional de pulso. A reavaliação segue o algoritmo."],
   ["A indicação de choque desapareceu; bons parâmetros de compressão substituem a análise do DEA.","A qualidade das compressões não identifica se o ritmo é chocável. A análise do DEA continua necessária nos momentos indicados."],
   ["A qualidade melhorou; manter RCP e reavaliar circulação conforme o algoritmo.",null]
 ], 3, "O dispositivo mede a execução das compressões, não o débito espontâneo. Mantenha o algoritmo e a análise do DEA. Não acrescente pausa para pulso apenas porque a técnica melhorou."),
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
    choice('serial-ph',"Qual leitura inicial integra bicarbonato e PaCO₂ ao pH de 7,13?", [
   ["Acidemia com HCO₃⁻ e PaCO₂ alterados em sentidos que reduzem o pH.",null],
   ["Acidemia com HCO₃⁻ baixo e PaCO₂ elevada atuando como compensação.","Na acidose metabólica, a resposta respiratória esperada reduz a PaCO₂. Elevá-la para 50 tem efeito acidificante adicional, não compensatório."],
   ["Acidemia respiratória com redução de HCO₃⁻ como adaptação renal esperada.","A resposta esperada à acidose respiratória aumenta o bicarbonato. HCO₃⁻ de 16 está reduzido e acrescenta efeito acidificante."],
   ["Acidemia metabólica com PaCO₂ elevada indicando compensação renal crônica.","A PaCO₂ expressa o componente respiratório, não a compensação renal. Seu aumento piora a acidemia e não comprova cronicidade."]
 ],0,"HCO₃⁻ reduzido e PaCO₂ elevada atuam ambos no sentido acidificante. A compensação respiratória da acidose metabólica reduz PaCO₂; a compensação da acidose respiratória eleva HCO₃⁻. A próxima conta quantifica a relação."),
    {id:'serial-winter',title:'Com HCO₃⁻ 16, qual a PaCO₂ central esperada por Winter?',numeric:{value:32,tolerance:0.1,unit:'mmHg',hint:'1,5 × HCO₃⁻ + 8 (± 2)'},explanation:'1,5 × 16 + 8 = 32 mmHg; a faixa esperada é 30–34 mmHg.'},
    choice('serial-mixed',"Comparada à faixa de Winter, como interpretar a PaCO₂ inicial de 50?", [
   ["Dentro da resposta à acidose metabólica, por acompanhar a queda do bicarbonato.","Para HCO₃⁻ de 16, a faixa prevista é 30–34 mmHg. PaCO₂ de 50 está acima, e não dentro da resposta esperada."],
   ["Acima da faixa de 30–34 mmHg, indicando acidose respiratória associada.",null],
   ["Abaixo da resposta à acidose metabólica, indicando alcalose respiratória associada.","O sentido da comparação está invertido: 50 é maior que 34. Esse excesso de CO₂ indica componente de acidose, não alcalose respiratória."],
   ["Compatível com adaptação crônica isolada, pois o ânion gap não altera a ventilação.","A história não demonstra adaptação crônica, e HCO₃⁻ baixo não corresponde à compensação habitual da hipercapnia crônica isolada. A PaCO₂ supera a faixa de Winter."]
 ],1,"Winter estima 30–34 mmHg para HCO₃⁻ 16. PaCO₂ 50 está acima desse intervalo, reforçando acidose respiratória associada. O valor não é compensação nem prova cronicidade."),
    {...choice('serial-response',"Qual interpretação integra a segunda amostra à primeira?", [
   ["O processo metabólico se resolveu; o pH baixo é explicado apenas pelo componente respiratório.","O HCO₃⁻ continua em 16 e o AG permanece elevado. A melhora do pH não demonstra resolução do componente metabólico."],
   ["Surgiu alcalose respiratória adicional; qualquer PaCO₂ abaixo de 35 confirma distúrbio misto.","Na acidose metabólica, a PaCO₂ esperada pode ser inferior a 35. Aqui 32 está dentro de 30–34; o intervalo normal isolado não define outro distúrbio."],
   ["A acidose respiratória permanece; a referência fixa de 40 deve ser usada no lugar de Winter.","Comparar apenas com 40 ignora a resposta esperada ao bicarbonato baixo. A PaCO₂ de 32 está na faixa prevista por Winter nesta segunda amostra."],
   ["A resposta respiratória está na faixa prevista; a acidose metabólica permanece.",null]
 ],3,"Com HCO₃⁻ ainda em 16, a faixa prevista continua 30–34; PaCO₂ 32 é compatível. Não use apenas o intervalo normal de PaCO₂ para diagnosticar outro processo. Bicarbonato baixo e AG elevado permanecem."),
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
    choice('pea-recognition',"Qual diagnóstico resulta da combinação do traçado com o exame?", [
   ["Ritmo sinusal com circulação preservada, apesar da dificuldade de palpar pulso.","O monitor mostra organização elétrica, mas não confirma circulação. O exame não identificou pulso em até 10 segundos no adulto inconsciente com respiração anormal."],
   ["Bradicardia sintomática com pulso, tomando a atividade elétrica como evidência de débito.","Atividade elétrica não demonstra débito. Sem pulso definido, o cenário é de parada, e não de bradicardia com pulso."],
   ["Atividade elétrica sem pulso, apesar da aparência organizada do ritmo.",null],
   ["Taquicardia ventricular sem pulso, tomando a ausência de pulso como critério do ritmo.","Ausência de pulso define parada, mas não o ritmo ventricular. O traçado é organizado, estreito e a 60/min, sem características de TV."]
 ],2,"AESP combina atividade elétrica organizada e ausência de pulso. O aspecto organizado não prova circulação. Ausência de pulso também não transforma o traçado estreito a 60/min em taquicardia ventricular."),
    choice('pea-action',"Qual caminho corresponde a atividade organizada sem pulso?", [
   ["RCP e algoritmo não chocável, com suporte avançado e investigação de causas reversíveis.",null],
   ["Desfibrilação inicial e retomada de RCP, usando a ausência de pulso como indicação de choque.","Ausência de pulso não torna todo ritmo chocável. A atividade organizada deste caso caracteriza AESP, que segue o fluxo não chocável."],
   ["Atropina inicial e observação, usando o ritmo organizado como critério de bradicardia com pulso.","O algoritmo de bradicardia pressupõe pulso presente. O paciente está sem pulso e precisa de RCP e suporte avançado, não observação após atropina."],
   ["Estimulação transcutânea inicial, aguardando captura antes de iniciar compressões torácicas.","A estimulação não substitui RCP na AESP. Aguardar captura antes de comprimir deixa o paciente sem suporte circulatório."]
 ],0,"AESP não é ritmo chocável. Mantenha RCP e suporte avançado, incluindo adrenalina precocemente conforme protocolo. Nem atropina por um ritmo organizado nem estimulação substituem o atendimento de parada."),
    {...choice('pea-change',"Pulso definido e PA mensurável surgiram. Qual mudança é apropriada?", [
   ["Completar mais um ciclo de compressões, aguardando recuperação da consciência para interromper.","Pulso definido e pressão mensurável confirmam retorno da circulação neste cenário. A recuperação da consciência não é requisito para interromper compressões."],
   ["Interromper compressões e iniciar cuidados pós-parada, mantendo suporte e investigação.",null],
   ["Continuar o algoritmo não chocável, pois o traçado permanece semelhante ao da AESP.","O mesmo aspecto organizado pode existir com ou sem circulação. Agora o exame clínico confirma pulso e PA, mudando o fluxo para cuidados pós-parada."],
   ["Suspender o suporte ventilatório e a monitorização, pois pressão mensurável encerra a emergência.","Retorno da circulação não encerra o atendimento. O paciente segue inconsciente e precisa de avaliação e suporte ventilatório, hemodinâmico e monitorização."]
 ],1,"O retorno do pulso e de pressão mensurável confirma circulação neste cenário. Consciência pode não retornar imediatamente. A semelhança do traçado não justifica manter compressões, e o suporte pós-parada continua necessário."),
      update:{label:'Reavaliação clínica durante o atendimento',context:'Na pausa planejada, o profissional identifica pulso central definido e pressão arterial mensurável. O paciente continua inconsciente. O monitor, sozinho, mudou pouco.',observations:[{label:'Pulso',value:'Presente e definido'},{label:'PA',value:'104/66 mmHg'},{label:'Consciência',value:'Inconsciente'}],trace:{kind:'sinus',rate:68,description:'Atividade organizada, regular, com ondas P e complexos estreitos. A presença de circulação foi confirmada clinicamente.'}}},
  ],takeaway:'Um monitor organizado pode acompanhar AESP ou circulação presente. O exame clínico muda a conduta.',
};

export const asystoleCase: Case = {
  id:'asystole',title:'Traçado quase plano',focus:'Checagem e ritmo não chocável',
  context:'Adulto inconsciente, sem respiração normal e sem pulso definido em até 10 segundos. A equipe já iniciou RCP. Na breve pausa de análise, o traçado parece plano.',
  observations:[{label:'Pulso',value:'Não identificado'},{label:'RCP',value:'Em andamento'},{label:'Registro',value:'Precisa de checagem técnica'}],
  trace:{kind:'asystole',rate:0,description:'Linha isoelétrica esquemática, sem complexos organizados. A avaliação exige checar conexões, ganho e outra derivação.'},
  questions:[
    choice('flat-check',"Qual checagem ajuda a confirmar o ritmo sem prolongar a pausa?", [
   ["Aumentar apenas o ganho e manter a mesma derivação até aparecer atividade elétrica.","Aumentar o ganho sozinho não exclui desconexão ou problema da derivação. Esperar aparecer atividade também prolongaria desnecessariamente a pausa."],
   ["Aplicar um choque de teste e observar se surge atividade organizada no monitor.","Não se usa choque como teste diagnóstico de uma linha plana. Confirme o registro e mantenha as prioridades de RCP."],
   ["Conferir conexões e ganho e observar outra derivação, retomando RCP prontamente.",null],
   ["Obter ECG de 12 derivações antes de retomar compressões para confirmar a assistolia.","Conexões, ganho e outra derivação permitem uma checagem breve. Aguardar um ECG de 12 derivações prolonga a interrupção das compressões."]
 ],2,"Uma linha plana exige verificar registro, incluindo conexões, ganho e outra derivação. Não há indicação de choque de teste nem de prolongar a interrupção para um ECG completo."),
    {...choice('asystole-action',"Após confirmação técnica e clínica, qual fluxo deve continuar?", [
   ["Algoritmo chocável, com desfibrilação e retomada imediata de compressões após o choque.","Assistolia foi confirmada em outra derivação e o paciente está sem pulso. Esse ritmo não tem indicação de desfibrilação."],
   ["Algoritmo de bradicardia com pulso, com atropina e preparação de estimulação cardíaca.","O fluxo de bradicardia pressupõe circulação presente. Aqui a ausência de pulso e de atividade ventricular exige o atendimento de parada não chocável."],
   ["Algoritmo não chocável, com RCP, suporte avançado e tratamento de causas reversíveis.",null],
   ["Estimulação transcutânea, substituindo compressões enquanto se verifica captura elétrica.","Captura elétrica não garante circulação e estimulação transcutânea não substitui compressões na assistolia. Mantenha RCP e suporte avançado."]
 ],2,"Assistolia confirmada, sem pulso, segue o algoritmo não chocável. Mantenha RCP e suporte avançado, com adrenalina precocemente conforme protocolo. Não confunda com bradicardia com pulso ou com ritmo chocável."),
      update:{label:'Após checagem técnica',context:'Conexões e ganho estão adequados; outra derivação confirma ausência de atividade ventricular. A avaliação clínica segue sem pulso.',observations:[{label:'Pulso',value:'Ausente'},{label:'Registro',value:'Conferido em outra derivação'},{label:'RCP',value:'Retomada após análise'}]}},
  ],takeaway:'Confirme o registro e mantenha as prioridades. Assistolia e FV levam a caminhos diferentes.',
};

export const sodiumTrendCase: Case = {
  id:'sodium-trend',title:'O sódio subiu; e agora?',focus:'Reavaliação durante a correção',
  context:'Adulto com hiponatremia de duração desconhecida e convulsão recebeu atendimento inicial monitorizado por equipe experiente. Após a melhora dos sintomas, a solução hipertônica foi suspensa e o controle laboratorial continuou. As amostras usam o mesmo método.',
  observations:[{label:'Na⁺ inicial',value:'112 mmol/L'},{label:'Na⁺ após 1 hora',value:'117 mmol/L'},{label:'Evolução',value:'Convulsão cessou'}],
  questions:[
    choice('sodium-watch',"Após a resposta inicial, qual estratégia de acompanhamento é adequada?", [
   ["Acompanhar apenas sintomas, repetindo sódio se a convulsão ou a confusão reaparecer.","A elevação excessiva pode ocorrer antes de novos sintomas. Esperar recorrência da convulsão ou confusão não permite acompanhar com segurança a correção."],
   ["Acompanhar sódio seriado e diurese, ajustando o plano conforme a evolução.",null],
   ["Manter o plano inicial e repetir sódio após 24 horas, pois a hipertônica foi suspensa.","Suspender hipertônica não impede elevação adicional, especialmente se aumentar a excreção de água. Aguardar 24 horas perderia a evolução intermediária."],
   ["Seguir a elevação prevista pela fórmula, dispensando mudanças por aumento da diurese.","A fórmula não prevê perfeitamente mudanças na diurese. Um aumento importante da excreção de água pode acelerar a correção e exige reavaliação."]
 ],1,"A correção pode acelerar mesmo sem hipertônica, por mudança na excreção de água. A melhora clínica inicial e a estimativa por fórmula não substituem sódio seriado, diurese e revisão do plano."),
    {id:'sodium-delta',title:'Qual a elevação total do sódio desde o início?',numeric:{value:13,tolerance:0.1,unit:'mmol/L',hint:'Variação = Na⁺ atual − Na⁺ inicial'},explanation:'125 − 112 = 13 mmol/L em 6 horas. Conte desde o valor inicial, não apenas desde a última coleta.',
      update:{label:'Controle após 6 horas',context:'A diurese aumentou muito. Apesar da suspensão da solução hipertônica, o sódio chegou a 125 mmol/L; o paciente está mais desperto.',observations:[{label:'Na⁺ inicial',value:'112 mmol/L'},{label:'Na⁺ atual',value:'125 mmol/L'},{label:'Tempo total',value:'6 horas'},{label:'Diurese',value:'Aumento importante'}]}},
    choice('sodium-response',"Qual avaliação considera corretamente a elevação acumulada?", [
   ["Correção ainda insuficiente; manter elevação até 130 antes de reavaliar a estratégia.","O sódio já subiu 13 mmol/L em 6 horas. A meta não é atingir 130 antes de avaliar segurança; a elevação acumulada já exige intervenção especializada."],
   ["Correção excessiva; revisar imediatamente o plano com equipe experiente e monitorização.",null],
   ["Correção aceitável; contar apenas o aumento de 117 para 125 após suspender a hipertônica.","A contagem começa em 112, antes do tratamento. Suspender a hipertônica não reinicia o relógio nem zera a elevação que já ocorreu."],
   ["Correção segura pela melhora neurológica; reduzir os controles se não houver novos sintomas.","A melhora inicial não exclui lesão neurológica por correção excessiva, que pode ter manifestação tardia. Os controles e a revisão do plano continuam urgentes."]
 ],1,"A variação acumulada foi de 13 mmol/L em 6 horas, desde 112, e ultrapassa limites usuais. Não reinicie a contagem ao suspender a hipertônica nem use melhora aparente como garantia. Solicite manejo ativo especializado conforme protocolo."),
  ],takeaway:'Acompanhe a variação acumulada e o tempo. Corrigir sintomas e normalizar o exame são objetivos diferentes.',
};
