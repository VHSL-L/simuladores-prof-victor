import { peaCase, asystoleCase } from './reassessment-cases';
import { choice, type LearningModule } from './types';
export const ecg: LearningModule = {
 slug:'ecg',title:'ECG na emergência',subtitle:'Reconheça o ritmo e olhe para o paciente.',
 scope:'Ritmos e abordagem inicial no pronto atendimento. Traçados esquemáticos de uma derivação, gerados para ensino; não equivalem a ECG de 12 derivações. Não abrange diagnóstico de infarto, laudo cardiológico ou prescrição individual.',
 objectives:['Distinguir ritmo regular/irregular e QRS estreito/largo.','Relacionar pulso, consciência e perfusão à urgência.','Diferenciar cardioversão sincronizada de desfibrilação.'],
 cases:[
 {id:'narrow',title:'Palpitação súbita',focus:'Leitura inicial do traçado',context:'Adulto de 32 anos relata palpitação de início abrupto. Está orientado, sem dor torácica, dispneia ou sinais de choque. Há pulso.',observations:[{label:'PA',value:'122/76 mmHg'},{label:'SpO₂',value:'98% em ar ambiente'},{label:'Frequência',value:'180/min'},{label:'QRS',value:'80 ms'}],trace:{kind:'narrow',rate:180,description:'Complexos estreitos com intervalos RR regulares; ondas P não são claramente distinguíveis.'},questions:[
 choice('pattern',"Como descrever frequência, regularidade e largura do QRS?", [
   ["Taquicardia irregular de QRS estreito.","Os intervalos entre os complexos estão regulares. O QRS é estreito, mas a classificação como irregular não corresponde ao traçado."],
   ["Taquicardia regular de QRS largo.","A regularidade foi reconhecida, porém o QRS informado mede 80 ms. Ele é estreito; QRS largo tem duração de pelo menos 120 ms."],
   ["Taquicardia irregular de QRS largo.","Há dois pontos discordantes: os intervalos RR são regulares e o QRS mede 80 ms, portanto é estreito."],
   ["Taquicardia regular de QRS estreito.",null]
 ],3,"Os intervalos RR são regulares e o QRS informado tem 80 ms, abaixo de 120 ms. A descrição organiza a abordagem, mas não identifica sozinha o mecanismo da taquicardia."),
 choice('stability',"Qual interpretação da estabilidade é sustentada pelo caso?", [
   ["Instabilidade pela frequência: 180/min indica baixo débito mesmo com PA normal.","A frequência de 180/min exige avaliação, mas não demonstra baixo débito por si só. Neste caso, não há sinais de choque, alteração mental ou outros sinais de instabilidade."],
   ["Sem instabilidade identificada: perfusão e estado mental estão preservados.",null],
   ["Instabilidade pelo início súbito: a instalação abrupta indica repercussão hemodinâmica.","O início abrupto ajuda a caracterizar a história da arritmia. Ele não substitui a avaliação de perfusão e não demonstra instabilidade hemodinâmica."],
   ["Estabilidade indeterminada: só pode ser classificada depois de reduzir a frequência.","A estabilidade é avaliada antes e durante o tratamento pelos sinais clínicos disponíveis. Não é preciso reduzir a frequência para reconhecer a perfusão preservada neste momento."]
 ],1,"A frequência e o início abrupto não bastam para definir instabilidade. Procure hipotensão, alteração mental, choque, desconforto isquêmico ou insuficiência cardíaca aguda atribuíveis ao ritmo; reavalie continuamente."),
 choice('approach',"Com monitorização e acesso venoso em curso, qual abordagem inicial é mais adequada?", [
   ["Realizar cardioversão sincronizada de início, tomando a frequência de 180/min como critério.","O paciente não apresenta repercussão hemodinâmica identificada. A frequência isolada não exige cardioversão imediata como primeira medida neste cenário."],
   ["Adotar controle de frequência da fibrilação atrial, tomando o QRS estreito como critério.","QRS estreito não identifica fibrilação atrial. O ritmo apresentado é regular, enquanto a FA costuma produzir intervalos RR irregularmente irregulares."],
   ["Obter ECG de 12 derivações e tentar manobra vagal apropriada ao ritmo regular estreito.",null],
   ["Iniciar o fluxo de taquicardia larga com antiarrítmico, tomando o início súbito como critério.","O início súbito não define a largura dos complexos. O QRS informado tem 80 ms, portanto o fluxo de taquicardia larga não corresponde aos dados."]
 ],2,"A ausência de repercussão permite caracterizar o ritmo e tentar manobras vagais quando apropriadas. QRS estreito não implica FA; início abrupto não implica taquicardia larga. Cardioversão imediata não é exigida só pela frequência.")],takeaway:'Primeiro descreva o ritmo e a estabilidade. Frequência alta isolada não define a estratégia elétrica.'},
 {id:'af',title:'Pulso irregular',focus:'Regularidade e atividade atrial',context:'Adulto de 71 anos chega com palpitações. Está orientado, sem dor, edema pulmonar ou sinais de má perfusão. A duração do episódio é incerta.',observations:[{label:'PA',value:'118/72 mmHg'},{label:'Pulso',value:'Presente, irregular'},{label:'QRS',value:'90 ms'}],trace:{kind:'af',rate:140,description:'Intervalos RR sem padrão regular, sem ondas P consistentes, com complexos estreitos.'},questions:[
 choice('af-pattern',"Qual hipótese melhor explica a irregularidade e a atividade atrial?", [
   ["Flutter atrial com condução atrioventricular fixa em 2:1.","Condução fixa em 2:1 tenderia a gerar resposta ventricular regular. O traçado apresentado tem intervalos RR sem padrão regular."],
   ["Fibrilação atrial com resposta ventricular rápida.",null],
   ["Taquicardia atrial multifocal com ondas P de diferentes morfologias.","Taquicardia atrial multifocal requer ondas P identificáveis com diferentes morfologias. Aqui não há ondas P organizadas consistentes."],
   ["Taquicardia por reentrada nodal com resposta ventricular regular.","A reentrada nodal com resposta ventricular regular não explica os intervalos RR irregularmente irregulares observados."]
 ],1,"RR irregularmente irregular e ausência de ondas P organizadas favorecem FA. Flutter com condução fixa e reentrada nodal tendem a ser regulares; taquicardia atrial multifocal exige ondas P discerníveis de diferentes morfologias. Confirme em registro adequado."),
 choice('af-plan',"Antes de escolher controle de ritmo neste paciente estável, o que é essencial?", [
   ["Assumir início recente a partir das palpitações e indicar cardioversão pelo sintoma.","O início percebido das palpitações pode ser posterior ao início da FA. Com duração incerta e estabilidade, essa suposição não basta para indicar cardioversão."],
   ["Priorizar cardioversão pela resposta rápida e avaliar risco tromboembólico após a reversão.","A resposta rápida isolada não justifica deixar o risco tromboembólico para depois da reversão em um paciente estável com duração incerta."],
   ["Integrar duração provável, risco tromboembólico, desencadeantes e função cardíaca.",null],
   ["Aplicar o mesmo fluxo da taquicardia regular estreita porque o QRS tem duração normal.","A duração normal do QRS não torna os ritmos regular e irregular equivalentes. A FA exige considerar duração e risco tromboembólico, entre outros fatores."]
 ],2,"Duração incerta exige cautela antes da cardioversão eletiva. O início percebido dos sintomas pode não corresponder ao início da FA. A estabilidade permite avaliar o contexto; QRS estreito não torna os algoritmos de ritmos regulares e irregulares equivalentes.")],takeaway:'Reconhecer FA é o começo. A estabilidade e o contexto definem a abordagem; este caso não prescreve fármacos ou anticoagulação.'},
 {id:'wide',title:'Taquicardia e má perfusão',focus:'Ritmo e perfusão',context:'Adulto de 64 anos apresenta palpitação, sudorese e confusão iniciadas com a taquicardia. Há pulso central. O traçado mostra complexos largos e monomórficos.',observations:[{label:'PA',value:'76/48 mmHg'},{label:'Consciência',value:'Confuso'},{label:'Frequência',value:'180/min'},{label:'QRS',value:'160 ms'}],trace:{kind:'wide',rate:180,description:'Taquicardia regular com complexos largos de morfologia uniforme.'},questions:[
 choice('wide-pattern',"Qual classificação integra o traçado e a perfusão?", [
   ["Taquicardia regular de QRS largo, com pulso e estabilidade hemodinâmica.","O paciente tem PA 76/48 mmHg e confusão iniciadas com a taquicardia. Pulso presente não afasta essa instabilidade."],
   ["Taquicardia regular de QRS largo, com pulso e instabilidade hemodinâmica.",null],
   ["Taquicardia irregular de QRS largo, com pulso e instabilidade hemodinâmica.","Os complexos são largos, mas os intervalos RR são regulares. A classificação como irregular não corresponde ao registro."],
   ["Taquicardia regular de QRS largo, sem pulso e com indicação de fluxo de parada.","Há pulso central definido. O paciente está instável, mas ainda não preenche a condição de taquicardia sem pulso deste algoritmo."]
 ],1,"O QRS tem 160 ms, o ritmo é regular e o pulso está presente. Hipotensão e confusão iniciadas com a taquicardia indicam instabilidade; pulso presente não significa perfusão adequada."),
 choice('wide-plan',"Qual intervenção deve ser priorizada para a taquicardia monomórfica com pulso?", [
   ["Desfibrilação não sincronizada imediata; usar a hipotensão como critério de parada.","Hipotensão não equivale a ausência de pulso. Para esta taquicardia monomórfica com pulso e instabilidade, a estratégia inicial é sincronizada."],
   ["Infusão antiarrítmica inicial; reservar cardioversão para persistência após a infusão.","A hipotensão e a confusão atribuíveis ao ritmo exigem intervenção imediata. Esperar a resposta à infusão pode atrasar a cardioversão necessária."],
   ["Manobras vagais iniciais; testar origem supraventricular antes da terapia elétrica.","A investigação do mecanismo não deve preceder a estabilização neste paciente. As manobras vagais atrasariam a terapia elétrica prioritária."],
   ["Cardioversão sincronizada imediata; sedação se viável sem atrasar a intervenção.",null]
 ],3,"Neste paciente com pulso, taquicardia monomórfica e instabilidade atribuível ao ritmo, priorize cardioversão sincronizada. Infusão ou manobras diagnósticas não devem atrasá-la. A perda do pulso mudaria o fluxo para parada."),
 choice('wide-caution',"Qual conclusão sobre o mecanismo é justificável antes de um ECG completo?", [
   ["Regularidade e pulso presente favorecem origem supraventricular e afastam TV.","TV pode ser regular e ocorrer com pulso. Essas duas características não excluem origem ventricular."],
   ["Morfologia uniforme confirma TV e torna desnecessária a avaliação após estabilização.","Complexos de morfologia uniforme não provam, isoladamente, TV. A avaliação diagnóstica continua necessária após estabilizar o paciente."],
   ["TV permanece uma possibilidade; esclarecer o mecanismo não deve atrasar a estabilização.",null],
   ["QRS de 160 ms identifica aberrância e permite tratar como taquicardia estreita.","QRS de 160 ms confirma que os complexos são largos, mas não estabelece aberrância. Não é justificativa para tratá-los como QRS estreito."]
 ],2,"Regularidade, pulso e largura isoladamente não distinguem TV de outras causas de QRS largo. A instabilidade exige ação antes de completar a investigação; após estabilizar, o diagnóstico continua necessário.")],takeaway:'Taquicardia larga, monomórfica, com pulso e instabilidade: sincronizar é diferente de desfibrilar uma parada.'},
 {id:'brady',title:'Tontura e pulso lento',focus:'Frequência e sintomas',context:'Adulto de 78 anos tem tontura, confusão e extremidades frias. O pulso é definido, mas lento. A equipe está ao lado do leito.',observations:[{label:'PA',value:'80/44 mmHg'},{label:'Frequência',value:'38/min'},{label:'Pulso',value:'Presente'}],trace:{kind:'brady',rate:38,description:'Ritmo lento, regular, com onda P antes de cada complexo estreito.'},questions:[
 choice('brady-risk',"Qual conjunto demonstra repercussão clínica da bradicardia?", [
   ["Frequência de 38/min e regularidade dos intervalos, consideradas isoladamente.","A frequência baixa e a regularidade descrevem o ritmo. A repercussão é demonstrada pelos sinais de hipoperfusão, como hipotensão e confusão."],
   ["Idade de 78 anos e ondas P antes de cada QRS, consideradas isoladamente.","Idade e relação entre ondas P e QRS ajudam a contextualizar o ritmo, mas não demonstram por si sós comprometimento da perfusão."],
   ["Pulso central palpável e QRS estreito, suficientes para indicar perfusão preservada.","Pulso palpável e QRS estreito não garantem débito adequado. O paciente apresenta hipotensão, confusão e extremidades frias."],
   ["PA 80/44 mmHg, confusão e extremidades frias associadas ao pulso lento.",null]
 ],3,"Hipotensão, alteração mental e extremidades frias indicam hipoperfusão. A frequência baixa exige avaliação, mas o número, a idade ou a largura do QRS isoladamente não definem a repercussão."),
 choice('brady-plan',"Qual plano responde melhor à hipoperfusão apresentada?", [
   ["Monitorização e ECG; aguardar esclarecimento etiológico completo antes de tratar a frequência.","A investigação etiológica é necessária, mas deve ocorrer em paralelo ao suporte e ao tratamento da bradicardia com hipoperfusão."],
   ["Suporte e cardioversão sincronizada; corrigir eletricamente o ritmo lento associado à hipotensão.","Cardioversão sincronizada é uma estratégia para determinadas taquiarritmias. Não é o tratamento deste ritmo lento com pulso."],
   ["RCP e algoritmo de AESP; considerar o pulso lento insuficiente para distinguir circulação de parada.","AESP requer ausência de pulso. Aqui há pulso definido, embora a perfusão seja inadequada, e o fluxo é de bradicardia sintomática."],
   ["Suporte e causas reversíveis; algoritmo de bradicardia sintomática, com atropina quando indicada e escalonamento.",null]
 ],3,"O pulso definido afasta o fluxo de AESP neste momento, mas há comprometimento clínico. Siga o protocolo de bradicardia sintomática; se necessário, escale para estimulação ou suporte cronotrópico. Cardioversão não é a intervenção da bradicardia.")],takeaway:'Diferencie pulso lento com perfusão preservada de bradicardia com comprometimento clínico.'},
 {id:'vf',title:'Colapso diante do monitor',focus:'Ritmo de parada',context:'Um adulto torna-se inconsciente. Não respira normalmente e o profissional não identifica pulso em até 10 segundos. O monitor está conectado e o desfibrilador chega ao leito.',observations:[{label:'Pulso',value:'Não identificado'},{label:'Respiração',value:'Agônica'},{label:'Consciência',value:'Ausente'}],trace:{kind:'vf',rate:0,description:'Atividade elétrica caótica, sem complexos QRS organizados.'},questions:[
 choice('vf-pattern',"Qual ritmo melhor explica o registro sem complexos organizados?", [
   ["Fibrilação ventricular.",null],
   ["Taquicardia ventricular monomórfica sem pulso.","TV monomórfica apresenta complexos ventriculares repetitivos de morfologia semelhante. O registro mostrado é caótico, sem QRS organizados."],
   ["Atividade elétrica sem pulso com complexos estreitos.","AESP pressupõe atividade elétrica organizada sem pulso. Neste traçado não há complexos organizados."],
   ["Fibrilação atrial com resposta ventricular rápida.","Na FA, os intervalos entre QRS são irregulares, mas os complexos ventriculares ainda podem ser identificados. Aqui eles estão ausentes."]
 ],0,"FV produz atividade desorganizada sem QRS identificáveis. TV monomórfica apresenta complexos repetitivos; AESP exige atividade organizada e ausência de pulso; na FA há complexos QRS, embora irregularmente espaçados."),
 choice('vf-plan',"Com o desfibrilador disponível, qual sequência é prioritária?", [
   ["RCP e cardioversão sincronizada assim que possível; aguardar detecção de onda R.","Na FV não há onda R confiável para sincronizar a descarga. A espera pela sincronização pode impedir ou atrasar o choque."],
   ["RCP e adrenalina antes do primeiro choque; aguardar efeito para reavaliar o ritmo.","A adrenalina integra o atendimento da parada, mas não deve atrasar o primeiro choque disponível para FV."],
   ["RCP e desfibrilação não sincronizada assim que possível; retomar RCP após o choque.",null],
   ["RCP e antiarrítmico antes do primeiro choque; tentar organizar o ritmo para desfibrilar.","Antiarrítmicos não são pré-requisito para o primeiro choque na FV. Esperar que organizem o ritmo atrasa a desfibrilação prioritária."]
 ],2,"FV é chocável e não oferece onda R confiável para sincronização. Não atrase o primeiro choque disponível para administrar fármacos. Retome compressões imediatamente depois.")],takeaway:'O monitor complementa a avaliação. Sem pulso, a abordagem é de parada; no DEA, siga os comandos.'},
  peaCase, asystoleCase,
 ],
 references:[{title:'Resuscitation Council UK 2025 · Suporte avançado e ritmos não chocáveis',url:'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-advanced-life-support-guidelines'},{title:'AHA 2025 · Suporte avançado no adulto',url:'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support'},{title:'ACC/AHA/ACCP/HRS 2023 · Fibrilação atrial',url:'https://www.jacc.org/doi/10.1016/j.jacc.2023.08.017'},{title:'AHA 2025 · Algoritmos de ressuscitação',url:'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/algorithms'}],
};
