import { PageMetadata } from '../components/PageMetadata';
export function PrivacyPage() {
  return <>
    <PageMetadata title="Privacidade no acesso" description="Como funciona a identificação para acessar os simuladores." />
    <section className="simple-page container privacy-page">
      <p className="eyebrow">Área do aluno</p><h1>Privacidade no acesso</h1>
      <h2>O que é usado para entrar</h2>
      <p>Seu e-mail institucional é usado para enviar o código de acesso e identificar sua conta. Guardamos o e-mail, um identificador interno, a categoria e situação do acesso e as datas de criação e último login. Não pedimos uma senha.</p>
      <h2>Códigos e sessão</h2>
      <p>O código vale por 10 minutos e só pode ser usado uma vez. Após a confirmação, um cookie necessário mantém a sessão por até 7 dias neste navegador. Use “Sair” ao terminar em um computador compartilhado. O código e o identificador da sessão não são armazenados em texto aberto no banco de dados.</p>
      <h2>Envio e segurança</h2>
      <p>A hospedagem e a verificação de acesso usam a Cloudflare. O envio de códigos é preparado para o serviço Resend, que recebe o endereço de destino e a mensagem de autenticação. Limitamos tentativas para reduzir abusos; o endereço de rede é transformado em um identificador criptográfico para essa finalidade. Registros temporários de códigos, sessões e limites são removidos após expirar durante a manutenção automática.</p>
      <h2>Uso educacional</h2>
      <p>Este controle de acesso não registra respostas, notas ou desempenho nos simuladores. Não insira dados de pacientes nas ferramentas.</p>
      <h2>Contato</h2>
      <p>Para dúvidas sobre o uso do seu e-mail ou para solicitar exclusão da conta, entre em contato com o professor pelos canais da <a className="text-link" href="/sobre">página Sobre</a>.</p>
    </section>
  </>;
}
