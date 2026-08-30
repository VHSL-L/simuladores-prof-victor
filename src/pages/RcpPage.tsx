import { PageMetadata } from "../components/PageMetadata";
import { SimulatorFrame } from "../components/SimulatorFrame";

export function RcpPage() {
  return (
    <>
      <PageMetadata
        title="Simulador de RCP"
        description="Simulação interativa de ressuscitação cardiopulmonar e tomada de decisão durante a parada cardiorrespiratória."
      />
      <section className="simulator-page">
        <div className="container simulator-heading">
          <div>
            <p className="eyebrow">Simulador disponível</p>
            <h1>Ressuscitação cardiopulmonar</h1>
            <p>
              Conduza um caso de PCR, reconheça os ritmos e determine a sequência
              das intervenções até o retorno da circulação espontânea.
            </p>
          </div>
          <a className="text-link" href="/">Voltar aos simuladores</a>
        </div>
        <div className="simulator-host">
          <SimulatorFrame />
        </div>
      </section>
    </>
  );
}
