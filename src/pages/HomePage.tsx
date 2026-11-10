import { PageMetadata } from "../components/PageMetadata";
import { learningPath } from "../data/learning-path";
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
            <p className="eyebrow">Medicina intensiva · Ensino e prática</p>
            <h1>Simulação clínica.</h1>
            <p className="hero-copy">
              Um espaço para estudar condutas, testar decisões e discutir o
              atendimento ao paciente crítico.
            </p>
            <a className="text-link" href="#simuladores-title">Explorar os simuladores <span aria-hidden="true">↓</span></a>
          </div>
          <aside className="hero-note" aria-label="Sobre o professor">
            <p className="eyebrow">Do professor</p>
            <h2>Victor Hugo Sant&apos;Ana</h2>
            <p>Médico intensivista e professor de Medicina.</p>
            <a className="text-link" href="/sobre">Conheça o projeto <span aria-hidden="true">↗</span></a>
          </aside>
        </div>
      </section>

      <section className="section container" aria-labelledby="simuladores-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Biblioteca de prática</p>
            <h2 id="simuladores-title">Simuladores</h2>
          </div>
          <p>Percurso sugerido, do atendimento inicial ao suporte avançado.<br />Você pode abrir qualquer módulo. Acesso gratuito para alunos da UNC.</p>
        </div>
        <div className="simulator-grid">
          {learningPath.map((module, index) => <SimulatorCard key={module.href} index={String(index + 1).padStart(2, '0')} {...module} available />)}
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
