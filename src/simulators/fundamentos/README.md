# Prática guiada: fundamentos do atendimento

Cinco módulos de prática guiada, adicionados a pedido do responsável pelo site de 08 a 10/11/2026. Destinados a estudantes de Medicina, com casos fictícios, explicações e referências acessíveis na interface. Não substituem prática supervisionada ou protocolos e não certificam competência.

## Escopo

| Módulo | Casos | Abrangência |
| --- | ---: | --- |
| BLS adulto | 4 | Reconhecimento, compressões/ventilações, DEA, apneia com pulso e revezamento/qualidade; profissionais de saúde, sem pediatria ou situações especiais. |
| Gasometria | 8 | Quatro distúrbios primários, compensação, distúrbio misto e correção do ânion gap pela albumina e comparação de amostras; não avalia oxigenação. |
| ECG na emergência | 7 | Ritmos estreitos/largos, regularidade, pulso, perfusão e conduta inicial, incluindo AESP e assistolia; sem laudo de 12 derivações, diagnóstico de infarto ou prescrição. |
| Via aérea avançada | 6 | Preparação, ventilação com máscara, confirmação por capnografia, resgate e reavaliação após movimentação; sem doses ou instrução de execução de procedimentos. |
| Eletrólitos | 6 | Hipercalemia, hipocalemia/hipomagnesemia, hiponatremia sintomática, amostra hemolisada hipernatremia e sobrecorreção do sódio; sem doses ou velocidades de infusão. |

O roteiro avança pela abordagem recomendada depois que o aluno lê a explicação, inclusive quando erra. Não simula uma evolução fisiológica contínua. A revisão final mostra a resposta escolhida e a esperada, permitindo refazer o caso. Não há pontuação enviada ao professor.

## Implementação

- `main.tsx` e `styles.css`: interface comum, navegação por casos, perguntas de escolha ou numéricas, explicações e revisão. Entradas separadas em `simulators/<slug>/index.html`, isoladas do CSS da plataforma por iframe.
- Os arquivos de conteúdo definem perguntas, respostas, contexto, referências e limites. Atualizações clínicas devem ser explícitas e revistas com o autor.
- `types.ts`: cálculo de ânion gap sem potássio, correção por albumina, fórmula de Winter e comparação numérica. Aceita ponto/vírgula, com tolerância de 0,1 nas contas dos casos. Não aceita dados de pacientes nem calcula prescrições.
- Os dados de gasometria supõem amostras contemporâneas e bicarbonato sérico concordante. Valores arredondados são testados contra Henderson–Hasselbalch; os intervalos de referência são didáticos e declarados.
- `ecg-wave.ts`: traçados SVG sintéticos de seis segundos. Escala horizontal de tempo explícita, amplitude ilustrativa, sem alegação de calibração em mV. Descrição textual disponível; sem imagens de pacientes ou laudos automáticos.
- Respostas ficam apenas no estado React: trocar de caso mantém a tentativa, recarregar a página apaga tudo. Sem localStorage, telemetria, API clínica, IA ou novos dados no D1.
- Os cinco HTMLs e o bundle de conteúdo continuam privados no Worker. A interface pública do catálogo não importa os casos.

## Referências

Consultadas de 08 a 10/11/2026; links completos também nos arquivos de conteúdo:

- AHA 2025: suporte básico e avançado no adulto; Resuscitation Council UK 2025: RCP/DEA.
- ACC/AHA/ACCP/HRS 2023: fibrilação atrial.
- Difficult Airway Society 2025: via aérea difícil; PUMA e sociedades internacionais 2022: CO₂ expirado sustentado e prevenção de intubação esofágica não reconhecida.
- Merck Manual Professional: regulação e distúrbios ácido-base; painel francês de especialistas, Annals of Intensive Care 2019: acidose metabólica e ânion gap corrigido.
- UK Kidney Association 2023: hipercalemia; AAFP 2023: distúrbios do potássio.
- Society for Endocrinology 2022 e CJASN 2024: hiponatremia sintomática, reavaliação e sobrecorreção; Korean Journal of Internal Medicine 2023: hipernatremia em adultos.

## Verificação

`tests/fundamentos.test.mjs` verifica os 31 casos, alternativas/respostas, cálculos, consistência da gasometria, distinções críticas de BLS e ECG, regularidade dos traçados e valores finitos. Os testes de autenticação incluem rotas, links HTML diretos e bundle clínico. Testes de preservação continuam cobrindo os três módulos anteriores.

Validação de interface em desktop e celular inclui resposta errada comentada, avanço, conclusão, revisão, reinício, troca de caso sem perder a tentativa e vírgula decimal. Isso verifica funcionamento e coerência programável; não equivale a validação clínica independente.

## Reavaliações — 09/11/2026

- Cinco casos adicionais em `reassessment-cases.ts`: qualidade/revezamento na RCP, gasometrias seriadas, AESP com retorno de circulação, confirmação de assistolia e variação acumulada do sódio. Total por módulo: 4/8/7/6.
- `Question.update` descreve um novo momento didático. `caseStateAt` aplica apenas atualizações já alcançadas pelo cursor; voltar restaura a situação anterior. As mudanças seguem o roteiro comentado, mesmo após erro, sem modelo fisiológico nem previsão de resposta individual.
- A apresentação original é identificada como inicial. O painel atual muda com a etapa; os dados iniciais ficam disponíveis em uma seção recolhida. A revisão final preserva os dados usados em cada pergunta.
- O caso preexistente de apneia com pulso agora atualiza também o painel quando ocorre perda do pulso; perguntas, gabarito e condutas permanecem os mesmos.
- No celular, seletor completo com anterior/próximo substitui a lista horizontal; o estado da tentativa é preservado na troca. Foco acompanha o título do novo caso ou a reavaliação, para que o aluno perceba a mudança.
- Traçados locais adicionais: atividade organizada com ondas P e linha isoelétrica. Pulso nunca é inferido do desenho.
- Testes incluem ausência de antecipação de dados, restauração ao voltar, dados originais imutáveis, nova gasometria consistente e distinção entre ritmos chocáveis/não chocáveis.

## Revisão das alternativas — 09/11/2026

- Revisão solicitada pelo autor: 66 questões de múltipla escolha com quatro alternativas distintas e 12 questões de resposta numérica, nos 25 casos.
- Opções incorretas passam a representar confusões clínicas plausíveis: estabilidade versus frequência, sincronização versus desfibrilação, presença de pulso versus aspecto do monitor, compensação versus distúrbio misto e mecanismo versus urgência dos distúrbios eletrolíticos.
- Linguagem e extensão equilibradas; posições corretas distribuídas entre A, B, C e D no conteúdo. A ordem é estável durante a tentativa. As explicações abordam os principais erros de interpretação.
- Na gasometria, o exercício inicial interpreta o efeito de PaCO₂ e HCO₃⁻ sobre o pH. Em acidose metabólica, a classificação do componente metabólico vem depois do cálculo do AG, evitando perguntar por um único processo principal em um distúrbio misto.
- A deterioração do caso de amostra hemolisada ganhou sinais concretos (hipotensão e alargamento de QRS), visíveis no painel da etapa, para sustentar uma única prioridade.
- A assinatura TypeScript de `choice` exige quatro textos; os testes verificam quatro opções distintas e um gabarito válido em todas as questões. A verificação estrutural não substitui a revisão clínica do autor.

## Gabarito por alternativa — 10/11/2026

- Melhoria solicitada pelo autor: cada uma das 198 opções incorretas das 66 questões tem uma justificativa própria, ligada ao texto da alternativa. As quatro opções e os gabaritos da revisão anterior foram preservados.
- `choice` recebe quatro pares `[texto, motivo do erro]`. A correta usa `null` e sua justificativa vem de `Question.explanation`; os testes exigem três comentários distintos e completos por questão.
- `answer-feedback.tsx` apresenta “Por que sua resposta não se aplica” e “Por que a resposta correta se aplica” depois de confirmar a resposta. O mesmo componente aparece na revisão final. Acertos não exibem comentário de erro; as 12 questões numéricas mostram o resultado e a conta existente.
- Explicações de gasometria usam os valores da amostra, o AG e a faixa de Winter; etapas seriadas preservam o contexto do momento respondido. Não são calculadas a partir de dados de pacientes.
- Os testes verificam todos os comentários, a correspondência com cada opção, ausência de revelação sem resposta confirmada, apresentação de acertos/erros e valores dos exemplos de gasometria. Conferência no navegador cobre avanço, retorno, revisão, reinício e leitura no celular.
- Referências dos módulos foram mantidas e consultadas novamente. O conteúdo foi redigido para os casos fictícios; a verificação técnica e a conferência de referências não equivalem a validação clínica independente.
- Sem persistência de notas, telemetria, envio de mensagens, mudanças de acesso ou novos serviços.

## Percurso e via aérea — 10/11/2026

- Catálogo em `src/data/learning-path.ts`: BLS → ECG na emergência → RCP avançada/ACLS → choque → eletrólitos → gasometria → via aérea avançada → ventilação mecânica. Ordem sugerida, sem bloqueio de módulos por progresso.
- Novo módulo privado `/via-aerea`, com seis casos e 18 questões de quatro alternativas já comentadas. Total: 31 casos, 84 questões de escolha, 252 comentários de erro e 12 questões numéricas.
- `teaching-figures.tsx` contém seis ilustrações vetoriais originais de equipamentos e três apresentações de capnografia (persistente, ausente e perda súbita). Sem fotografias de pacientes, imagens externas ou reprodução de figuras de diretrizes.
- Capnogramas têm eixos de tempo e CO₂, descrição textual acessível e rolagem no celular. São sinais didáticos sintéticos; não predizem fisiologia. O trecho de 15 segundos não substitui a duração total de confirmação informada no caso.
- `Case.figure` e `CaseUpdate.figure` permitem mudar a imagem com a reavaliação e restaurá-la ao voltar. A revisão final mantém a imagem de cada momento.
- Testes cobrem ordem pedagógica, conteúdo e comentários, capnogramas, contexto histórico das imagens e exigência de sessão na nova rota, HTML e conteúdo clínico. A figura dos equipamentos não é uma lista completa de material nem ensina técnica manual.
