import { PageMetadata } from "../components/PageMetadata";
import { SimulatorCard } from "../components/SimulatorCard";

export function HomePage() {
  return (
    <>
      <PageMetadata
        title="Início"
        description="Simuladores clínicos interativos para ensino e treinamento em situações críticas."
      />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Ensino médico interativo</p>
            <h1>Treine decisões clínicas, passo a passo.</h1>
            <p className="hero-copy">
              Ferramentas independentes para praticar raciocínio, sequência de
              atendimento e tomada de decisão em situações críticas.
            </p>
            <a className="button primary" href="/rcp">Começar pelo RCP</a>
          </div>
          <aside className="hero-note" aria-label="Características da plataforma">
            <p>Treino autoguiado</p>
            <p>Feedback imediato</p>
            <p>Funciona no celular</p>
          </aside>
        </div>
      </section>

      <section className="section container" aria-labelledby="simuladores-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Simuladores</p>
            <h2 id="simuladores-title">Escolha uma área para treinar</h2>
          </div>
          <p>Novos módulos serão incorporados sem alterar os simuladores já validados.</p>
        </div>
        <div className="simulator-grid">
          <SimulatorCard
            index="01"
            title="Ventilação Mecânica"
            description="Treinamento de raciocínio e tomada de decisão em ventilação mecânica."
          />
          <SimulatorCard
            index="02"
            title="Choque"
            description="Avaliação e tomada de decisão no atendimento ao paciente em choque."
          />
          <SimulatorCard
            index="03"
            title="RCP"
            description="Simulação interativa de ressuscitação cardiopulmonar e tomada de decisão durante a parada cardiorrespiratória."
            href="/rcp"
            available
          />
        </div>
      </section>

      <section className="section container" id="aviso-importante">
        <div className="notice">
          <div>
            <p className="eyebrow">Aviso importante</p>
            <h2>Uso exclusivamente educacional</h2>
          </div>
          <p>
            Estas ferramentas não substituem avaliação clínica individual,
            julgamento profissional, protocolos institucionais ou consulta às
            diretrizes científicas atualizadas. Não insira dados pessoais ou
            informações que permitam identificar pacientes.
          </p>
          <a href="/sobre#aviso-importante">Ler aviso completo</a>
        </div>
      </section>
    </>
  );
}
