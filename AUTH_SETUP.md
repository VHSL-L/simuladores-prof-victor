# Acesso institucional UNC — ativação

Implementação preparada em `feature/unc-email-access`. Não publicar na produção antes de configurar e testar o envio real: esta versão protege os simuladores por padrão, mesmo se faltarem credenciais.

## Estado externo verificado em 08/11/2026

- Banco de produção `simuladores-auth` criado no plano gratuito da conta Cloudflare existente. ID: `245dc00a-18a1-4ee1-8409-5e336944140c`.
- As quatro tabelas (`users`, `login_codes`, `sessions`, `auth_limits`) e os índices da migração foram criados; a listagem das quatro tabelas foi conferida no console.
- Vínculo de produção `AUTH_DB` salvo no projeto `simuladores-prof-victor`; passa a valer na próxima publicação.
- Configuração de produção alterada de `Fail open` para `Fail closed` e confirmada no painel.
- Nenhuma versão nova publicada; não foram criados segredos ou enviados e-mails reais.
- Pendente: domínio/remetente, conta e chave do serviço de envio, `AUTH_SECRET`, banco separado e configurações de preview, proteção dos deployments antigos e teste completo de entrega antes de publicar.
- `simuladoresdovictor.com` foi cotado no painel por US$ 11,17/ano, renovação indicada no mesmo valor, antes de impostos. Não comprado. O checkout tem renovação automática marcada por padrão e não tem dados de titular cadastrados; aguardar escolha do usuário.

## Arquitetura

- Cloudflare Pages advanced mode: `dist/_worker.js` intercepta **todas** as requisições. `dist/_routes.json` não tem exclusões.
- D1 armazena contas, hashes de sessão, desafios de código e limites temporários.
- Resend envia códigos de 6 dígitos por um remetente de domínio verificado. O domínio do remetente NÃO precisa ser UNC; o domínio de destino é exatamente `aluno.unc.br`.
- Somente `/`, `/sobre`, `/entrar`, `/privacidade` e os assets da plataforma enumerados no build são públicos. Arquivos de simulação não entram na lista pública. Source maps não são publicados.
- Código: 10 minutos, uso único, 5 tentativas por emissão. Reenvio: 60 segundos, até 5 solicitações por endereço/hora. Verificação: até 15 tentativas por endereço/hora. Limite adicional de 300 requisições/10 minutos por rede e 500 envios/hora no total. Ajustar esses limites e as cotas do provedor antes de uma turma grande usar simultaneamente. Os limites por janela são fixos, não deslizantes.
- Sessão: cookie `__Host-simuladores_session`, Secure, HttpOnly, SameSite=Lax, até 7 dias. Token opaco aleatório armazenado somente como SHA-256. Logout revoga no servidor. Conta bloqueada perde acesso imediatamente.
- Login UNC não depende de tarifa por assento, mas hospedagem, banco e envio têm cotas/possíveis cobranças próprias.
- `users.access_kind` reserva a categoria `paid`; ela ainda NÃO autoriza acesso. Assinaturas exigirão uma tabela de direitos e webhooks verificados do provedor de pagamento. Nenhum pagamento ou lista de espera é implementado agora.
- O histórico atual registra apenas criação da conta e último login; não registra desempenho clínico.

## Configuração externa necessária

1. Escolher um domínio próprio e um remetente (ex.: `acesso@auth.DOMINIO`). Não registrar compras nem usar o domínio UNC sem autorização do responsável.
2. Verificar o domínio no Resend por DNS. Desativar rastreamento de abertura/cliques nos códigos. Confirmar que o plano suporta o volume da turma; os limites do código não substituem as cotas do provedor.
3. Criar banco D1 exclusivo, aplicar `migrations/0001_auth.sql` e vinculá-lo no Pages com o nome `AUTH_DB`. Usar banco separado para preview.
4. Configurar no Pages (não em Vite, arquivos públicos ou Git):
   - `AUTH_SECRET`: segredo aleatório com pelo menos 32 caracteres, como Secret.
   - `RESEND_API_KEY`: chave restrita ao envio pelo domínio escolhido, como Secret.
   - `AUTH_EMAIL_FROM`: remetente verificado (texto).
5. Recompilar com `npm run build`. A etapa `scripts/build-worker.mjs` é obrigatória. A configuração do projeto existente já usa este comando.
6. Validar em preview: receber um código real em um e-mail UNC autorizado pelo titular, entrar, abrir cada módulo e link direto, sair e tentar reabrir o link direto. Confirmar também a rota de erro de domínio externo. Nenhum bypass/test code está no Worker de produção.
7. Só então publicar em `main`. Manter bloqueada a alternativa de falha aberta de Pages Functions (fail closed) para que esgotamento da cota não libere arquivos.
8. Proteger previews antigos e a URL de produção anterior usando as opções de acesso da Cloudflare. Versões antigas continuam contendo os simuladores públicos; a nova proteção não reescreve deployments históricos ou cópias já baixadas.

## Desenvolvimento e verificação

`npm test` compila e executa testes de autenticação sobre SQLite real (Node 22.13+ com `node:sqlite`) e os testes clínicos existentes. O provedor de e-mail é interceptado exclusivamente no teste; nenhuma mensagem real é enviada.

`npm run dev`/`npm run preview` servem somente a interface: NÃO simulam a barreira de autenticação. Para validar o Worker use `wrangler pages dev dist --d1 AUTH_DB=<banco-local>` após aplicar a migração local e configurar os segredos em `.dev.vars` (ignorado pelo Git). Preferir o preview hospedado para validar cookies Secure e entrega real de e-mail.

## Administração

Não há painel administrativo nesta etapa. No D1, bloquear uma conta por `users.status='blocked'` revoga o acesso em todas as sessões. Para excluir uma conta, remover seus códigos e a linha de usuário; sessões são removidas por cascata. Não expor o D1 ao navegador.

Os registros temporários expirados são limpos de forma probabilística nas requisições de páginas (aproximadamente 1/256). Sem tráfego, a limpeza aguarda a próxima manutenção; os registros expirados já não autorizam acesso. Em implantação maior, adicionar uma tarefa agendada de limpeza.

Referências: https://developers.cloudflare.com/pages/functions/advanced-mode/ ; https://developers.cloudflare.com/pages/functions/bindings/ ; https://resend.com/docs/dashboard/domains/introduction
