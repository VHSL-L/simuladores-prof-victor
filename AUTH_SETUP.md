# Acesso institucional UNC pelo Google

A versão em `feature/unc-email-access` usa Google Identity Services, Cloudflare Pages e D1. Não precisa comprar domínio nem contratar envio de e-mail. Publicar somente depois de configurar a identidade Google, as migrações e testar uma conta institucional real em preview. A proteção permanece fechada se a configuração estiver incompleta.

## Estado verificado em 08/11/2026

- Produção ainda é a versão anterior, com a biografia. Esta implementação não foi publicada.
- D1 de produção `simuladores-auth`, ID `245dc00a-18a1-4ee1-8409-5e336944140c`, com as migrações `0001_auth.sql` e `0002_google.sql` aplicadas; tabela de desafios e índices Google conferidos no console.
- Vínculo de produção `AUTH_DB` salvo no Pages e configuração de falhas `Fail closed` confirmada. Valem na próxima publicação.
- Projeto Google `simuladores-prof-victor` e cliente Web criados; nome público “Simuladores do Prof. Victor” e contato de suporte autorizado pelo titular. Nenhum plano pago ou compra de domínio contratado.
- `GOOGLE_CLIENT_ID` salvo em produção como texto público. Identificador: `46205128024-qcm69oadhdfpfus07mjbu3s3mr19asbs.apps.googleusercontent.com`. O segredo do cliente não é usado nem armazenado pela aplicação.
- Google Auth Platform confirmado como **Em produção**, somente identificação básica, sem escopos de Gmail/Drive.
- D1 separado `simuladores-auth-preview` criado, ID `7e3b1dcf-0dff-4e5f-8fdf-2027d47f032f`, com as duas migrações. `AUTH_DB` e `GOOGLE_CLIENT_ID` salvos no ambiente Preview; `Fail closed` conferido.
- Primeiro build da branch publicado com sucesso na Cloudflare. Alias: `https://feature-unc-email-access.simuladores-prof-victor.pages.dev`. Nova publicação aplica as configurações de preview.
- Teste institucional real confirmado pelo titular: entrou com conta de aluno, abriu um simulador e saiu normalmente. As rotas públicas e a proteção dos links diretos dos três módulos também foram verificadas na prévia hospedada.
- Versão validada pronta para promoção a `main`; proteção dos deployments antigos será conferida na ativação.

## Fluxo e limites

1. A tela carrega o botão oficial do Google. A aplicação só usa identificação básica, sem autorização para Gmail, Drive ou contatos.
2. O Worker emite um desafio aleatório, vinculado ao navegador por cookie Secure/HttpOnly e armazenado como SHA-256 no D1. Validade: 10 minutos.
3. O Google devolve uma credencial assinada. O servidor usa `jose` para conferir assinatura RS256 com as chaves públicas do Google, emissor, destinatário, expiração, idade, identificador `sub` e nonce. Também exige e-mail verificado, domínio do e-mail exatamente `aluno.unc.br` e domínio Workspace `hd` exatamente `aluno.unc.br`. A dica `hd` do botão não substitui essa conferência no servidor.
4. O desafio é consumido atomicamente, impedindo replay, e é criada uma sessão de até 7 dias. A identidade é vinculada ao `sub` estável; não se vinculam contas diferentes somente porque possuem o mesmo e-mail.
5. O cookie `__Host-simuladores_session` é Secure, HttpOnly, SameSite=Lax, com caminho `/`. O banco guarda só o hash do token aleatório. Sair revoga a sessão; novo login no mesmo navegador revoga a sessão anterior. Contas bloqueadas perdem acesso imediatamente.

O fluxo com a regra atual de domínio Workspace foi validado pelo titular usando uma conta de aluno. Se a UNC usar um domínio primário diferente de `aluno.unc.br`, investigar a organização antes de alterar a regra; nunca aceitar qualquer `hd` nem validar apenas texto informado pelo navegador.

As APIs de login exigem POST JSON e Origin exata, limitam o corpo a 8 KiB e aplicam até 300 solicitações por rede a cada 10 minutos. O identificador da rede é um hash que muda diariamente; não é anonimização irreversível. Esse limite considera turmas compartilhando uma rede. Não armazenamos o token Google, foto ou conteúdo da conta.

## Proteção dos simuladores

- `dist/_worker.js` intercepta todas as requisições; `dist/_routes.json` não possui exclusões.
- Públicos: `/`, `/sobre`, `/entrar`, `/privacidade`, favicon e dependências enumeradas da interface principal. Todos os outros arquivos, incluindo HTML/JS dos simuladores, exigem sessão.
- Sem source maps publicados. Respostas são `private, no-store`.
- Manter Pages Functions em `Fail closed` evita servir arquivos privados se a cota esgotar.
- Configurar restrição dos previews antigos antes de anunciar proteção completa. Deployments históricos e cópias já baixadas não são reescritos pelo novo Worker.

## Configuração externa

1. No Google Auth Platform, criar cliente **Aplicativo da Web** no projeto do site, apenas para identificação Google. Origens JavaScript: produção `https://simuladores-prof-victor.pages.dev`, preview `https://feature-unc-email-access.simuladores-prof-victor.pages.dev` e, para validação local, `http://localhost` e `http://localhost:4173`. Não são necessários URIs de redirecionamento nem uso do segredo do cliente no fluxo GIS por callback.
2. Nome de consentimento consistente com o site, contato de suporte autorizado e privacidade em `/privacidade`. Publicar o aplicativo para o público externo no Google antes da liberação geral; a restrição UNC continua no servidor. Não pedir permissões sensíveis. Não contratar teste de faturamento para esse fluxo.
3. Aplicar `0001_auth.sql` e depois `0002_google.sql` uma única vez no D1 apropriado. Na produção existente, aplicar apenas `0002`, após verificar o esquema. A segunda migração preserva a tabela antiga `login_codes`, sem nenhum endpoint ativo de OTP.
4. Vincular o D1 como `AUTH_DB` e definir `GOOGLE_CLIENT_ID` como texto no Pages. É um identificador público; não é senha. Criar banco separado para preview. Não são necessários `AUTH_SECRET`, `RESEND_API_KEY` ou `AUTH_EMAIL_FROM`.
5. Compilar com `npm run build` ou `pnpm run build`. A etapa final empacota `jose` e o Worker com Vite e injeta a lista pública de assets. Nunca publicar apenas o build da interface.
6. Em preview HTTPS, testar a entrada real com conta `@aluno.unc.br`, cada simulador, links diretos e saída; verificar bloqueio de conta pessoal. Nenhum usuário ou token de teste deve ser criado no banco de produção.
7. Publicar em `main` somente após validação. Manter a origem de preview controlada; novas origens exigem cadastro no Google. Configurações Google podem demorar a propagar.

## Desenvolvimento e verificação

Requer Node 22.13+ (testes usam `node:sqlite`). `npm test` compila e executa testes clínicos e de acesso. Os testes usam SQLite real e credenciais assinadas por uma chave efêmera exclusiva do processo de teste. A resposta de chaves públicas é interceptada apenas no teste; o Worker publicado usa exclusivamente as chaves do Google.

`npm run dev` e `npm run preview` servem só a interface, sem controle de acesso. Para executar o Worker, usar `wrangler pages dev dist` com D1 local migrado, `GOOGLE_CLIENT_ID` em `.dev.vars` ignorado pelo Git e porta 4173 cadastrada no Google. Login completo deve ser validado também em HTTPS.

## Administração e evolução

Não há painel administrativo nesta etapa. Bloqueio em `users.status='blocked'` revoga acesso imediatamente. Exclusão de usuário remove sessões por cascata. Desafios, sessões e limites expirados são limpos durante requisições de páginas (aproximadamente 1/256); sem tráfego aguardam manutenção, mas já não autorizam acesso. Em escala maior, adicionar limpeza agendada.

A categoria `paid` está reservada, mas não autoriza acesso. Monetização exigirá direitos de acesso, pagamentos e webhooks verificados, sem confiar em campos enviados pelo navegador. Nenhuma assinatura ou cobrança foi implementada. O histórico atual registra criação e último login, sem respostas ou desempenho clínico.

Google Identity Services não exige serviço de envio de e-mail. Cloudflare Pages/Workers e D1 possuem cotas próprias; acompanhar consumo antes de aumentar turmas. A gratuidade inicial não é promessa de capacidade ilimitada.

Referências: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token ; https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid ; https://developers.cloudflare.com/pages/functions/advanced-mode/
