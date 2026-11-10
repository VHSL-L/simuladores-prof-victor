import { qualityCase } from './reassessment-cases';
import { choice, type LearningModule } from './types';
export const bls: LearningModule = {
  slug: 'bls', title: 'BLS · suporte básico de vida', subtitle: 'Reconhecer, pedir ajuda e agir nos primeiros minutos.',
  scope: 'Adultos, no contexto de estudantes e profissionais de saúde. Treino de decisões: não mede habilidade manual nem substitui prática supervisionada em manequim. Não inclui pediatria, afogamento ou situações especiais.',
  objectives: ['Reconhecer parada e respiração agônica.', 'Priorizar compressões e usar o DEA com segurança.', 'Distinguir parada respiratória com pulso de parada cardíaca.'],
  cases: [
    { id: 'collapse', title: 'Colapso na recepção', focus: 'Reconhecimento e RCP', context: 'Um adulto de 58 anos cai diante de você na recepção de uma clínica. Há outra pessoa disponível para ajudar e um DEA no prédio. Você é o profissional de saúde que inicia o atendimento.', observations: [{label:'Local',value:'Sem risco aparente'}, {label:'Recursos',value:'Telefone, outro socorrista e DEA'}],
      questions: [
        choice('safety',"Com outro socorrista disponível, como organizar os primeiros passos?", [
   ["Confirmar segurança e resposta; completar exame primário antes de solicitar emergência e DEA.","Completar todo o exame antes de pedir ajuda atrasa a chegada dos recursos. Há outro socorrista disponível para acionar a emergência e buscar o DEA enquanto você avalia."],
   ["Confirmar segurança e resposta; delegar emergência e DEA enquanto inicia a avaliação.",null],
   ["Confirmar segurança e resposta; buscar pessoalmente o DEA enquanto o ajudante observa.","Buscar o DEA pessoalmente deixa a avaliação inicial com alguém apenas observando. Neste cenário, delegue a busca e permaneça avaliando o adulto."],
   ["Confirmar segurança e resposta; transportar à sala de atendimento antes de avaliar a respiração.","O local está seguro e não há indicação de transporte prévio. Mover o adulto antes de avaliar respiração e pulso pode atrasar o reconhecimento da parada."]
 ],1,"Use o outro socorrista para acionar ajuda e buscar o DEA sem atrasar a avaliação. Um exame prolongado, sair em busca do aparelho ou transportar sem necessidade retardam o início do atendimento."),
        choice('recognize',"Gasping e pulso não definido em até 10 segundos: qual decisão?", [
   ["Iniciar ventilação de resgate: considerar o gasping evidência de circulação ainda presente.","Gasping é respiração agônica e não comprova circulação. Ventilação isolada exige pulso definido, que não foi identificado neste caso."],
   ["Repetir a palpação por mais 20 segundos: confirmar ausência de pulso antes das compressões.","A avaliação já atingiu 10 segundos sem confirmar pulso. Prolongar a palpação acrescenta tempo sem compressões em uma possível parada."],
   ["Aguardar análise do DEA: usar o ritmo para decidir se existe indicação de iniciar compressões.","O DEA identifica ritmos para orientar o choque; ele não confirma pulso. A avaliação clínica já indica iniciar RCP enquanto o aparelho é preparado."],
   ["Iniciar RCP: a avaliação em até 10 segundos não confirmou pulso nem respiração normal.",null]
 ],3,"Gasping não é respiração normal. O profissional não deve prolongar a procura de pulso além de 10 segundos; sem confirmação, inicie RCP. O DEA não é necessário para reconhecer clinicamente a parada.", 'O adulto não responde, apresenta gasping e você não identifica pulso carotídeo com segurança em até 10 segundos.'),
        choice('compress',"Qual combinação atende às metas de compressão no adulto?", [
   ["80–100/min; pelo menos 5 cm, evitando mais de 6 cm; retorno completo.","A profundidade e o retorno estão adequados, mas 80–100 compressões/min inclui frequência abaixo da meta de 100–120/min."],
   ["100–120/min; cerca de 4 cm, evitando maior profundidade; retorno completo.","A frequência está adequada, mas cerca de 4 cm é uma profundidade insuficiente para o adulto. A meta é pelo menos 5 cm, evitando ultrapassar 6 cm."],
   ["100–120/min; pelo menos 5 cm, evitando mais de 6 cm; retorno completo.",null],
   ["120–140/min; pelo menos 5 cm, evitando mais de 6 cm; retorno completo.","A profundidade e o retorno estão adequados, mas 120–140/min inclui frequência excessiva. Comprimir mais rápido não garante melhor perfusão e pode prejudicar a técnica."]
 ],2,"As metas combinam 100–120/min, profundidade de pelo menos 5 cm sem ultrapassar 6 cm e retorno completo. Frequência inadequada ou profundidade reduzida não é compensada pelos demais parâmetros."),
        choice('ventilate',"Dois socorristas treinados, adulto e ausência de via aérea avançada: qual padrão?", [
   ["15 compressões para 2 ventilações, com elevação visível do tórax.","A presença de dois socorristas não muda a relação para 15:2 no adulto. Sem via aérea avançada, o padrão deste roteiro é 30:2."],
   ["Compressões contínuas e 1 ventilação a cada 6 segundos, sem pausas.","O esquema de compressões contínuas com ventilação assíncrona pressupõe via aérea avançada neste algoritmo. Ela está ausente no cenário apresentado."],
   ["30 compressões para 2 ventilações, com elevação visível do tórax.",null],
   ["30 compressões para 2 ventilações, insuflando até a expansão máxima do tórax.","A relação 30:2 está correta, mas expansão máxima é ventilação excessiva. O objetivo é apenas a elevação visível do tórax."]
 ],2,"Neste cenário adulto sem via aérea avançada, use 30:2. Cada ventilação dura cerca de 1 segundo e produz elevação visível, sem excesso. A relação 15:2 pertence a outros contextos; o fluxo com via aérea avançada não se aplica aqui."),
      ], takeaway:'Reconhecer e começar importa. O exercício termina com a RCP em andamento; não implica retorno da circulação.' },
    { id:'aed', title:'O DEA chegou', focus:'Desfibrilação e continuidade', context:'Você assumiu um adulto em parada reconhecida. A emergência já foi acionada; outro socorrista realiza RCP. O DEA chega com pás adesivas disponíveis.', observations:[{label:'Pulso',value:'Ausente na avaliação inicial'},{label:'Atendimento',value:'RCP em andamento'}],
      questions:[
        choice('apply',"Como integrar o DEA enquanto outro socorrista comprime?", [
   ["Interromper compressões desde a abertura do aparelho até concluir aplicação e análise.","Abrir o aparelho e preparar as pás não exige uma pausa contínua nas compressões. Reserve a interrupção para a análise e o choque conforme os comandos."],
   ["Completar mais um ciclo de 2 minutos antes de ligar o aparelho e aplicar as pás.","O DEA já está disponível. Esperar mais um ciclo completo adia a identificação e o tratamento de um possível ritmo chocável."],
   ["Aplicar as pás mantendo compressões também durante a análise automática do ritmo.","As compressões durante a análise podem gerar artefatos. Mantenha-as durante a preparação quando possível, mas afaste todos quando o aparelho analisar."],
   ["Ligar e aplicar as pás mantendo compressões quando possível; afastar todos para a análise.",null]
 ],3,"Prepare o DEA rapidamente e reduza as pausas. Não espere um novo ciclo completo; as compressões podem continuar durante a preparação, mas devem parar para a análise conforme os comandos do aparelho."),
        choice('shock',"O DEA recomenda choque. Qual checagem deve preceder sua aplicação?", [
   ["Confirmar visual e verbalmente que ninguém toca no paciente antes de acionar o choque.",null],
   ["Confirmar apenas que o compressor retirou as mãos, mantendo a ventilação manual durante o choque.","Retirar apenas as mãos do compressor não basta. Quem ventila ou mantém qualquer outro contato também precisa se afastar antes da descarga."],
   ["Palpar o pulso antes de cada choque recomendado, retomando os comandos após essa avaliação.","Sem novos sinais de vida, uma palpação rotineira antes do choque recomendado cria atraso. A checagem imediata é garantir que ninguém esteja tocando no paciente."],
   ["Solicitar uma segunda análise do DEA para confirmar a indicação antes de aplicar o choque.","O DEA já analisou e recomendou o choque. Repetir a análise sem motivo acrescenta atraso à desfibrilação."]
 ],0,"Todos devem estar afastados na análise e no choque. Não acrescente uma checagem rotineira de pulso ou outra análise que atrase a indicação do DEA."),
        choice('resume',"Sem novos sinais de vida após o choque, qual o próximo passo?", [
   ["Retomar RCP por cerca de 2 minutos até a próxima análise orientada pelo DEA.",null],
   ["Checar o pulso imediatamente após o choque antes de decidir sobre nova RCP.","A aplicação do choque não exige checagem rotineira imediata de pulso. Na ausência de novos sinais de vida, retome compressões sem essa pausa."],
   ["Solicitar nova análise imediatamente após o choque antes de reiniciar compressões.","Uma nova análise logo após o choque prolonga o tempo sem compressões. O DEA orientará a reavaliação depois do ciclo de RCP."],
   ["Oferecer apenas ventilações após o choque até o DEA indicar nova análise.","O choque não comprova retorno da circulação. Sem sinais de vida, ventilação isolada deixa o paciente sem suporte circulatório."]
 ],0,"Retome compressões imediatamente, sem checagem rotineira de pulso logo após o choque. O choque não garante circulação; não troque a RCP por ventilação isolada na ausência de sinais de retorno."),
        choice('no-shock',"O DEA diz “choque não indicado” e o adulto permanece sem sinais de vida. Como seguir?", [
   ["Retomar RCP e seguir os comandos do DEA, mantendo vigilância para mudança clínica.",null],
   ["Passar à ventilação de resgate, atribuindo a ausência de indicação de choque a pulso presente.","“Choque não indicado” descreve o ritmo, não a presença de pulso. AESP e assistolia também cursam com parada e precisam de compressões."],
   ["Pedir nova análise antes de reiniciar RCP, buscando confirmar o resultado não chocável.","O aparelho já informou um ritmo não chocável. Repetir a análise antes de retomar RCP acrescenta uma pausa sem benefício neste cenário."],
   ["Suspender compressões e observar a respiração até a chegada do suporte avançado.","O adulto continua sem sinais de vida. A chegada do suporte avançado não deve ser aguardada com compressões suspensas."]
 ],0,"Um ritmo não chocável pode acompanhar uma parada. A mensagem do DEA não confirma pulso; mantenha RCP na ausência de sinais de vida e siga o atendimento."),
      ], takeaway:'Choque é uma etapa do atendimento; as compressões continuam sendo essenciais antes e depois dele.' },
    { id:'respiratory', title:'Não respira, mas tem pulso', focus:'Ventilação de resgate', context:'Após um procedimento, um adulto fica inconsciente e apneico. A cena está segura, a equipe de emergência foi acionada e a bolsa-válvula-máscara está disponível. Há pulso carotídeo definido, 72/min. A equipe investiga a causa em paralelo.', observations:[{label:'Respiração',value:'Ausente'},{label:'Pulso',value:'Presente e definido'},{label:'Via aérea avançada',value:'Ausente'}],
      questions:[
        choice('rescue',"Apneia com pulso definido no adulto: qual suporte ventilatório inicial?", [
   ["1 ventilação a cada 3 segundos, com elevação visível do tórax.","Uma ventilação a cada 3 segundos equivale a 20/min, acima da frequência recomendada para este adulto com pulso."],
   ["1 ventilação a cada 10 segundos, com elevação visível do tórax.","Uma ventilação a cada 10 segundos fornece apenas 6/min, abaixo da frequência recomendada para este adulto apneico com pulso."],
   ["1 ventilação a cada 6 segundos, com elevação visível do tórax.",null],
   ["2 ventilações após cada 30 compressões, com elevação visível do tórax.","O pulso está definido em 72/min. O padrão 30:2 acrescentaria compressões sem indicação no momento; o suporte necessário é ventilatório."]
 ],2,"Com pulso definido e ausência de respiração adequada, forneça 10 ventilações/min, aproximadamente uma a cada 6 segundos. Não há indicação de compressões neste momento. Evite ventilação insuficiente ou excessiva."),
        choice('reassess',"Durante a ventilação de resgate, qual reavaliação está indicada?", [
   ["Observar a eficácia ventilatória e checar pulso apenas se o monitor mudar de ritmo.","Um ritmo organizado pode permanecer no monitor mesmo após a perda da circulação. A checagem de pulso não deve depender apenas de mudança elétrica."],
   ["Observar a oximetria e usar saturação normal para dispensar novas avaliações de pulso.","A oximetria não confirma que o pulso continua presente. Mesmo uma leitura aparentemente normal não dispensa a reavaliação clínica."],
   ["Observar o monitor e interromper cada ventilação para uma nova palpação do pulso.","Parar a cada ventilação para palpar o pulso interrompe repetidamente o suporte. A rechecagem programada é aproximadamente a cada 2 minutos."],
   ["Observar a eficácia ventilatória e checar pulso aproximadamente a cada 2 minutos.",null]
 ],3,"Acompanhe eficácia e resposta, com rechecagem de pulso aproximadamente a cada 2 minutos. O monitor ou a oximetria não substituem o exame clínico, mas interrupções a cada ventilação também não são indicadas."),
        {...choice('loss',"Na reavaliação, não há pulso definido: qual mudança imediata?", [
   ["Aumentar a frequência de ventilação e reavaliar pulso após mais 2 minutos.","Agora não há pulso definido. Aumentar apenas a ventilação não oferece suporte circulatório e adia o início das compressões."],
   ["Manter ventilação isolada até confirmar o ritmo no monitor.","A indicação de RCP é clínica e já está presente. Esperar o monitor mantendo apenas ventilações prolonga o tempo sem suporte circulatório."],
   ["Iniciar RCP e usar o DEA assim que disponível.",null],
   ["Aplicar o DEA e aguardar a análise antes de iniciar compressões.","O DEA deve ser incorporado rapidamente, mas sua análise não é pré-requisito para começar RCP diante de ausência de pulso e respiração normal."]
 ],2,"A perda do pulso muda o caminho para parada: inicie compressões e ventilações e incorpore o DEA rapidamente. Não espere monitorização ou resposta a mais ventilações para começar RCP.", 'Na reavaliação, não há pulso definido em até 10 segundos e o adulto segue sem respirar normalmente.'),
          update:{label:'Reavaliação · perda do pulso',context:'O adulto continua apneico. Na checagem, não há pulso central definido em até 10 segundos.',observations:[{label:'Respiração',value:'Ausente'},{label:'Pulso',value:'Não identificado em até 10 s'},{label:'DEA',value:'Solicitado'}]}},
      ], takeaway:'Pulso presente e pulso ausente levam a caminhos diferentes. A reavaliação permite perceber a mudança.' },
    qualityCase,
  ],
  references:[{title:'AHA 2025 · Suporte básico de vida no adulto',url:'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support'},{title:'Resuscitation Council UK 2025 · Qualidade da RCP e DEA',url:'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines'}],
};
