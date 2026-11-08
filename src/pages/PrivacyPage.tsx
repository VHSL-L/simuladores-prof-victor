import { PageMetadata } from '../components/PageMetadata';
export function PrivacyPage() {
  return <>
    <PageMetadata title="Privacidade no acesso" description="Como funciona a identificação para acessar os simuladores." />
    <section className="simple-page container privacy-page">
      <p className="eyebrow">Área do aluno</p><h1>Privacidade no acesso</h1>
      <h2>O que é usado para entrar</h2>
      <p>O Google confirma sua identidade e o vínculo da conta com o domínio institucional. Guardamos o e-mail, o identificador da conta Google, um identificador interno, a categoria e situação do acesso e as datas de criação e último login. Não armazenamos sua foto, sua senha, nem o comprovante de identidade enviado pelo Google. O site não solicita acesso à caixa de e-mail, contatos ou arquivos do Google Drive.</p>
      <h2>Cookies e sessão</h2>
      <p>Um cookie temporário de até 10 minutos vincula a tentativa de entrada a este navegador. Após a confirmação, outro cookie necessário mantém sua sessão por até 7 dias. Use “Sair” ao terminar em um computador compartilhado. Os identificadores temporários são armazenados no banco somente como resumos criptográficos, e a tentativa de entrada só pode ser concluída uma vez.</p>
      <h2>Serviços e segurança</h2>
      <p>A hospedagem e o banco de acesso usam a Cloudflare. A página de entrada carrega o serviço de identificação do Google; a confirmação acontece na conta Google escolhida por você. Limitamos tentativas para reduzir abusos. Para isso, usamos um identificador temporário derivado do endereço de rede, que muda diariamente; não guardamos esse endereço em texto aberto no banco de acesso. Registros temporários de tentativas, sessões e limites são removidos após expirar durante a manutenção automática.</p>
      <h2>Uso educacional</h2>
      <p>Este controle de acesso não registra respostas, notas ou desempenho nos simuladores. Não insira dados de pacientes nas ferramentas.</p>
      <h2>Contato</h2>
      <p>Para dúvidas sobre o uso do seu e-mail ou para solicitar exclusão da conta, entre em contato com o professor pelos canais da <a className="text-link" href="/sobre">página Sobre</a>.</p>
    </section>
  </>;
}
