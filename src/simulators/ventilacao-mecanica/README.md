# VentilaLab

Prática individual extraída do VentilaLab original, com três casos, treino livre, modos VCV/PCV, controles, avaliações e memória entre casos. Em 10/11/2026, a pedido do autor, foram revisados o modelo e a apresentação das curvas. Casos e limites originais continuam protegidos por hash; choque e RCP permanecem fora dessa revisão.

Entrada: `/simulators/ventilacao-mecanica/index.html`. Rota: `/ventilacao-mecanica`. A plataforma exige sessão; o módulo não usa API própria, aula, slides ou sessão sincronizada.

## Curvas e unidades

`respiratory-model.ts` aplica a equação do movimento de um compartimento passivo linear: `Paw − PEEP = V/C + R × fluxo`. C em mL/cmH₂O, R em cmH₂O/(L/s), tempo em segundos; fluxo exibido em L/min. V é volume acima do equilíbrio na PEEP ajustada, não volume pulmonar absoluto. Sem esforço, vazamento, complacência do circuito, atraso de válvula ou efeitos não lineares.

- VCV: Ti = VC / fluxo; fluxo constante; pressão inclui componentes elástico e resistivo. Sem pausa inspiratória artificial. Pplat estimada não é um platô medido.
- PCV: subida linear da pressão até o alvo, seguida de pressão constante. A solução analítica da equação, incluindo a rampa, determina fluxo e volume. Se Ti for menor que a subida, o alvo não é alcançado. Com retenção, pode persistir fluxo negativo no começo da subida até a pressão superar a pressão alveolar.
- Expiração: Paw = PEEP; volume e fluxo decaem com τ = R × C (C convertido para L/cmH₂O). Sem pico expiratório arbitrário nem perda fixa de 2% de VC.
- Retenção: solução periódica estabilizada; volume residual de um ciclo passa ao seguinte. Auto-PEEP estimada = volume residual / C. VCe é o volume líquido expirado; VM = VCe × FR. Alterar parâmetros recalcula imediatamente o regime estabilizado, sem simular os ciclos de transição.
- Ajustes incompatíveis com FR: a simulação limita Ti para reservar 0,20 s de expiração, mantém os controles solicitados visíveis e avisa sobre volume/tempo efetivamente entregues. Essa é uma regra didática, não uma implementação de um ventilador comercial. A avaliação não aprova essa combinação.

`waveform-monitor.tsx` usa relógio único, escalas numéricas adaptadas à amplitude, janelas de 6/12/24 s e congelamento simultâneo. Alterar um controle recalcula inclusive as curvas congeladas. Preferência por movimento reduzido inicia com curvas congeladas. Todas as curvas têm descrição textual e os valores permanecem disponíveis em texto.

As estimativas de SpO₂/PaCO₂ e metas de avaliação dos casos permanecem heurísticas didáticas do módulo original; não constituem previsão fisiológica validada. Não usar para ajustar ventiladores reais.

## Referências consultadas

- Chatburn RL. The Complexities of Mechanical Ventilation: Toppling the Tower of Babel. Respir Care. 2023;68:796–820. [Equação do movimento, constante de tempo e curvas](https://pmc.ncbi.nlm.nih.gov/articles/PMC10208993/).
- [Hamilton T1, manual oficial v3.0](https://www.hamilton-medical.com/dam/jcr%3Ae394540c-e871-48c8-9ca1-3adb567f3ab5/HAMILTON-T1_ops-manual_v3.0.x_en_usa_10103179.03.pdf). Referência de apresentação de pressão, fluxo e volume; não se reproduz a interface nem os algoritmos proprietários.

`tests/ventilation.test.mjs` verifica conservação de volume por integração, equação do movimento, continuidade do volume entre fases/ciclos, resposta à subida no PCV, expiração exponencial, retenção com frequência elevada, limites de tempo e ausência de corte pelas escalas.
