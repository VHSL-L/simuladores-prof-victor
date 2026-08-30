# Simuladores do Prof. Victor Hugo Sant'Ana

Plataforma web estática para reunir simuladores clínicos voltados ao ensino, treinamento e raciocínio em situações críticas.

## Primeira versão

- RCP: disponível e importado como cópia isolada do simulador original.
- Ventilação Mecânica: rota preparada, módulo pendente de importação.
- Choque: rota preparada, módulo pendente de importação.

## Tecnologia

- React 19
- TypeScript
- Vite
- Aplicação estática, sem backend, banco de dados, autenticação ou API de IA
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

O teste executa o build e confere a presença das rotas, do simulador importado e dos arquivos necessários para o Cloudflare Pages.

## Publicação no Cloudflare Pages

1. Envie este diretório para um repositório no GitHub.
2. No Cloudflare, acesse **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecione o repositório.
4. Use as configurações:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js: `22`
5. Publique o projeto.

O arquivo `public/_redirects` é copiado para `dist/_redirects` e garante que o acesso direto às rotas da aplicação funcione no Cloudflare Pages.

## Rotas

- `/`
- `/ventilacao-mecanica`
- `/choque`
- `/rcp`
- `/sobre`

## Como adicionar um simulador

1. Crie um diretório independente em `src/simulators/<nome>`.
2. Coloque os assets públicos em `public/simulators/<nome>`.
3. Crie a página correspondente em `src/pages`.
4. Registre a rota em `src/App.tsx`.
5. Atualize o card na página inicial somente depois de validar o módulo.
6. Preserve o original e registre qualquer adaptação técnica no README do módulo.

## Conteúdo clínico

Não altere silenciosamente textos, respostas, doses, ritmos, fluxos ou feedbacks dos simuladores. Mudanças clínicas precisam de revisão explícita do autor.

## Segurança e privacidade

- Não há credenciais, secrets ou chaves de API neste projeto.
- Não insira dados pessoais ou informações identificáveis de pacientes.
- As ferramentas são exclusivamente educacionais e não substituem julgamento profissional, protocolos institucionais ou diretrizes atualizadas.
