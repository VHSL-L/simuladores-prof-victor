# Acesso institucional UNC pelo Google

A versão publicada em `main` usa Google Identity Services, Cloudflare Pages e D1. Não precisa comprar domínio nem contratar envio de e-mail. Em novas instalações, configurar a identidade Google, as migrações e validar uma conta institucional antes de publicar. A proteção permanece fechada se a configuração estiver incompleta.

## Estado verificado em 08/11/2026

- Login Google publicado em produção: `https://simuladores-prof-victor.pages.dev/entrar`. Build confirmado na Cloudflare; páginas públicas, disponibilidade da autenticação e proteção dos links diretos dos três simuladores verificadas no endereço principal.
- D1 de produção `simuladores-auth`, ID `245dc00a-18a1-4ee1-8409-5e336944140c`, com as migrações `0001_auth.sql` e `0002_google.sql` aplicadas; tabela de desafios e índices Google conferidos no console.
- Vínculo de produção `AUTH_DB` salvo no Pages e configuração de falhas `Fail closed` confirmada. Aplicados à publicação principal.
- Projeto Google `simuladores-prof-victor` e cliente Web criados; nome público “Simuladores do Prof. Victor” e contato de suporte autorizado pelo titular. Nenhum plano pago ou compra de domínio contratado.
- `GOOGLE_CLIENT_ID` salvo em produção como texto público. Identificador: `46205128024-qcm69oadhdfpfus07mjbu3s3mr19asbs.apps.googleusercontent.com`. O segredo do cliente não é usado nem armazenado pela aplicação.
- Google Auth Platform confirmado como **Em produção**, somente identificação básica, sem escopos de Gmail/Drive.
- D1 separado `simuladores-auth-preview` criado, ID `7e3b1dcf-0dff-4e5f-8fdf-2027d47f032f`, com as duas migrações. `AUTH_DB` e `GOOGLE_CLIENT_ID` salvos no ambiente Preview; `Fail closed` conferido.
- Prévia publicada e validada no alias `https://feature-unc-email-access.simuladores-prof-victor.pages.dev`. Após o teste, previews foram restringidos à conta Cloudflare; alunos devem usar o endereço principal.
- Teste institucional real confirmado pelo titular: entrou com conta de aluno, abriu um simulador e saiu normalmente. As rotas públicas e a proteção dos links diretos dos três módulos também foram verificadas na prévia hospedada.
- Política Cloudflare Access ativada para previews (`7916ab22-819b-464b-a8a1-b05097d7d7a5`). Os quatro deployments públicos antigos (`6fbacf0e`, `5c6a5842`, `665b1cb5`, `01abea42`) e o alias de teste agora redirecionam para autenticação Cloudflare, sem servir os arquivos diretamente. O endereço principal continua com o login Google dos alunos.
- Migração `0003_professor.sql` aplicada e conferida nos D1 de produção e preview antes da publicação do painel; campos de função/versão, tabela de auditoria e índices presentes.
- Painel publicado em `https://simuladores-prof-victor.pages.dev/professor`, commit `fc72a97`, deploy de produção `529b05e7-76ed-4ad2-b1b1-79e22337a97d` aprovado. Entrada do professor e privacidade respondem normalmente; APIs administrativas rejeitam sessão ausente, simuladores continuam protegidos. Entrada real do titular confirmada com a conta autorizada; painel autenticado observado no endereço principal. Lista inicial vazia em produção, sem cadastros fictícios ou alteração de alunos reais.
- Validação automatizada: build e 30 testes aprovados, incluindo assinatura, domínio, expiração, replay, origem, bloqueio, sessão e preservação dos simuladores.

## Fluxo e limites

1. A tela carrega o botão oficial do Google. A aplicação só usa identificação básica, sem autorização para Gmail, Drive ou contatos.
2. O Worker emite um desafio aleatório, vinculado ao navegador por cookie Secure/HttpOnly e armazenado como SHA-256 no D1. Validade: 10 minutos.
3. O Google devolve uma credencial assinada. O servidor usa `jose` para conferir assinatura RS256 com as chaves públicas do Google, emissor, destinatário, expiração, idade, identificador `sub` e nonce. Para alunos, também exige e-mail verificado, domínio do e-mail exatamente `aluno.unc.br` e domínio Workspace `hd` exatamente `aluno.unc.br`. A dica `hd` do botão não substitui essa conferência no servidor.
4. O desafio é consumido atomicamente, impedindo replay, e é criada uma sessão de até 7 dias para alunos ou 8 horas para o professor. A identidade é vinculada ao `sub` estável; não se vinculam contas diferentes somente porque possuem o mesmo e-mail.
5. O cookie `__Host-simuladores_session` é Secure, HttpOnly, SameSite=Lax, com caminho `/`. O banco guarda só o hash do token aleatório. Sair revoga a sessão; novo login no mesmo navegador revoga a sessão anterior. Contas bloqueadas perdem acesso imediatamente.

O fluxo com a regra atual de domínio Workspace foi validado pelo titular usando uma conta de aluno. Se a UNC usar um domínio primário diferente de `aluno.unc.br`, investigar a organização antes de alterar a regra; nunca aceitar qualquer `hd` nem validar apenas texto informado pelo navegador.

As APIs de login exigem POST JSON e Origin exata, limitam o corpo a 8 KiB e aplicam até 300 solicitações por rede a cada 10 minutos. O identificador da rede é um hash que muda diariamente; não é anonimização irreversível. Esse limite considera turmas compartilhando uma rede. Não armazenamos o token Google, foto ou conteúdo da conta.

## Proteção dos simuladores

- Biblioteca ampliada para sete módulos. `/bls`, `/gasometria`, `/ecg` e `/eletrolitos`, seus HTMLs e o bundle clínico compartilhado exigem sessão. O retorno após login mantém a rota escolhida. A ampliação não acrescenta permissões, migrações, registro de respostas ou envio de mensagens.
- `dist/_worker.js` intercepta todas as requisições; `dist/_routes.json` não possui exclusões.
- Públicos: `/`, `/sobre`, `/entrar`, `/privacidade`, `/professor/entrar`, favicon e dependências enumeradas da interface principal. Todos os outros arquivos, incluindo HTML/JS dos simuladores, exigem sessão.
- Sem source maps publicados. Respostas são `private, no-store`.
- Manter Pages Functions em `Fail closed` evita servir arquivos privados se a cota esgotar.
- Os previews e deployments antigos estão restritos pela política Cloudflare Access, conferida também por requisições sem sessão. Essa política não altera o login do endereço principal. Cópias previamente baixadas não são reescritas pelo Worker.

## Configuração externa

1. No Google Auth Platform, criar cliente **Aplicativo da Web** no projeto do site, apenas para identificação Google. Origens JavaScript: produção `https://simuladores-prof-victor.pages.dev`, preview `https://feature-unc-email-access.simuladores-prof-victor.pages.dev` e, para validação local, `http://localhost` e `http://localhost:4173`. Não são necessários URIs de redirecionamento nem uso do segredo do cliente no fluxo GIS por callback.
2. Nome de consentimento consistente com o site, contato de suporte autorizado e privacidade em `/privacidade`. Publicar o aplicativo para o público externo no Google antes da liberação geral; a restrição UNC continua no servidor. Não pedir permissões sensíveis. Não contratar teste de faturamento para esse fluxo.
3. Aplicar `0001_auth.sql`, `0002_google.sql` e `0003_professor.sql`, nesta ordem, uma única vez no D1 apropriado. Em uma instalação existente, conferir o esquema e aplicar somente as pendentes **antes** de publicar o novo Worker. A terceira migração é aditiva: preserva alunos e sessões existentes, define a função padrão `student` e acrescenta o registro de alterações. A segunda mantém `login_codes`, sem endpoint ativo de OTP.
4. Vincular o D1 como `AUTH_DB` e definir `GOOGLE_CLIENT_ID` como texto no Pages. É um identificador público; não é senha. Criar banco separado para preview. Não são necessários `AUTH_SECRET`, `RESEND_API_KEY` ou `AUTH_EMAIL_FROM`.
5. Compilar com `npm run build` ou `pnpm run build`. A etapa final empacota `jose` e o Worker com Vite e injeta a lista pública de assets. Nunca publicar apenas o build da interface.
6. Autorizar o responsável pelo teste na política Cloudflare Access do preview. Em preview HTTPS, testar a entrada real com conta `@aluno.unc.br`, cada simulador, links diretos e saída; verificar bloqueio de conta pessoal. Nenhum usuário ou token de teste deve ser criado no banco de produção.
7. Publicar em `main` somente após validação. Manter a origem de preview controlada; novas origens exigem cadastro no Google. Configurações Google podem demorar a propagar.

## Desenvolvimento e verificação

Requer Node 22.13+ (testes usam `node:sqlite`). `npm test` compila e executa testes clínicos e de acesso. Os testes usam SQLite real e credenciais assinadas por uma chave efêmera exclusiva do processo de teste. A resposta de chaves públicas é interceptada apenas no teste; o Worker publicado usa exclusivamente as chaves do Google.

`npm run dev` e `npm run preview` servem só a interface, sem controle de acesso. Para executar o Worker, usar `wrangler pages dev dist` com D1 local migrado, `GOOGLE_CLIENT_ID` em `.dev.vars` ignorado pelo Git e porta 4173 cadastrada no Google. Login completo deve ser validado também em HTTPS.

## Administração e evolução

O painel `/professor` permite consultar cadastros, totais, últimas entradas, buscar por e-mail, filtrar acesso e paginar 25 alunos por vez. A entrada é `/professor/entrar`. Somente `santana.lourenco@gmail.com`, autorizada pelo titular e definida em `server/access-policy.mjs`, recebe a função `professor` após conferir a credencial Google e o e-mail verificado. Gmail é autenticado pelo próprio Google; a exigência de Workspace `hd` continua obrigatória para alunos. O navegador não pode escolher ou promover funções. Todas as APIs administrativas conferem sessão, função e e-mail exato no servidor.

A sessão do professor expira em 8 horas. Bloqueio e reativação pedem confirmação, exigem Origin exata e verificam a versão do cadastro para impedir sobrescrita entre telas desatualizadas. Uma transação D1 altera o status, registra autor/data/status anterior e novo em `access_changes` e exclui as sessões daquele aluno. Reativar exige novo login; cookies antigos nunca voltam a autorizar. O professor não pode alterar a própria conta nem criar outro administrador por esse painel. Nenhuma mensagem é enviada. Os totais excluem a conta do professor e a categoria paga.

A validação inclui 62 alunos fictícios em SQLite local, concorrência, reversão da transação se a auditoria falhar, rejeição de alunos e sessões expiradas, busca e paginação. A prévia de interface usa dados fictícios somente no processo local; nenhum dado de teste é publicado. Não há alterações de acesso em alunos reais para fins de teste. Exclusão de usuário remove sessões por cascata. Desafios, sessões e limites expirados são limpos durante requisições de páginas (aproximadamente 1/256); sem tráfego aguardam manutenção, mas já não autorizam acesso. Em escala maior, adicionar limpeza agendada.

A categoria `paid` está reservada, mas não autoriza acesso. Monetização exigirá direitos de acesso, pagamentos e webhooks verificados, sem confiar em campos enviados pelo navegador. Nenhuma assinatura ou cobrança foi implementada. O histórico atual registra criação e último login, sem respostas ou desempenho clínico.

Google Identity Services não exige serviço de envio de e-mail. Cloudflare Pages/Workers e D1 possuem cotas próprias; acompanhar consumo antes de aumentar turmas. A gratuidade inicial não é promessa de capacidade ilimitada.

Referências: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token ; https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid ; https://developers.cloudflare.com/pages/functions/advanced-mode/
