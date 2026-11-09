# Prática guiada: fundamentos do atendimento

Quatro módulos originais, adicionados a pedido do responsável pelo site em 08/11/2026. Destinados a estudantes de Medicina, com casos fictícios, explicações e referências acessíveis na interface. Não substituem prática supervisionada ou protocolos e não certificam competência.

## Escopo

| Módulo | Casos | Abrangência |
| --- | ---: | --- |
| BLS adulto | 4 | Reconhecimento, compressões/ventilações, DEA, apneia com pulso e revezamento/qualidade; profissionais de saúde, sem pediatria ou situações especiais. |
| Gasometria | 8 | Quatro distúrbios primários, compensação, distúrbio misto e correção do ânion gap pela albumina e comparação de amostras; não avalia oxigenação. |
| ECG na emergência | 7 | Ritmos estreitos/largos, regularidade, pulso, perfusão e conduta inicial, incluindo AESP e assistolia; sem laudo de 12 derivações, diagnóstico de infarto ou prescrição. |
| Eletrólitos | 6 | Hipercalemia, hipocalemia/hipomagnesemia, hiponatremia sintomática, amostra hemolisada hipernatremia e sobrecorreção do sódio; sem doses ou velocidades de infusão. |

O roteiro avança pela abordagem recomendada depois que o aluno lê a explicação, inclusive quando erra. Não simula uma evolução fisiológica contínua. A revisão final mostra a resposta escolhida e a esperada, permitindo refazer o caso. Não há pontuação enviada ao professor.

## Implementação

- `main.tsx` e `styles.css`: interface comum, navegação por casos, perguntas de escolha ou numéricas, explicações e revisão. Entradas separadas em `simulators/<slug>/index.html`, isoladas do CSS da plataforma por iframe.
- Os quatro arquivos de conteúdo definem perguntas, respostas, contexto, referências e limites. Atualizações clínicas devem ser explícitas e revistas com o autor.
- `types.ts`: cálculo de ânion gap sem potássio, correção por albumina, fórmula de Winter e comparação numérica. Aceita ponto/vírgula, com tolerância de 0,1 nas contas dos casos. Não aceita dados de pacientes nem calcula prescrições.
- Os dados de gasometria supõem amostras contemporâneas e bicarbonato sérico concordante. Valores arredondados são testados contra Henderson–Hasselbalch; os intervalos de referência são didáticos e declarados.
- `ecg-wave.ts`: traçados SVG sintéticos de seis segundos. Escala horizontal de tempo explícita, amplitude ilustrativa, sem alegação de calibração em mV. Descrição textual disponível; sem imagens de pacientes ou laudos automáticos.
- Respostas ficam apenas no estado React: trocar de caso mantém a tentativa, recarregar a página apaga tudo. Sem localStorage, telemetria, API clínica, IA ou novos dados no D1.
- Os quatro HTMLs e o bundle de conteúdo continuam privados no Worker. A interface pública do catálogo não importa os casos.

## Referências

Consultadas em 08 e 09/11/2026; links completos também nos arquivos de conteúdo:

- AHA 2025: suporte básico e avançado no adulto; Resuscitation Council UK 2025: RCP/DEA.
- ACC/AHA/ACCP/HRS 2023: fibrilação atrial.
- Merck Manual Professional: regulação e distúrbios ácido-base; painel francês de especialistas, Annals of Intensive Care 2019: acidose metabólica e ânion gap corrigido.
- UK Kidney Association 2023: hipercalemia; AAFP 2023: distúrbios do potássio.
- Society for Endocrinology 2022 e CJASN 2024: hiponatremia sintomática, reavaliação e sobrecorreção; Korean Journal of Internal Medicine 2023: hipernatremia em adultos.

## Verificação

`tests/fundamentos.test.mjs` verifica os 25 casos, alternativas/respostas, cálculos, consistência da gasometria, distinções críticas de BLS e ECG, regularidade dos traçados e valores finitos. Os testes de autenticação incluem rotas, links HTML diretos e bundle clínico. Testes de preservação continuam cobrindo os três módulos anteriores.

Validação de interface em desktop e celular inclui resposta errada comentada, avanço, conclusão, revisão, reinício, troca de caso sem perder a tentativa e vírgula decimal. Isso verifica funcionamento e coerência programável; não equivale a validação clínica independente.

## Reavaliações — 09/11/2026

- Cinco casos adicionais em `reassessment-cases.ts`: qualidade/revezamento na RCP, gasometrias seriadas, AESP com retorno de circulação, confirmação de assistolia e variação acumulada do sódio. Total por módulo: 4/8/7/6.
- `Question.update` descreve um novo momento didático. `caseStateAt` aplica apenas atualizações já alcançadas pelo cursor; voltar restaura a situação anterior. As mudanças seguem o roteiro comentado, mesmo após erro, sem modelo fisiológico nem previsão de resposta individual.
- A apresentação original é identificada como inicial. O painel atual muda com a etapa; os dados iniciais ficam disponíveis em uma seção recolhida. A revisão final preserva os dados usados em cada pergunta.
- O caso preexistente de apneia com pulso agora atualiza também o painel quando ocorre perda do pulso; perguntas, gabarito e condutas permanecem os mesmos.
- No celular, seletor completo com anterior/próximo substitui a lista horizontal; o estado da tentativa é preservado na troca. Foco acompanha o título do novo caso ou a reavaliação, para que o aluno perceba a mudança.
- Traçados locais adicionais: atividade organizada com ondas P e linha isoelétrica. Pulso nunca é inferido do desenho.
- Testes incluem ausência de antecipação de dados, restauração ao voltar, dados originais imutáveis, nova gasometria consistente e distinção entre ritmos chocáveis/não chocáveis.
