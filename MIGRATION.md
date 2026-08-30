# Registro de migração

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
