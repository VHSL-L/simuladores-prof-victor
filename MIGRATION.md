# Registro de migração

## Percurso e via aérea avançada — 10/11/2026

- BLS abre o percurso, seguido por ECG, RCP avançada/ACLS, choque, eletrólitos, gasometria, via aérea e ventilação mecânica. Catálogo continua permitindo acesso direto a qualquer módulo.
- Novo módulo de via aérea: seis casos, 18 questões e imagens originais de equipamentos e capnografia. Roteiros incluem preparo, máscara, confirmação, ausência de CO₂, resgate e transporte.
- Imagens acompanham a etapa e aparecem no contexto correto na revisão. A nova rota e os arquivos continuam exigindo sessão; apenas o destino pós-login foi ampliado para incluir o módulo.

## Gabarito por alternativa — 10/11/2026

- As 66 questões de múltipla escolha passaram a comentar especificamente a alternativa incorreta confirmada e a justificar a correta, também na revisão final. São 198 comentários de erros possíveis.
- Comentários aparecem apenas após a confirmação. Acertos recebem a explicação do gabarito; questões numéricas mantêm a demonstração do cálculo.
- Preservados enunciados, alternativas, gabaritos, 25 casos e os três simuladores originais. Nenhuma mudança de autenticação, dados de alunos ou serviços externos.

## Revisão de questões — 09/11/2026

- A pedido do autor, alternativas dos quatro módulos de fundamentos revisadas: 66 questões com quatro opções e 12 cálculos numéricos.
- Substituídas opções obviamente incorretas por erros de raciocínio plausíveis, com linguagem paralela, extensão equilibrada e explicações ajustadas.
- Refinados os enunciados de gasometria para distinguir o componente metabólico em casos mistos; o caso de amostra hemolisada explicita os dados da deterioração.
- Nenhum caso removido, nenhuma mudança nos três simuladores originais, na autenticação ou nos dados de alunos.

## Reavaliação dos casos — 09/11/2026

- Biblioteca de fundamentos ampliada para 25 casos (BLS 4, gasometria 8, ECG na emergência 7, eletrólitos 6).
- Dados de sinais, laboratório e traçados acompanham etapas explícitas de reavaliação; voltar, trocar de caso e reiniciar preservam a coerência do momento apresentado. A revisão final mostra os dados utilizados na pergunta.
- Novo seletor para celular, com anterior/próximo e identificação do caso atual.
- Novos casos, referências e limites registrados no README de fundamentos. Simuladores originais, autenticação, banco e permissões preservados.

## Ampliação da biblioteca — 08/11/2026

- Quatro módulos novos, solicitados pelo autor: BLS (3 casos), gasometria (7), ECG na emergência (5) e eletrólitos (5).
- Conteúdo próprio em `src/simulators/fundamentos`; fontes e limites documentados no README dessa pasta e na interface de cada módulo. Não são cópias de cursos nem certificações.
- Entradas HTML independentes, com interface compartilhada, respostas comentadas, revisão e reinício por caso. Respostas permanecem apenas na memória da aba, sem API, banco ou histórico do aluno.
- ECG usa traçados SVG esquemáticos de seis segundos, gerados localmente. Gasometria confere valores, tolerância numérica, coerência de Henderson–Hasselbalch e compensação.
- As quatro novas rotas e seus HTML/JS exigem a mesma sessão dos módulos anteriores. Nenhuma migração de banco ou mudança de permissões Google.
- Os três simuladores originais permanecem preservados pelos testes de hashes. O catálogo passa a sete módulos.
- Validação: build e 35 testes aprovados; navegação, respostas corretas/incorretas, conclusão, reinício, retenção entre casos e entradas decimais conferidos na prévia local. Layout de celular ajustado e conferido a 390 px, sem alargamento da página.

## RCP

- Fonte: cópia do simulador `megacode-prof-victor-sequencial.html` disponível no contexto local.
- Estratégia: preservação integral do documento executável dentro de `public/simulators/rcp/index.html`.
- Adaptação externa: inclusão em uma rota própria por meio de um frame local responsivo.
- Lógica clínica: preservada, com uma correção solicitada pelo autor na cópia integrada para impedir repetição de epinefrina em ciclos consecutivos de 2 minutos.
- Fluxo, alternativas, feedbacks, casos, estados, traçados e resultado final: preservados.
- Timers: o simulador importado não usa temporizador.
- Áudio: o simulador importado não usa sons.
- API: nenhuma.
- Dependência do GPT Sites: nenhuma após a importação.

### Ajuste validado pelo autor

- Epinefrina: a simulação agora registra a dose anterior, exige intervalo de 3–5 minutos e apresenta a opção de não repetir a medicação quando o ciclo seguinte ocorre após apenas 2 minutos.

## Choque — importado em 30/08/2026

- Fonte local: projeto `simulador-choque`, site original Sala de Choque do Prof. Victor.
- `app/page.tsx`, `app/globals.css` e `app/crt.css` copiados integralmente para `src/simulators/choque`.
- Cinco casos, condutas, pré-requisitos, variações, deterioração, pontuação, feedback, desfechos e `sessionStorage` mantidos.
- A simulação avança por decisões; não há temporizador contínuo nem áudio.
- Sem API clínica, backend ou dependência de GPT Sites. As fontes DM Sans e IBM Plex Mono continuam usando Google Fonts, como no original; há fallback local.
- O invólucro Next/vinext foi substituído por uma entrada estática Vite. CSS isolado em iframe da própria plataforma.
- Observação preexistente, não corrigida nesta migração: o relógio formata as unidades de tempo como `00:18`, enquanto feedback e desfecho descrevem o mesmo total como 18 minutos. O comportamento e a pontuação foram preservados.

## Ventilação Mecânica — importado em 30/08/2026

- Fonte local: VentilaLab, projeto da tarefa `Criar simulador VCV didático`.
- Extraído o módulo completo `VentilatorSimulator` e seus tipos, cenários, constantes, funções, componentes e hooks; nenhuma fórmula, avaliação, parâmetro, curva, alerta ou estado foi alterado.
- Três casos e treino livre; modos VCV e PCV; restaurar, avaliação de ajustes e memória de trabalho entre casos preservados.
- A página abre diretamente o modo de prática individual existente. **Aulas, slides, notas/PDF e sessão professor–aluno não foram importados**, conforme solicitado.
- A API `/api/session`, QRCode e jsPDF pertencem somente à aula e não são dependências da prática individual.
- CSS original integralmente preservado, incluindo Tailwind 4.2.1. A configuração Next/font foi substituída por CSS e arquivos Geist Mono copiados do build original, com licença OFL.
- Animações de curvas continuam por `requestAnimationFrame`, com `ResizeObserver` para o canvas. Não há sons ou API clínica.

## Integração e preservação

- Entradas Vite independentes em `simulators/choque/index.html` e `simulators/ventilacao-mecanica/index.html`.
- Rotas públicas `/choque` e `/ventilacao-mecanica`, com navegação comum e opção de abrir o simulador em tela própria.
- Frames dos novos módulos têm altura estável e rolagem própria: isso evita crescimento recursivo causado pelo uso original de `100vh`. O frame RCP mantém o comportamento anterior.
- `tests/imports.test.mjs` fixa hashes dos arquivos originais e do núcleo extraído para detectar alterações acidentais, além de verificar métricas, curvas e assets.
- Projetos originais não modificados. Nenhuma aula, credencial, banco, login ou API de IA foi incorporada.
- Validação na Cloudflare: removida a regra curinga de rewrite ignorada pelo serviço por risco de loop. Usado o fallback SPA nativo, preservando prioridade dos HTMLs e assets dos simuladores. Nenhuma lógica clínica alterada.
