# Simuladores do Prof. Victor Hugo Sant'Ana

Plataforma web para reunir simuladores clínicos voltados ao ensino, treinamento e raciocínio em situações críticas, com acesso institucional pela conta Google da UNC.

## Biblioteca

- RCP: disponível e importado como cópia isolada do simulador original.
- Ventilação Mecânica: VentilaLab original, três casos e treino livre em VCV/PCV, sem as aulas.
- Choque: Sala de Choque original, cinco casos com decisões e desfechos.
- BLS adulto: três casos sobre reconhecimento, RCP, DEA e ventilação de resgate.
- Gasometria arterial: sete casos de interpretação ácido-base, ânion gap e compensação.
- ECG na emergência: cinco casos de ritmos, estabilidade e abordagem inicial, com traçados esquemáticos.
- Distúrbios eletrolíticos: cinco casos sobre sódio, potássio e magnésio.

Os quatro módulos novos são roteiros de prática com respostas comentadas e referências, sem registro de notas ou envio de respostas. Escopo e fontes em [fundamentos/README.md](src/simulators/fundamentos/README.md).

## Tecnologia

- React 19
- TypeScript
- Vite
- Interface estática e Cloudflare Pages Worker para autenticação, D1 e identificação pelo Google; sem API de IA
- Compatível com GitHub e Cloudflare Pages

## Instalação

Requer Node.js 22 ou superior.

```bash
npm install
```

## Desenvolvimento local

```bash
npm run dev
```

## Build de produção

```bash
npm run build
```

Os arquivos finais são gravados em `dist/`.

## Testes

```bash
npm test
```

O teste executa o build, verifica preservação do código clínico original, regras de epinefrina, métricas/curvas VCV e PCV, consistência dos novos casos e cálculos, assets da Cloudflare Pages e controle de acesso. Com a prévia local ativa, execute também `node tests/routes-smoke.mjs`. A página `/tests/mobile-preview.html` existe apenas no desenvolvimento para inspeção em frames de 390 × 844; não é publicada.

## Publicação no Cloudflare Pages

**Login institucional publicado:** alunos entram pelo Google em https://simuladores-prof-victor.pages.dev/entrar. A configuração e a validação estão registradas em [AUTH_SETUP.md](AUTH_SETUP.md). Novas instalações precisam configurar o banco e o cliente Google antes de publicar. Os endereços antigos de preview estão restritos à conta Cloudflare.

O projeto já está conectado ao repositório `VHSL-L/simuladores-prof-victor`; pushes em `main` acionam a publicação em https://simuladores-prof-victor.pages.dev. Para configurar outra instalação:

1. Envie este diretório para um repositório no GitHub.
2. No Cloudflare, acesse **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecione o repositório.
4. Use as configurações:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js: `22`
5. Publique o projeto.

O acesso direto às rotas usa o [fallback SPA nativo do Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering): não inclua um `404.html` na raiz. O arquivo `public/_redirects` documenta essa escolha, sem a regra curinga que causava aviso de loop. Os HTMLs e assets de cada simulador têm prioridade sobre o fallback.

## Rotas

- `/`
- `/ventilacao-mecanica`
- `/choque`
- `/rcp`
- `/bls`
- `/gasometria`
- `/ecg`
- `/eletrolitos`
- `/sobre`
- `/entrar`
- `/privacidade`
- `/professor/entrar`
- `/professor`

Início, Sobre, entradas e privacidade são públicos. O painel do professor usa a conta Google autorizada do responsável, mostra cadastros/últimas entradas e permite bloquear ou reativar alunos; não registra notas ou desempenho. Os sete simuladores e seus arquivos diretos exigem uma sessão válida de aluno UNC ou do professor autorizado. `npm run dev` é somente uma prévia visual, sem proteção de servidor; para testar autenticação, usar o Worker conforme `AUTH_SETUP.md`.

## Como adicionar um simulador

1. Crie um diretório independente em `src/simulators/<nome>`.
2. Coloque os assets públicos em `public/simulators/<nome>`.
3. Crie a página correspondente em `src/pages`.
4. Registre a rota em `src/App.tsx`.
5. Atualize o card na página inicial somente depois de validar o módulo.
6. Preserve o original e registre qualquer adaptação técnica no README do módulo.

Os módulos React usam entradas HTML próprias, registradas em `vite.config.ts`, para manter CSS e estados isolados. Consulte [MIGRATION.md](MIGRATION.md) para fontes, diferenças técnicas e dependências. A única requisição externa de apresentação é Google Fonts no módulo Choque; toda a lógica clínica roda localmente.

## Conteúdo clínico

Não altere silenciosamente textos, respostas, doses, ritmos, fluxos ou feedbacks dos simuladores. Mudanças clínicas precisam de revisão explícita do autor.

## Segurança e privacidade

- O identificador público do cliente Google é configurado na hospedagem. Tokens Google e tokens de sessão nunca entram no Git nem em logs; não há acesso a Gmail ou Drive.
- Não insira dados pessoais ou informações identificáveis de pacientes.
- As ferramentas são exclusivamente educacionais e não substituem julgamento profissional, protocolos institucionais ou diretrizes atualizadas.
