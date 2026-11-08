# Prática guiada: fundamentos do atendimento

Quatro módulos originais, adicionados a pedido do responsável pelo site em 08/11/2026. Destinados a estudantes de Medicina, com casos fictícios, explicações e referências acessíveis na interface. Não substituem prática supervisionada ou protocolos e não certificam competência.

## Escopo

| Módulo | Casos | Abrangência |
| --- | ---: | --- |
| BLS adulto | 3 | Reconhecimento, compressões/ventilações, DEA e apneia com pulso; profissionais de saúde, sem pediatria ou situações especiais. |
| Gasometria | 7 | Quatro distúrbios primários, compensação, distúrbio misto e correção do ânion gap pela albumina; não avalia oxigenação. |
| ECG na emergência | 5 | Ritmos estreitos/largos, regularidade, pulso, perfusão e conduta inicial; sem laudo de 12 derivações, diagnóstico de infarto ou prescrição. |
| Eletrólitos | 5 | Hipercalemia, hipocalemia/hipomagnesemia, hiponatremia sintomática, amostra hemolisada e hipernatremia; sem doses ou velocidades de infusão. |

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

Consultadas em 08/11/2026; links completos também nos arquivos de conteúdo:

- AHA 2025: suporte básico e avançado no adulto; Resuscitation Council UK 2025: RCP/DEA.
- ACC/AHA/ACCP/HRS 2023: fibrilação atrial.
- Merck Manual Professional: regulação e distúrbios ácido-base; painel francês de especialistas, Annals of Intensive Care 2019: acidose metabólica e ânion gap corrigido.
- UK Kidney Association 2023: hipercalemia; AAFP 2023: distúrbios do potássio.
- Society for Endocrinology: emergência por hiponatremia sintomática; Korean Journal of Internal Medicine 2023: hipernatremia em adultos.

## Verificação

`tests/fundamentos.test.mjs` verifica os 20 casos, alternativas/respostas, cálculos, consistência da gasometria, distinções críticas de BLS e ECG, regularidade dos traçados e valores finitos. Os testes de autenticação incluem rotas, links HTML diretos e bundle clínico. Testes de preservação continuam cobrindo os três módulos anteriores.

Validação de interface em desktop e celular inclui resposta errada comentada, avanço, conclusão, revisão, reinício, troca de caso sem perder a tentativa e vírgula decimal. Isso verifica funcionamento e coerência programável; não equivale a validação clínica independente.
