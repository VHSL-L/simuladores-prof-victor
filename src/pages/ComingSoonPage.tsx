import { PageMetadata } from "../components/PageMetadata";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <>
      <PageMetadata title={title} description={description} />
      <section className="simple-page container">
        <p className="eyebrow">Em preparação</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="pending-panel">
          <strong>Em breve</strong>
          <p>Este módulo será incorporado em uma próxima etapa.</p>
        </div>
        <a className="button primary" href="/">Voltar ao início</a>
      </section>
    </>
  );
}
