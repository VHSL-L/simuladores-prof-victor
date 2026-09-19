import { PageMetadata } from "../components/PageMetadata";

export function AboutPage() {
  return (
    <>
      <PageMetadata
        title="Sobre"
        description="Conheça a proposta educacional dos Simuladores do Prof. Victor Hugo Sant'Ana."
      />
      <section className="simple-page container about-page">
        <p className="eyebrow">Sobre</p>
        <h1>Ferramentas para aprender fazendo</h1>
        <p className="lead">
          A plataforma reúne ferramentas interativas voltadas ao ensino,
          treinamento e raciocínio clínico em situações críticas.
        </p>

        <div className="about-grid">
          <section>
            <h2>Autor</h2>
            <p><strong>Prof. Victor Hugo Sant&apos;Ana</strong></p>
            <p>
              Médico formado pela Pontifícia Universidade Católica do Paraná
              (PUCPR), intensivista pela Associação de Medicina Intensiva Brasileira
              (AMIB), com MBA em Gestão em Saúde pela Fundação Getulio Vargas (FGV)
              e pós-graduação em Inteligência Artificial e Data Science em Saúde.
              Atua como médico intensivista, gestor de fluxos hospitalares e
              professor de Medicina.
            </p>
            <p>
              Sua trajetória reúne assistência ao paciente crítico, gestão
              hospitalar, ensino e tecnologia. Os simuladores deste projeto
              aproximam essas áreas por meio de ferramentas interativas voltadas
              ao aprendizado e ao desenvolvimento do raciocínio clínico.
            </p>
            <p>
              <a className="text-link" href="https://www.linkedin.com/in/vh-santana" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              {" · "}
              <a className="text-link" href="https://www.instagram.com/victorhugosantana/" target="_blank" rel="noopener noreferrer">Instagram</a>
            </p>
          </section>
          <section>
            <h2>Desenvolvimento</h2>
            <p>
              Inteligência artificial foi utilizada discretamente como
              ferramenta de apoio em etapas de desenvolvimento, programação e
              revisão. Não há integração com API de IA nos simuladores desta versão.
            </p>
          </section>
        </div>

        <section className="notice notice-full" id="aviso-importante">
          <div>
            <p className="eyebrow">Aviso importante</p>
            <h2>Limites de uso</h2>
          </div>
          <div>
            <p>
              Estas ferramentas foram desenvolvidas exclusivamente para fins
              educacionais e de treinamento. Não substituem avaliação clínica
              individual, julgamento profissional, protocolos institucionais ou
              consulta às diretrizes científicas atualizadas.
            </p>
            <p>
              O conteúdo clínico é revisado pelo autor, mas podem existir erros
              ou desatualizações. Antes de utilizar qualquer informação na
              assistência a um paciente, confirme-a em fontes científicas e
              protocolos atualizados.
            </p>
            <p>
              Não insira informações que permitam identificar pacientes ou outros
              dados pessoais ou sensíveis nos simuladores.
            </p>
          </div>
        </section>

        <section id="referencias" className="references">
          <h2>Referências</h2>
          <p>
            As referências clínicas específicas serão mantidas junto de cada
            simulador e revisadas conforme a evolução dos módulos.
          </p>
          <p>
            Os traçados de FV, TV e assistolia utilizados no simulador de RCP
            foram adaptados de arquivos de domínio público disponibilizados no
            Wikimedia Commons.
          </p>
        </section>
      </section>
    </>
  );
}
