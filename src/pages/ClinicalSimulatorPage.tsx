import { PageMetadata } from "../components/PageMetadata";
import { SimulatorFrame } from "../components/SimulatorFrame";

type Props = { slug: string; title: string; description: string; frameTitle: string };

export function ClinicalSimulatorPage({ slug, title, description, frameTitle }: Props) {
  const source = `/simulators/${slug}/index.html`;
  return (
    <>
      <PageMetadata title={`Simulador de ${title}`} description={description} />
      <section className="simulator-page">
        <div className="container simulator-heading">
          <div>
            <p className="eyebrow">Simulador disponível</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="simulator-links">
            <a className="text-link" href="/">Voltar aos simuladores</a>
            <a className="text-link" href={source} target="_blank" rel="noopener noreferrer">Abrir em tela própria ↗</a>
          </div>
        </div>
        <div className="simulator-host">
          <SimulatorFrame src={source} title={frameTitle} fixedViewport />
        </div>
      </section>
    </>
  );
}
